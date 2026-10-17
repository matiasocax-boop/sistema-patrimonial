import { useState, useEffect } from 'react';
import { STYLES } from '../constants/appConstants';
import { TABLAS_RESTORABLES, ORDEN_RESTAURACION } from '../services/restore';

// ============================================================================
// MODAL DE RESTAURACIÓN DE RESPALDO
// ============================================================================
// Cuatro pasos visibles, en este orden y ninguno saltable:
//
//   1. Elegir archivo  → 2. Ver qué va a cambiar  → 3. Elegir tablas y modo
//   → 4. Confirmar y ejecutar
//
// El paso 2 es el que evita el daño: sin vista previa, "restaurar" es un botón
// que puede pisar 2000 filas por un archivo equivocado. Por eso los pasos 3 y
// 4 no están disponibles hasta que hubo análisis, y el botón de ejecutar pide
// una confirmación tipada cuando la operación es destructiva.
// ============================================================================

const Chip = ({ children, tono = 'zinc' }) => {
  const tonos = {
    zinc: 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300',
    verde: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    ambar: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    rojo: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
    azul: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${tonos[tono]}`}>
      {children}
    </span>
  );
};

export default function RestoreBackupModal({ restore }) {
  const {
    isRestoreOpen, cerrarRestore, analisis, previa, nombreArchivo,
    modo, setModo, tablasElegidas, alternarTabla,
    progreso, ejecutando, resultado, fileRef, manejarArchivo,
    ejecutar, totalFilasElegidas, perdidasPorTabla
  } = restore;

  if (!isRestoreOpen) return null;

  const hayAnalisis = !!analisis?.ok;
  const hayCambios = hayAnalisis && !!previa && ORDEN_RESTAURACION.some(c => previa[c]?.hayCambios);
  const totalSeleccionado = totalFilasElegidas();

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-3xl"}>
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-white/10 px-6 py-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                Restaurar copia de seguridad
              </h3>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Lee un archivo .json generado por este sistema y vuelve a escribir sus datos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarRestore}
            disabled={ejecutando}
            className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* --- PASO 1: archivo --- */}
          <section>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-[10px] text-white dark:text-zinc-900">1</span>
              Archivo de respaldo
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              disabled={ejecutando}
              onChange={(e) => manejarArchivo(e.target.files?.[0])}
              className="block w-full cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 focus:border-brand-primary focus:outline-none disabled:opacity-50"
            />
            {nombreArchivo && hayAnalisis && (
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <i className="fa-solid fa-file-lines text-zinc-400"></i>
                <span className="truncate">{nombreArchivo}</span>
                <Chip tono="verde">{analisis.totalFilas} filas</Chip>
                {analisis.metadata?.fechaGeneracion && (
                  <span className="text-[10px] font-medium text-zinc-400">
                    generado el {new Date(analisis.metadata.fechaGeneracion).toLocaleDateString('es-PY')}
                  </span>
                )}
              </p>
            )}
          </section>

          {/* Avisos del análisis (filas descartadas, respaldo viejo, etc.) */}
          {hayAnalisis && analisis.avisos.length > 0 && (
            <section className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/25 dark:bg-amber-500/5">
              {analisis.avisos.map((a, i) => (
                <p key={i} className={`text-[11px] font-semibold leading-snug ${/CRÍTICO/.test(a) ? 'text-rose-700 dark:text-rose-400' : 'text-amber-800 dark:text-amber-300'}`}>
                  <i className={`fa-solid ${/CRÍTICO/.test(a) ? 'fa-triangle-exclamation' : 'fa-circle-info'} mr-1.5`}></i>
                  {a}
                </p>
              ))}
            </section>
          )}

          {/* --- PASO 2: qué va a cambiar --- */}
          {hayAnalisis && (
            <section>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-[10px] text-white dark:text-zinc-900">2</span>
                Qué va a cambiar
              </label>

              {!hayCambios ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5 p-4 text-center">
                  <i className="fa-solid fa-circle-check text-emerald-500 text-xl"></i>
                  <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    El respaldo coincide con la base actual. No hay nada que restaurar.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-white/5 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <tr>
                        <th className="px-3 py-2 font-bold">Tabla</th>
                        <th className="px-2 py-2 text-right font-bold">Nuevas</th>
                        <th className="px-2 py-2 text-right font-bold">Actualizar</th>
                        <th className="px-2 py-2 text-right font-bold">Iguales</th>
                        <th className="px-3 py-2 font-bold">Restaurar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      {ORDEN_RESTAURACION.map((clave) => {
                        const d = previa?.[clave];
                        if (!d) return null;
                        const def = TABLAS_RESTORABLES.find(t => t.clave === clave);
                        const marcada = !!tablasElegidas[clave];
                        return (
                          <tr key={clave} className={marcada ? '' : 'opacity-45'}>
                            <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-100">
                              {d.etiqueta}
                              <span className="ml-1 text-[10px] font-medium text-zinc-400">{def?.tabla}</span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              {d.nuevas > 0 ? <Chip tono="verde">{d.nuevas}</Chip> : <span className="text-zinc-400">—</span>}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {d.actualizadas > 0 ? <Chip tono="ambar">{d.actualizadas}</Chip> : <span className="text-zinc-400">—</span>}
                            </td>
                            <td className="px-2 py-2 text-right text-zinc-400">{d.sinCambio}</td>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={marcada}
                                disabled={ejecutando || !d.hayCambios}
                                onChange={() => alternarTabla(clave)}
                                aria-label={`Restaurar ${d.etiqueta}`}
                                className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-brand-primary focus:ring-brand-primary disabled:cursor-not-allowed dark:border-white/20 dark:bg-white/10"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Detalle de los cambios de la tabla más grande, para que "12
                  actualizaciones" no sea una caja negra. */}
              {hayCambios && previa && (() => {
                const conDetalle = ORDEN_RESTAURACION
                  .map(c => previa[c])
                  .filter(d => d && d.cambios.length > 0)
                  .sort((a, b) => b.cambios.length - a.cambios.length)[0];
                if (!conDetalle) return null;
                return (
                  <details className="mt-2 group rounded-xl border border-zinc-200 dark:border-white/10">
                    <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5">
                      <i className="fa-solid fa-chevron-down mr-1.5 text-[9px] transition-transform group-open:rotate-180"></i>
                      Ver cambios de {String(conDetalle?.etiqueta || '').toLowerCase()} ({conDetalle.cambios.length}
                      {conDetalle.cambiosOcultos > 0 ? `+${conDetalle.cambiosOcultos}` : ''})
                    </summary>
                    <ul className="max-h-56 space-y-1 overflow-y-auto border-t border-zinc-100 px-3 py-2 dark:border-white/5">
                      {conDetalle.cambios.map((c) => (
                        <li key={c.pk} className="text-[11px] text-zinc-600 dark:text-zinc-300">
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-100">{c.pk}</span>
                          <span className="mx-1 text-zinc-400">→</span>
                          <span className="text-zinc-500 dark:text-zinc-400">{c.campos.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })()}
            </section>
          )}

          {/* --- PASO 3: modo --- */}
          {hayAnalisis && hayCambios && (
            <section>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-[10px] text-white dark:text-zinc-900">3</span>
                Cómo restaurar
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-xl border p-3 transition-colors ${modo === 'merge' ? 'border-brand-primary bg-brand-primary/5' : 'border-zinc-200 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="restore-modo" checked={modo === 'merge'} onChange={() => setModo('merge')} disabled={ejecutando}
                      className="h-4 w-4 cursor-pointer border-zinc-300 text-brand-primary focus:ring-brand-primary" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Combinando (recomendado)</span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                    Lo que viene en el archivo pisa al registro con la misma clave. Lo demás se conserva.
                  </p>
                </label>
                <label className={`cursor-pointer rounded-xl border p-3 transition-colors ${modo === 'reemplazar' ? 'border-rose-400 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/10' : 'border-zinc-200 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="restore-modo" checked={modo === 'reemplazar'} onChange={() => setModo('reemplazar')} disabled={ejecutando}
                      className="h-4 w-4 cursor-pointer border-zinc-300 text-rose-500 focus:ring-rose-500" />
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Reemplazar todo</span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                    Borra lo que no está en el archivo. Solo para volver a un estado anterior conocido.
                  </p>
                </label>
              </div>
              {modo === 'reemplazar' && <DetallePerdidas restore={restore} />}
            </section>
          )}

          {/* --- Progreso --- */}
          {ejecutando && progreso && (
            <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-500/25 dark:bg-sky-500/5">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-800 dark:text-sky-300">
                <span>{progreso.texto}</span>
                <span className="font-mono">{progreso.hechas}/{progreso.total}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-200/70 dark:bg-sky-500/20">
                <div className="h-full rounded-full bg-sky-500 transition-all duration-300" style={{ width: `${progreso.total ? (progreso.hechas / progreso.total) * 100 : 0}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-sky-700/80 dark:text-sky-400/80">
                No cierres la ventana ni la pestaña mientras restaura.
              </p>
            </section>
          )}

          {/* --- Resultado --- */}
          {resultado && (
            <section className={`rounded-xl border p-3 ${resultado.errores.length === 0 ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/5' : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/5'}`}>
              <p className={`text-xs font-bold ${resultado.errores.length === 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                <i className={`fa-solid ${resultado.errores.length === 0 ? 'fa-circle-check' : 'fa-triangle-exclamation'} mr-1.5`}></i>
                {resultado.errores.length === 0 ? 'Restauración completada' : `Restauración con ${resultado.errores.length} problema(s)`}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {resultado.tablas.map(t => (
                  <li key={t.clave} className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    <Chip tono={t.ok ? 'verde' : 'rojo'}>{t.ok ? 'OK' : 'Error'}</Chip>{' '}
                    {t.etiqueta}: {t.ok ? `${t.escritas} filas` : t.error}
                  </li>
                ))}
              </ul>
              {resultado.errores.length > 0 && (
                <p className="mt-2 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                  Las tablas con error quedaron como estaban. Podés volver a intentarlas con el mismo archivo.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Pie con acciones */}
        <div className="border-t border-zinc-100 px-6 py-4 dark:border-white/10">
          {ejecutando ? (
            <p className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Restaurando… no se puede cancelar a mitad de camino.
            </p>
          ) : resultado ? (
            <div className="flex justify-end">
              <button type="button" onClick={cerrarRestore} className={STYLES.btnPrimary}>
                Cerrar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {hayAnalisis && hayCambios
                  ? <>Se escribirán <strong className="font-bold text-zinc-700 dark:text-zinc-200">{totalSeleccionado}</strong> filas en {ORDEN_RESTAURACION.filter(c => tablasElegidas[c]).length} tabla(s).</>
                  : 'Elegí un archivo .json para ver qué se va a restaurar.'}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={cerrarRestore} className={STYLES.btnPrimary + " !bg-zinc-100 !text-zinc-700 dark:!bg-white/10 dark:!text-zinc-200 hover:!bg-zinc-200 dark:hover:!bg-white/20"}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutar}
                  disabled={!hayCambios || totalSeleccionado === 0}
                  className={STYLES.btnPrimary + (modo === 'reemplazar' ? ' !bg-rose-600 hover:!bg-rose-700' : '')}
                >
                  <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                  {modo === 'reemplazar' ? 'Reemplazar todo' : 'Restaurar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Detalle de lo que se perdería en modo reemplazo.
 *
 * Se calcula con una consulta aparte porque recién al elegir "reemplazar" tiene
 * sentido pagar esa lectura: son miles de claves y no hacen falta si el
 * administrador va a combinar.
 */
function DetallePerdidas({ restore }) {
  const { perdidasPorTabla } = restore;
  const [perdidas, setPerdidas] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    perdidasPorTabla().then(r => { if (vivo) { setPerdidas(r); setCargando(false); } });
    return () => { vivo = false; };
  }, [perdidasPorTabla]);

  const totalPerdidas = Object.values(perdidas || {}).reduce((s, v) => s + v.length, 0);
  if (cargando) {
    return <p className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"><i className="fa-solid fa-spinner fa-spin mr-1.5"></i>Calculando qué se perdería…</p>;
  }
  if (totalPerdidas === 0) {
    return <p className="mt-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"><i className="fa-solid fa-circle-check mr-1.5"></i>Nada se perdería: el archivo contiene todo lo que hay hoy.</p>;
  }
  return (
    <div className="mt-2 space-y-1 rounded-xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/25 dark:bg-rose-500/5">
      <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
        <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
        Se borrarán {totalPerdidas} registro(s) que no están en el archivo:
      </p>
      {Object.entries(perdidas).filter(([, v]) => v.length > 0).map(([clave, ids]) => (
        <p key={clave} className="text-[10px] font-medium text-rose-700/90 dark:text-rose-400/90">
          <span className="font-bold">{clave}</span>: {ids.slice(0, 12).join(', ')}
          {ids.length > 12 ? ` … y ${ids.length - 12} más` : ''}
        </p>
      ))}
      <p className="pt-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
        Descargá una copia nueva antes de seguir: esto no se puede deshacer.
      </p>
    </div>
  );
}