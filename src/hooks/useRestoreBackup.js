// ============================================================================
// HOOK DE RESTAURACIÓN DE RESPALDOS
// ============================================================================
// Complemento de `handleExportBackupGeneral`. Ese genera el JSON; este lo lee y
// lo vuelve a escribir.
//
// Reglas que guían todo este hook:
//
// 1. NADA se escribe hasta que el usuario vio la vista previa. Restaurar es la
//    operación más destructiva del sistema y el error más caro sería empezar a
//    tocar la base antes de que nadie haya visto qué se va a cambiar.
//
// 2. Se restaura en el orden de dependencias (usuarios y funcionarios antes que
//    los bienes que los referencian) para que un fallo a mitad no deje
//    referencias rotas.
//
// 3. Se escribe por lotes de 500 y se registra el error de CADA llamada. Un
//    solo `await` sin destructurar el `error` pasa por alto los fallos de
//    Postgres: el cliente de Supabase resuelve con { error } en vez de tirar.
//
// 4. El sello `updated_at` va con la hora actual (ver armarLote) para que los
//    clientes abiertos se enteren por el canal delta.
// ============================================================================
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  analizarRespaldo, previsualizarRestauracion, armarLote,
  dividirEnLotes, calcularPerdidas, TABLAS_RESTORABLES, ORDEN_RESTAURACION
} from '../services/restore';

const TAMANO_LOTE = 500;

