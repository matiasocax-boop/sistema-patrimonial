import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { normalizeStr, parseDateInfo } from '../utils/helpers';
import { extraerCodigoQR } from '../utils/qr';
import { buildActaAuditoriaPDF } from '../utils/pdfGenerators';
import { registrarAuditoria } from '../services/auditService';

// Dominio de auditoría: libro de eventos + conciliación + muestreo
// (extraído de App.jsx, Fase 6). La vista AuditoriaView recibe los mismos
// nombres, así que no cambia nada visual.
//
// Parámetros:
// - bienes, fc10List, fc11List, funcionariosPadron, dependenciaActual,
//   currentUser, ubicacionesUnicas, activeTab, isAdmin: datos y contexto.
// - notify: addToast estable. resolveLogoImg: helper de logos de App.
export function useAuditoria({
  bienes, fc10List, fc11List, funcionariosPadron, dependenciaActual,
  currentUser, ubicacionesUnicas, activeTab, isAdmin, notify, resolveLogoImg,
  setIsProcessing
}) {
  // Auditoría (solo admin): libro de eventos + conciliación física + muestreo aleatorio
  const [auditoriaList, setAuditoriaList] = useState([]);
  const [isLoadingAud, setIsLoadingAud] = useState(false);
  const [searchAud, setSearchAud] = useState('');
  const [filtroAccionAud, setFiltroAccionAud] = useState('');
  const [conteoCodigos, setConteoCodigos] = useState([]);
  const [conteoInput, setConteoInput] = useState('');
  const [muestraN, setMuestraN] = useState(10);
  const [muestraUbicacion, setMuestraUbicacion] = useState('');
  const [conteoUbicacion, setConteoUbicacion] = useState('');
  const [muestra, setMuestra] = useState([]);
  const [verificadosMuestra, setVerificadosMuestra] = useState({});
  const PAGE_AUD = 50;
  const [paginaAud, setPaginaAud] = useState(1);
  const [totalAud, setTotalAud] = useState(0);
  const [alcanceAud, setAlcanceAud] = useState('dep');
  const [kpisAud, setKpisAud] = useState({ total: 0, altas: 0, mods: 0, bajas: 0 });
  const [accionesUnicasAud, setAccionesUnicasAud] = useState([]);
  const limpiarBusquedaAud = (texto) => String(texto || '').replace(/[%(),.]/g, ' ').replace(/\s+/g, ' ').trim();
  // Higiene de auditoría: retención de 5 días. Se ejecuta como máximo una
  // vez al día al entrar al libro (solo admin). Borra eventos con fecha
  // anterior al corte, en lotes para no saturar. Se conservan siempre las
  // bajas, aprobaciones/rechazos y eliminaciones (rastro legal).
  const RETENCION_AUD_MS = 5 * 24 * 3600 * 1000;
  const ACCIONES_SENSIBLES = /BAJA|APROB|RECHAZ|ELIMIN/;
  const purgarAuditoriaVieja = async () => {
    try {
      const key = 'aud_purge_ts';
      const last = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (Date.now() - last < 24 * 3600 * 1000) return;
      localStorage.setItem(key, String(Date.now()));
      const corte = new Date(Date.now() - RETENCION_AUD_MS).toISOString();
      for (;;) {
        const { data, error } = await supabase.from('auditoria').select('id,accion').lt('fecha', corte).limit(500);
        if (error || !data || data.length === 0) break;
        const ids = data.filter(r => !ACCIONES_SENSIBLES.test(String(r.accion || ''))).map(r => r.id);
        if (ids.length > 0) await supabase.from('auditoria').delete().in('id', ids);
        if (data.length < 500) break;
      }
    } catch (e) {}
  };
  const fetchAuditoria = async (pagina = 1) => {
    const pag = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
    setIsLoadingAud(true);
    try {
      await purgarAuditoriaVieja();
      let q = supabase.from('auditoria').select('*', { count: 'exact' }).order('fecha', { ascending: false });
      if (alcanceAud === 'dep') q = q.eq('dependencia', dependenciaActual);
      if (filtroAccionAud) q = q.eq('accion', filtroAccionAud);
      if (searchAud.trim()) {
        const t = `%${limpiarBusquedaAud(searchAud).split(' ').filter(Boolean).join('%')}%`;
        q = q.or(`titulo.ilike.${t},mensaje.ilike.${t}`);
      }
      const from = (pag - 1) * PAGE_AUD;
      const { data, error, count } = await q.range(from, from + PAGE_AUD - 1);
      if (!error && data) {
        setAuditoriaList(data);
        setTotalAud(count || 0);
        setPaginaAud(pag);
      }
      // KPIs livianos del período (solo 2 columnas)
      try {
        const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
        let qk = supabase.from('auditoria').select('accion,fecha').gte('fecha', hace30).limit(2000);
        if (alcanceAud === 'dep') qk = qk.eq('dependencia', dependenciaActual);
        const { data: kd } = await qk;
        const cuenta = (re) => (kd || []).filter(r => re.test(String(r.accion || ''))).length;
        setKpisAud({ total: (kd || []).length, altas: cuenta(/CREA|ALTA/), mods: cuenta(/MODIF/), bajas: cuenta(/BAJA|ELIMINA/) });
      } catch (e) {}
      // Acciones distintas para el filtro
      try {
        const { data: ad } = await supabase.from('auditoria').select('accion').limit(1000);
        setAccionesUnicasAud([...new Set((ad || []).map(r => String(r.accion || 'OTROS')))].sort());
      } catch (e) {}
    } catch (e) {}
    finally { setIsLoadingAud(false); }
  };
  useEffect(() => {
    if (activeTab === 'auditoria' && isAdmin) fetchAuditoria(1);
  }, [activeTab, alcanceAud]);
  useEffect(() => {
    if (activeTab !== 'auditoria' || !isAdmin) return;
    const t = setTimeout(() => fetchAuditoria(1), 450);
    return () => clearTimeout(t);
  }, [searchAud, filtroAccionAud]);
  const actorAud = (row) => {
    if (row.usuario) return row.usuario;
    try {
      const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
      if (m && typeof m === 'object' && m.solicitante) return m.solicitante;
    } catch (e) {}
    return 'No registrado';
  };
  const detalleAudCorto = (row) => {
    try {
      const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
      if (m && typeof m === 'object') {
        if (m.cambios && m.cambios.anterior && m.cambios.nuevo) {
          const keys = Object.keys(m.cambios.nuevo).filter(k => JSON.stringify(m.cambios.nuevo[k]) !== JSON.stringify(m.cambios.anterior[k]));
          return keys.length ? `Campos: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '…' : ''}` : 'Registro actualizado';
        }
        const bits = [];
        if (m.solicitante) bits.push(m.solicitante);
        if (m.motivo) bits.push(m.motivo);
        if (m.descripcion) bits.push(String(m.descripcion).slice(0, 60));
        else if (m.rotulo) bits.push(`Rótulo ${m.rotulo}`);
        return bits.join(' · ');
      }
      return String(row.mensaje || '').slice(0, 120);
    } catch (e) { return String(row.mensaje || '').slice(0, 120); }
  };
  const tonoAccionAud = (accion) => {
    const a = String(accion || '').toUpperCase();
    if (a.includes('BAJA') || a.includes('ELIMINA')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (a.includes('CREA') || a.includes('ALTA')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (a.includes('MODIF')) return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20';
    if (a.includes('MUESTREO') || a.includes('CONCILIA')) return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };
  // Evolución del valor patrimonial: incorporado por mes (últimos 12 meses)
  const evolucionValor = useMemo(() => {
    const porMes = {};
    bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual)).forEach(b => {
      const { year, month } = parseDateInfo(b.fechaAdquisicion);
      if (!year || !month) return;
      const k = `${year}-${month}`;
      porMes[k] = (porMes[k] || 0) + (parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0);
    });
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ahora = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({
        key: k, etiqueta: `${nombres[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0'),
        valor: porMes[k] || 0
      });
    }
    return out;
  }, [bienes, dependenciaActual]);
  const maxEvolucion = Math.max(1, ...evolucionValor.map(e => e.valor));
  const formatoCortoGs = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toLocaleString('es-PY', { maximumFractionDigits: 1 })} M`;
    if (v >= 1000) return `${Math.round(v / 1000)} mil`;
    return String(v);
  };
  // Salud de datos: solo lectura (cero riesgo), detecta inconsistencias sin modificar nada
  const saludDatos = useMemo(() => {
    const idsBienes = new Set(bienes.map(b => b.id));
    const vistos = new Map();
    const duplicados = [];
    bienes.forEach(b => {
      const k = `${normalizeStr(b.dependencia)}||${normalizeStr(b.rotulo)}`;
      if (!b.rotulo || String(b.rotulo).trim() === '' || String(b.rotulo).trim() === 'S/R') return;
      if (vistos.has(k)) duplicados.push(b);
      else vistos.set(k, b.id);
    });
    // Posibles duplicados del padrón: mismo nombre normalizado, distinto registro
    const vistosFunc = new Map();
    const duplicadosFunc = [];
    funcionariosPadron.forEach(f => {
      const k = normalizeStr(f.nombre || '');
      if (!k) return;
      if (vistosFunc.has(k)) duplicadosFunc.push(f);
      else vistosFunc.set(k, f.id);
    });
    return [
      { id: 'dup', label: 'Rótulos duplicados', count: duplicados.length, detalle: duplicados.slice(0, 20), icon: 'fa-clone', box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      { id: 'dupfunc', label: 'Posibles duplicados en padrón', count: duplicadosFunc.length, detalle: duplicadosFunc.slice(0, 20), icon: 'fa-user-group', box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', esPadron: true },
      { id: 'fc10', label: 'FC-10 sin bien asociado', count: fc10List.filter(fc => fc.bienId && !idsBienes.has(fc.bienId)).length, detalle: [], icon: 'fa-file-signature', box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      { id: 'fc11', label: 'FC-11 sin bien asociado', count: fc11List.filter(fc => fc.bienId && !idsBienes.has(fc.bienId)).length, detalle: [], icon: 'fa-truck-fast', box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      { id: 'sindep', label: 'Bienes sin dependencia', count: bienes.filter(b => !String(b.dependencia || '').trim()).length, detalle: [], icon: 'fa-building-columns', box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20' },
      { id: 'sinfecha', label: 'Bienes sin fecha de adquisición', count: bienes.filter(b => !String(b.fechaAdquisicion || '').trim()).length, detalle: [], icon: 'fa-calendar-xmark', box: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
    ];
  }, [bienes, fc10List, fc11List]);
  const resultadoConteo = useMemo(() => {
    const base = bienes.filter(b =>
      normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) &&
      b.estadoConservacion !== 'De Baja' &&
      (!conteoUbicacion || String(b.ubicacion || '').trim() === conteoUbicacion)
    );
    const hallados = new Set();
    const noReg = [];
    conteoCodigos.forEach(code => {
      const f = base.find(b => b.id === code || normalizeStr(b.rotulo) === normalizeStr(code));
      if (f) hallados.add(f.id); else noReg.push(code);
    });
    return { total: base.length, hallados: hallados.size, faltantes: base.filter(b => !hallados.has(b.id)), noRegistrados: noReg };
  }, [conteoCodigos, bienes, dependenciaActual, conteoUbicacion]);
  const agregarCodigoConteo = (raw) => {
    const code = extraerCodigoQR(raw);
    if (!code) return;
    setConteoCodigos(prev => (prev.includes(code) ? prev : [...prev, code]));
    setConteoInput('');
  };
  const descargarActaConteoPDF = async () => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify('Cargando librerías PDF...', 'warning');
    setIsProcessing({ active: true, text: 'Generando acta de conciliación...' });
    try {
      const logo = await resolveLogoImg(dependenciaActual);
      const porId = new Map(bienes.map(b => [b.id, b]));
      const filas = [
        ...[...new Set(conteoCodigos)].map(code => {
          const b = [...porId.values()].find(x => x.id === code || normalizeStr(x.rotulo) === normalizeStr(code));
          return b
            ? { rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion, resultado: 'HALLADO' }
            : { rotulo: '-', descripcion: `Código no registrado: ${code}`, ubicacion: '-', resultado: 'NO REGISTRADO' };
        }),
        ...resultadoConteo.faltantes.map(b => ({ rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion, resultado: 'FALTANTE' }))
      ];
      const doc = await buildActaAuditoriaPDF({
        tipo: 'CONCILIACION',
        fecha: new Date().toISOString().split('T')[0],
        dependencia: dependenciaActual,
        alcance: conteoUbicacion || 'Toda la dependencia',
        auditor: currentUser?.nombre || currentUser?.username || '',
        resumen: `${resultadoConteo.hallados} hallados de ${resultadoConteo.total} · ${resultadoConteo.faltantes.length} faltantes · ${resultadoConteo.noRegistrados.length} no registrados`,
        filas, logoDataUrl: logo
      });
      doc.save(`Acta_Conciliacion_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      notify('Acta de conciliación generada.', 'success');
    } catch (e) {
      notify('Error al generar el acta: ' + (e.message || 'desconocido'), 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const descargarActaMuestreoPDF = async () => {
    if (muestra.length === 0) return notify('Genera primero la muestra.', 'warning');
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify('Cargando librerías PDF...', 'warning');
    setIsProcessing({ active: true, text: 'Generando acta de muestreo...' });
    try {
      const logo = await resolveLogoImg(dependenciaActual);
      const verif = Object.values(verificadosMuestra).filter(Boolean).length;
      const doc = await buildActaAuditoriaPDF({
        tipo: 'MUESTREO',
        fecha: new Date().toISOString().split('T')[0],
        dependencia: dependenciaActual,
        alcance: muestraUbicacion || 'Toda la dependencia',
        auditor: currentUser?.nombre || currentUser?.username || '',
        resumen: `${verif} verificados de ${muestra.length} muestreados`,
        filas: muestra.map(b => ({
          rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion,
          resultado: verificadosMuestra[b.id] ? 'VERIFICADO' : 'PENDIENTE'
        })),
        logoDataUrl: logo
      });
      doc.save(`Acta_Muestreo_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      notify('Acta de muestreo generada.', 'success');
    } catch (e) {
      notify('Error al generar el acta: ' + (e.message || 'desconocido'), 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const exportarConteoCSV = () => {
    const rows = [['Estado', 'Rotulo', 'Descripcion', 'Codigo detectado']];
    resultadoConteo.faltantes.forEach(b => rows.push(['FALTANTE', b.rotulo || '', `"${String(b.descripcion || '').replace(/"/g, '""')}"`, '']));
    resultadoConteo.noRegistrados.forEach(c => rows.push(['NO REGISTRADO', '', '', c]));
    const blob = new Blob(["\uFEFF" + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Conciliacion_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const guardarActaConteo = async () => {
    await registrarAuditoria({
      usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
      accion: 'CONCILIACION_FISICA', entidad: 'CONCILIACION', entidadId: null,
      detalles: { total: resultadoConteo.total, hallados: resultadoConteo.hallados, faltantes: resultadoConteo.faltantes.length, noRegistrados: resultadoConteo.noRegistrados.length }
    });
    notify('Acta de conciliación registrada en el libro.', 'success');
    fetchAuditoria();
  };
  const generarMuestra = () => {
    const base = bienes.filter(b =>
      normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) &&
      b.estadoConservacion !== 'De Baja' &&
      (!muestraUbicacion || String(b.ubicacion || '').trim() === muestraUbicacion)
    );
    if (base.length === 0) {
      notify('No hay bienes activos en ese alcance para muestrear.', 'warning');
      return;
    }
    const n = Math.max(1, Math.min(parseInt(muestraN, 10) || 10, base.length));
    const barajada = [...base].sort(() => Math.random() - 0.5);
    setMuestra(barajada.slice(0, n));
    setVerificadosMuestra({});
  };
  const guardarActaMuestreo = async () => {
    const verif = Object.values(verificadosMuestra).filter(Boolean).length;
    await registrarAuditoria({
      usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
      accion: 'MUESTREO_VERIFICACION', entidad: 'MUESTREO', entidadId: null,
      detalles: { total: muestra.length, verificados: verif, rotulos: muestra.map(b => b.rotulo) }
    });
    notify(`Muestreo registrado: ${verif}/${muestra.length} verificados.`, 'success');
    fetchAuditoria();
  };

  return {
    auditoriaList, isLoadingAud, searchAud, setSearchAud,
    filtroAccionAud, setFiltroAccionAud,
    conteoCodigos, setConteoCodigos, conteoInput, setConteoInput,
    muestraN, setMuestraN, muestraUbicacion, setMuestraUbicacion,
    conteoUbicacion, setConteoUbicacion, muestra, setMuestra,
    verificadosMuestra, setVerificadosMuestra,
    paginaAud, totalAud, alcanceAud, setAlcanceAud, kpisAud, accionesUnicasAud,
    fetchAuditoria, actorAud, detalleAudCorto, tonoAccionAud,
    evolucionValor, maxEvolucion, formatoCortoGs, saludDatos,
    resultadoConteo, agregarCodigoConteo,
    descargarActaConteoPDF, descargarActaMuestreoPDF, exportarConteoCSV,
    guardarActaConteo, generarMuestra, guardarActaMuestreo
  };
}