export const useRestoreBackup = ({ notify, registrarAuditoria, currentUser, dependenciaActual }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analisis, setAnalisis] = useState(null);       // salida de analizarRespaldo
  const [previa, setPrevia] = useState(null);           // salida de previsualizarRestauracion
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [modo, setModo] = useState('merge');            // 'merge' | 'reemplazar'
  const [tablasElegidas, setTablasElegidas] = useState({});
  const [progreso, setProgreso] = useState(null);       // {tabla, hechas, total, texto}
  const [ejecutando, setEjecutando] = useState(false);
  const [resultado, setResultado] = useState(null);     // {tablas: [{clave, ok, error}], avisos}
  const fileRef = useRef(null);

  const cerrar = useCallback(() => {
    if (ejecutando) return; // no cerrar a mitad de una escritura
    setIsOpen(false);
    setAnalisis(null);
    setPrevia(null);
    setResultado(null);
    setProgreso(null);
    setNombreArchivo('');
    setTablasElegidas({});
    setModo('merge');
    if (fileRef.current) fileRef.current.value = '';
  }, [ejecutando]);

  /** Lee el archivo elegido, lo valida y arma la vista previa. */
  const manejarArchivo = useCallback(async (archivo) => {
    if (!archivo) return;
    setResultado(null);
    setAnalisis(null);
    setPrevia(null);
    try {
      const texto = await archivo.text();
      // Un respaldo de 1800 bienes pesa algunos MB; JSON.parse bloquearía el
      // hilo unos cientos de ms. Aceptable para una operación de administración.
      const crudo = JSON.parse(texto);
      const res = analizarRespaldo(crudo);
      setAnalisis(res);
      setNombreArchivo(archivo.name);

      if (!res.ok) {
        notify(res.error || 'El archivo no se pudo leer como respaldo.', 'error');
        return;
      }

      // Vista previa contra lo que hay HOY en la base. Solo se consulta lo
      // necesario: el detalle de cada tabla y las claves existentes para
      // calcular pérdidas, no el contenido completo.
      const existentes = {};
      for (const t of TABLAS_RESTORABLES) {
        const entrantes = res.tablas[t.clave] || [];
        if (entrantes.length === 0) { existentes[t.clave] = []; continue; }
        const pkTexto = entrantes.map(f => String(f[t.pk]));
        const { data, error } = await supabase.from(t.tabla).select(t.pk).in(t.pk, pkTexto.slice(0, 1000));
        if (error) {
          notify(`No se pudo leer "${t.etiqueta}" para comparar: ${error.message}. La vista previa puede ser inexacta.`, 'warning');
          existentes[t.clave] = [];
          continue;
        }
        existentes[t.clave] = (data || []).map(f => ({ [t.pk]: String(f[t.pk]) }));
      }

      const p = previsualizarRestauracion(res.tablas, existentes);
      setPrevia(p);

      // Por defecto se ticked todo lo que realmente hace algo.
      const elegidas = {};
      ORDEN_RESTAURACION.forEach((c) => { elegidas[c] = !!p[c]?.hayCambios; });
      setTablasElegidas(elegidas);

      const conCambios = Object.values(p).filter(d => d.hayCambios).length;
      notify(
        conCambios === 0
          ? 'El respaldo coincide con la base actual: no hay nada que restaurar.'
          : `Respaldo leído: ${res.totalFilas} filas en ${conCambios} tabla(s) con cambios.`,
        conCambios === 0 ? 'warning' : 'success'
      );
    } catch (e) {
      console.error('Error al leer el respaldo:', e);
      setAnalisis(null);
      notify('El archivo no es un JSON válido.', 'error');
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [notify]);

  /** Alterna una tabla del lote a restaurar. */
  const alternarTabla = useCallback((clave) => {
    setTablasElegidas(prev => ({ ...prev, [clave]: !prev[clave] }));
  }, []);

  /** Lo que se perdería en modo reemplazo, por tabla elegida. */
  const perdidasPorTabla = useCallback(async () => {
    if (modo !== 'reemplazar' || !analisis) return {};
    const salida = {};
    for (const t of TABLAS_RESTORABLES) {
      if (!tablasElegidas[t.clave]) continue;
      const entrantes = analisis.tablas[t.clave] || [];
      const { data, error } = await supabase.from(t.tabla).select(t.pk);
      if (error) continue;
      salida[t.clave] = calcularPerdidas(entrantes, (data || []).map(f => ({ [t.pk]: f[t.pk] })), t.pk);
    }
    return salida;
  }, [modo, analisis, tablasElegidas]);

  /** Ejecuta la restauración. Sólo se llama desde la confirmación final. */
  const ejecutar = useCallback(async () => {
    if (!analisis?.ok || ejecutando) return;
    setEjecutando(true);
    setResultado(null);

    const claves = ORDEN_RESTAURACION.filter(c => tablasElegidas[c]);
    if (claves.length === 0) {
      setEjecutando(false);
      notify('No hay ninguna tabla seleccionada.', 'warning');
      return;
    }

    const porTabla = [];
    const errores = [];

    try {
      // --- Modo reemplazo: borrar lo que no viene en el archivo, ANTES de
      // escribir. Si se hiciera después, un fallo a medio camino dejaría la tabla
      // vacía sin los datos del respaldo.
      if (modo === 'reemplazar') {
        for (const clave of claves) {
          const t = TABLAS_RESTORABLES.find(x => x.clave === clave);
          const entrantes = analisis.tablas[clave] || [];
          const { data: actuales, error: errLee } = await supabase.from(t.tabla).select(t.pk);
          if (errLee) { errores.push(`${t.etiqueta}: no se pudo leer lo actual (${errLee.message}).`); continue; }
          const aBorrar = calcularPerdidas(entrantes, (actuales || []).map(f => ({ [t.pk]: f[t.pk] })), t.pk);
          if (aBorrar.length === 0) continue;
          setProgreso({ tabla: t.etiqueta, hechas: 0, total: aBorrar.length, texto: 'Borrando lo que no viene en el archivo...' });
          for (const lote of dividirEnLotes(aBorrar, 200)) {
            const { error } = await supabase.from(t.tabla).delete().in(t.pk, lote);
            if (error) { errores.push(`${t.etiqueta}: no se pudo borrar ${lote.length} fila(s) (${error.message}).`); break; }
          }
        }
      }

      // --- Escritura por lotes, en orden de dependencias.
      for (const clave of claves) {
        const t = TABLAS_RESTORABLES.find(x => x.clave === clave);
        const filas = analisis.tablas[clave] || [];
        if (filas.length === 0) continue;

        const lotes = dividirEnLotes(filas, TAMANO_LOTE);
        let escritas = 0;
        let falloTabla = null;

        for (const lote of lotes) {
          const { filas: paraEscribir } = armarLote(clave, lote);
          setProgreso({ tabla: t.etiqueta, hechas: escritas, total: filas.length, texto: `Escribiendo ${escritas} de ${filas.length}...` });

          // upsert en vez de dos llamadas: una sola ida y vuelta por lote, lo
          // que además importa en el plan free (egress por request, no por fila).
          const { error } = await supabase
            .from(t.tabla)
            .upsert(paraEscribir, { onConflict: t.pk });
          if (error) { falloTabla = `${t.etiqueta}: ${error.message}`; break; }
          escritas += lote.length;
        }

        porTabla.push({ clave, etiqueta: t.etiqueta, ok: !falloTabla, escritas, error: falloTabla });
        if (falloTabla) errores.push(falloTabla);
      }

      // --- Auditoría de la restauración. Va al final y nunca debe impedir que
      // se informen los resultados: se captura su propio error.
      try {
        await registrarAuditoria({
          usuario: currentUser?.username || 'Admin',
          dependencia: dependenciaActual || 'SISTEMA',
          accion: 'RESTAURAR_RESPALDO',
          entidad: 'SISTEMA',
          entidadId: 'RESTORE',
          detalles: {
            archivo: nombreArchivo,
            modo,
            tablas: claves,
            resultado: porTabla.map(p => `${p.etiqueta}: ${p.ok ? `${p.escritas} filas` : 'ERROR'}`)
          }
        });
      } catch (e) {
        console.error('Restauración hecha pero sin auditoría:', e);
      }

      setResultado({ tablas: porTabla, errores });

      if (errores.length === 0) {
        notify(`Restauración completa: ${porTabla.reduce((s, p) => s + p.escritas, 0)} filas escritas en ${porTabla.length} tabla(s).`, 'success');
      } else {
        notify(`Restauración con errores en ${errores.length} tabla(s). Revisá el detalle.`, 'error');
      }
    } catch (e) {
      console.error('Error en la restauración:', e);
      setResultado({ tablas: porTabla, errores: [...errores, `Error general: ${e.message}`] });
      notify(`La restauración se interrumpió: ${e.message}`, 'error');
    } finally {
      setEjecutando(false);
      setProgreso(null);
    }
  }, [analisis, ejecutando, modo, tablasElegidas, registrarAuditoria, currentUser, dependenciaActual, nombreArchivo, notify]);

  const totalFilasElegidas = useCallback(() => {
    if (!analisis?.ok) return 0;
    return ORDEN_RESTAURACION.reduce((s, c) => (tablasElegidas[c] ? s + (analisis.tablas[c]?.length || 0) : s), 0);
  }, [analisis, tablasElegidas]);

  return {
    isRestoreOpen: isOpen,
    openRestore: setIsOpen,
    cerrarRestore: cerrar,
    analisis, previa, nombreArchivo, modo, setModo,
    tablasElegidas, alternarTabla,
    progreso, ejecutando, resultado,
    fileRef, manejarArchivo, ejecutar, totalFilasElegidas, perdidasPorTabla
  };
};