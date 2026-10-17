import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { normalizeStr, parseDateInfo, matchBienSearch } from '../utils/helpers';
import { ESTADOS_FC10, estadoInicialFC10 } from '../utils/fc10Firmas';

// Filtros, búsqueda, paginación y derivados del inventario (extraído de
// App.jsx, Fase 3 del split). La UI sigue usando los mismos nombres vía
// desestructuración, así que el JSX no cambia.
//
// Parámetros:
// - bienes, dependenciaActual, fc10List: datos crudos.
// - username: para la clave de vistas guardadas en localStorage.
// - notify: addToast (estable) para avisar al guardar vistas.
export const ITEMS_POR_PAGINA = 10;

export function useInventarioFiltros({ bienes, dependenciaActual, fc10List, username, notify }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [filtroFuncionario, setFiltroFuncionario] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroSubcuenta, setFiltroSubcuenta] = useState('');
  const [filtroAnalitico1, setFiltroAnalitico1] = useState('');
  const [filtroAnalitico2, setFiltroAnalitico2] = useState('');
  const [filtroQR, setFiltroQR] = useState('ALL');
  const [filtroFC10, setFiltroFC10] = useState('ALL');
  const [filtroEstado, setFiltroEstado] = useState('ALL');
  // Bandeja de pendientes: '' | sinQR | sinFC10 | sinUbicacion | sinFuncionario | vidaVencida
  const [filtroPendiente, setFiltroPendiente] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  // Orden de la tabla: null = orden natural por rótulo; si no { campo, dir }.
  // campo: 'rotulo' | 'valor' | 'fecha'. dir: 'asc' | 'desc'.
  const [orden, setOrden] = useState(null);
  // Tamaño de página configurable (10/20/50) + selección múltiple + vista.
  const [itemsPorPagina, setItemsPorPagina] = useState(() => {
    // Solo se aceptan los tamaños soportados: un valor sucio en localStorage
    // (p. ej. -5) producía slice() negativo y totalPages inválido.
    try {
      const n = parseInt(localStorage.getItem('inv_page_size') || '10', 10);
      return [10, 20, 50].includes(n) ? n : 10;
    } catch { return 10; }
  });
  const [seleccionados, setSeleccionados] = useState([]);
  const [vistaInv, setVistaInv] = useState(() => {
    try { return localStorage.getItem('inv_vista') || 'tabla'; } catch { return 'tabla'; }
  });
  const cambiarPaginaTam = useCallback((n) => {
    setItemsPorPagina(n);
    try { localStorage.setItem('inv_page_size', String(n)); } catch {}
    setCurrentPage(1);
  }, []);
  const cambiarVistaInv = useCallback((v) => {
    setVistaInv(v);
    try { localStorage.setItem('inv_vista', v); } catch {}
  }, []);
  const toggleSeleccion = useCallback((id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const limpiarSeleccion = useCallback(() => setSeleccionados([]), []);
  // Al cambiar los filtros o la dependencia, la selección vieja no aplica.
// Todas las variables de filtrado van en la lista: faltaban filtroMes,
// filtroAnalitico1/2, filtroQR y filtroPendiente, así que al marcar un chip de
// la bandeja (por ejemplo "Sin QR") la barra seguía diciendo "N seleccionados"
// y la baja masiva daba de baja bienes que ya no se veían en pantalla.
useEffect(() => {
    setSeleccionados([]);
  }, [dependenciaActual, searchTerm, filtroFuncionario, filtroUbicacion, filtroAnio, filtroMes, filtroSubcuenta, filtroAnalitico1, filtroAnalitico2, filtroFC10, filtroEstado, filtroQR, filtroPendiente]);
  const alternarOrden = useCallback((campo) => {
    setOrden(prev => {
      if (!prev || prev.campo !== campo) return { campo, dir: campo === 'valor' ? 'desc' : 'asc' };
      if (prev.dir === 'asc') return { campo, dir: 'desc' };
      return null;
    });
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFiltroFuncionario(''); setFiltroUbicacion(''); setFiltroAnio('');
    setFiltroMes(''); setFiltroSubcuenta(''); setFiltroAnalitico1('');
    setFiltroAnalitico2(''); setFiltroQR('ALL'); setFiltroFC10('ALL');
    setFiltroEstado('ALL'); setFiltroPendiente(''); setSearchInput(''); setSearchTerm(''); setOrden(null); setCurrentPage(1);
    setSeleccionados([]);
  }, []);

  const hasFilters = Boolean(
    searchTerm || filtroFuncionario || filtroUbicacion || filtroAnio ||
    filtroMes || filtroSubcuenta || filtroAnalitico1 || filtroAnalitico2 ||
    filtroQR !== 'ALL' || filtroFC10 !== 'ALL' || filtroEstado !== 'ALL' || filtroPendiente
  );

  // ==========================================================================
  // FILTROS COMPARTIBLES POR URL (?q=&estado=&dep=...)
  // --------------------------------------------------------------------------
  // Al aplicar filtros se escriben en el query string; al montar (o al
  // cambiar la dependencia) se leen. Así un link abre exactamente la vista
  // que compartiste. Se usa replaceState para no llenar el historial del
  // navegador con cada pulsación del usuario.
  // ==========================================================================
  const URL_KEYS = {
    q: 'searchTerm', func: 'filtroFuncionario', ubi: 'filtroUbicacion',
    anio: 'filtroAnio', mes: 'filtroMes', sub: 'filtroSubcuenta',
    a1: 'filtroAnalitico1', a2: 'filtroAnalitico2',
    qr: 'filtroQR', fc10: 'filtroFC10', est: 'filtroEstado', pend: 'filtroPendiente'
  };
  // Setters y valores actuales, resueltos por reflection sobre el scope del hook
  // para no duplicar la lista de estados a mano (menos sitios que se desincronicen).
  const SETTERS = {
    searchTerm: setSearchTerm, filtroFuncionario: setFiltroFuncionario,
    filtroUbicacion: setFiltroUbicacion, filtroAnio: setFiltroAnio, filtroMes: setFiltroMes,
    filtroSubcuenta: setFiltroSubcuenta, filtroAnalitico1: setFiltroAnalitico1,
    filtroAnalitico2: setFiltroAnalitico2, filtroQR: setFiltroQR,
    filtroFC10: setFiltroFC10, filtroEstado: setFiltroEstado, filtroPendiente: setFiltroPendiente
  };
  const VALORES = {
    searchTerm: debouncedSearchTerm, filtroFuncionario, filtroUbicacion,
    filtroAnio, filtroMes, filtroSubcuenta, filtroAnalitico1, filtroAnalitico2,
    filtroQR, filtroFC10, filtroEstado, filtroPendiente
  };
  const leerUrl = useCallback(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const salida = {};
      for (const [clave, estado] of Object.entries(URL_KEYS)) {
        const v = p.get(clave);
        if (v !== null && v !== '') salida[estado] = v;
      }
      return salida;
    } catch (e) { return {}; }
  }, []);

  // Aplicar los filtros que vengan en la URL, una sola vez al entrar.
  // Antes esta lógica dependedía de un flag que solo se activaba si la URL ya
  // traía parámetros: entrando por la vía normal el flag quedaba en false y
  // el efecto que ESPEJA los filtros hacia la URL nunca corría, así que
  // "Copiar link" copiaba una URL sin filtros.
  const refUrlAplicada = useRef(false);
  useEffect(() => {
    if (refUrlAplicada.current) return;
    const desdeUrl = leerUrl();
    if (Object.keys(desdeUrl).length === 0) return;
    refUrlAplicada.current = true;
    for (const [estado, valor] of Object.entries(desdeUrl)) {
      SETTERS[estado]?.(valor);
    }
    if (desdeUrl.searchTerm) setSearchInput(desdeUrl.searchTerm);
  }, [dependenciaActual, username, leerUrl]);

  // Espejar los filtros actuales hacia la URL. Se usa debouncedSearchTerm
  // (igual que el filtrado real) para no escribir 250 ms tarde el valor viejo.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      for (const [clave, estado] of Object.entries(URL_KEYS)) {
        const valor = VALORES[estado];
        // Los estados "vacíos" no viajan: la URL queda legible.
        if (valor === '' || valor === null || valor === undefined || valor === 'ALL') p.delete(clave);
        else p.set(clave, String(valor));
      }
      const qs = p.toString();
      const nueva = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', nueva);
    } catch (e) { /* el navegador puede bloquear replaceState; no es crítico */ }
  }, [
    debouncedSearchTerm, filtroFuncionario, filtroUbicacion, filtroAnio, filtroMes,
    filtroSubcuenta, filtroAnalitico1, filtroAnalitico2,
    filtroQR, filtroFC10, filtroEstado, filtroPendiente
  ]);

  // "Copiar link" de la vista actual.
  const urlFiltrosActual = useCallback(() => {
    try { return window.location.href; } catch (e) { return ''; }
  }, []);

  // Vistas guardadas por usuario (foto de filtros con nombre)
  const [vistasGuardadas, setVistasGuardadas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`vistas_${username || 'anon'}`) || '[]'); } catch (e) { return []; }
  });
  const [nombreVista, setNombreVista] = useState('');
  const [mostrarGuardarVista, setMostrarGuardarVista] = useState(false);

  // El hook vive siempre montado en App: antes del login `username` era
  // undefined (clave `vistas_anon`) y, al entrar otro usuario, se leían y
  // pisaban las vistas del anterior. Se recarga la lista al cambiar de usuario.
  useEffect(() => {
    let vivo = true;
    try {
      const raw = JSON.parse(localStorage.getItem(`vistas_${username || 'anon'}`) || '[]');
      if (vivo) setVistasGuardadas(Array.isArray(raw) ? raw : []);
    } catch (e) {
      if (vivo) setVistasGuardadas([]);
    }
    return () => { vivo = false; };
  }, [username]);
  const guardarVistaActual = useCallback(() => {
    const nombre = nombreVista.trim();
    if (!nombre) return;
    const foto = {
      nombre,
      f: {
        funcionario: filtroFuncionario, ubicacion: filtroUbicacion, anio: filtroAnio, mes: filtroMes,
        subcuenta: filtroSubcuenta, analitico1: filtroAnalitico1, analitico2: filtroAnalitico2,
        estado: filtroEstado, qr: filtroQR, fc10: filtroFC10, pendiente: filtroPendiente, q: searchTerm
      }
    };
    setVistasGuardadas(prev => {
      const nuevas = [...prev.filter(v => v.nombre !== nombre), foto].slice(-8);
      try { localStorage.setItem(`vistas_${username || 'anon'}`, JSON.stringify(nuevas)); } catch (e) {}
      return nuevas;
    });
    setNombreVista('');
    setMostrarGuardarVista(false);
    if (notify) notify(`Vista "${nombre}" guardada.`, 'success');
  }, [nombreVista, filtroFuncionario, filtroUbicacion, filtroAnio, filtroMes, filtroSubcuenta, filtroAnalitico1, filtroAnalitico2, filtroEstado, filtroQR, filtroFC10, filtroPendiente, searchTerm, username, notify]);

  const aplicarVista = useCallback((v) => {
    clearAllFilters();
    const f = v.f || {};
    setFiltroFuncionario(f.funcionario || ''); setFiltroUbicacion(f.ubicacion || '');
    setFiltroAnio(f.anio || ''); setFiltroMes(f.mes || '');
    setFiltroSubcuenta(f.subcuenta || ''); setFiltroAnalitico1(f.analitico1 || ''); setFiltroAnalitico2(f.analitico2 || '');
    setFiltroEstado(f.estado || 'ALL'); setFiltroQR(f.qr || 'ALL'); setFiltroFC10(f.fc10 || 'ALL');
    setFiltroPendiente(f.pendiente || '');
    setSearchTerm(f.q || ''); setSearchInput(f.q || '');
    setCurrentPage(1);
  }, [clearAllFilters]);

  const eliminarVista = useCallback((nombre) => {
    setVistasGuardadas(prev => {
      const nuevas = prev.filter(v => v.nombre !== nombre);
      try { localStorage.setItem(`vistas_${username || 'anon'}`, JSON.stringify(nuevas)); } catch (e) {}
      return nuevas;
    });
  }, [username]);

  const funcionariosUnicos = useMemo(() => {
      const funcMap = new Map();
      bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && String(b.funcionario).trim() !== "").forEach(b => {
          const val = String(b.funcionario).trim();
          const key = normalizeStr(val);
          if(!funcMap.has(key)) funcMap.set(key, val);
      });
      return Array.from(funcMap.values()).sort();
  }, [bienes, dependenciaActual]);

  const ubicacionesUnicas = useMemo(() => {
      const ubiMap = new Map();
      bienes.filter(b => b.dependencia === dependenciaActual && b.ubicacion && String(b.ubicacion).trim() !== "").forEach(b => {
          const val = String(b.ubicacion).trim();
          const key = normalizeStr(val);
          if(!ubiMap.has(key)) ubiMap.set(key, val);
      });
      fc10List.filter(fc => fc.dependencia === dependenciaActual && fc.entregadoLugar).forEach(fc => {
          const val = String(fc.entregadoLugar).trim();
          const key = normalizeStr(val);
          if(!ubiMap.has(key)) ubiMap.set(key, val);
      });
      return Array.from(ubiMap.values()).sort();
  }, [bienes, fc10List, dependenciaActual]);

  const aniosUnicos = useMemo(() => { const years = bienes.filter(b => b.dependencia === dependenciaActual && b.fechaAdquisicion).map(b => parseDateInfo(b.fechaAdquisicion).year).filter(y => y && !isNaN(parseInt(y))); return [...new Set(years)].sort((a, b) => b - a); }, [bienes, dependenciaActual]);

  const subcuentasUnicas = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.subcuenta||'').trim() !== '').map(b => String(b.subcuenta).trim()))].sort(), [bienes, dependenciaActual]);
  const analiticos1Unicos = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.analitico1||'').trim() !== '').map(b => String(b.analitico1).trim()))].sort(), [bienes, dependenciaActual]);
  const analiticos2Unicos = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.analitico2||'').trim() !== '').map(b => String(b.analitico2).trim()))].sort(), [bienes, dependenciaActual]);

  const stats = useMemo(() => {
      const depBienes = bienes.filter(b => b.dependencia === dependenciaActual && b.estadoConservacion !== 'De Baja');
      const totalItems = depBienes.length;
      const totalValue = depBienes.reduce((acc, curr) => {
          const valStr = String(curr.valorUnitario || '0').replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
          const valorNum = parseInt(valStr, 10) || 0;
          return acc + valorNum;
      }, 0);
      const withFc10 = depBienes.filter(b => b.hasFC10).length;
      // Actas en trámite: no cuentan como "con FC-10" (el bien sigue en la
      // bandeja), pero se exponen aparte para que la bandeja diga qué falta
      // además de firmar.
      const fc10Pendientes = (fc10List || []).filter(fc => {
          if (estadoInicialFC10(fc) === ESTADOS_FC10.CERRADO) return false;
          const b = bienes.find(x => x.id === fc.bienId);
          return b && normalizeStr(b.dependencia) === normalizeStr(dependenciaActual);
      }).length;
      const withQR = depBienes.filter(b => b.hasQR).length;
      const estados = { bueno: depBienes.filter(b => b.estadoConservacion === 'Bueno' || b.estadoConservacion === 'Muy bueno').length, regular: depBienes.filter(b => b.estadoConservacion === 'Regular').length, malo: depBienes.filter(b => b.estadoConservacion === 'Malo' || b.estadoConservacion === 'Inutilizable').length };
      const percFC10 = totalItems === 0 ? 0 : (withFc10 / totalItems) * 100;
      const percQR = totalItems === 0 ? 0 : (withQR / totalItems) * 100;
      const cuentasCounts = {};
      depBienes.forEach(b => { if (b.cuenta) cuentasCounts[b.cuenta] = (cuentasCounts[b.cuenta] || 0) + 1; });
      const topCuentas = Object.entries(cuentasCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return { totalItems, totalValue, withFc10, withoutFc10: totalItems - withFc10, fc10Pendientes, withQR, withoutQR: totalItems - withQR, percFC10, percQR, estados, topCuentas };
  }, [bienes, dependenciaActual, fc10List]);

  // Bandeja de pendientes: conteos operativos para atención directa (mismo universo que stats: activos)
  const pendientes = useMemo(() => {
      const base = bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) && b.estadoConservacion !== 'De Baja');
      const anioActual = new Date().getFullYear();
      const ahora = new Date();
      const mesesRestantes = (b) => {
        const { year, month } = parseDateInfo(b.fechaAdquisicion);
        const vu = parseInt(b.vidaUtil, 10);
        if (!year || !month || !(vu > 0)) return null;
        const transcurridos = (ahora.getFullYear() - parseInt(year, 10)) * 12 + (ahora.getMonth() + 1 - parseInt(month, 10));
        return vu * 12 - transcurridos;
      };
      const esVidaVencida = (b) => {
        const { year } = parseDateInfo(b.fechaAdquisicion);
        const vu = parseInt(b.vidaUtil, 10);
        return year && vu > 0 && (anioActual - parseInt(year, 10)) > vu;
      };
      return [
        { id: 'sinQR', label: 'Sin etiqueta QR', count: base.filter(b => b.hasQR !== true).length, icon: 'fa-qrcode', box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
        { id: 'sinFC10', label: 'Sin acta FC-10', count: base.filter(b => b.hasFC10 !== true).length, icon: 'fa-file-signature', box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
        { id: 'sinUbicacion', label: 'Sin ubicación', count: base.filter(b => !String(b.ubicacion || '').trim()).length, icon: 'fa-location-dot', box: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
        { id: 'sinFuncionario', label: 'Sin responsable', count: base.filter(b => !String(b.funcionario || '').trim()).length, icon: 'fa-user-tie', box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
        { id: 'vidaVencida', label: 'Vida útil vencida', count: base.filter(esVidaVencida).length, icon: 'fa-hourglass-end', box: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
        { id: 'porVencer', label: 'Por vencer (12 m.)', count: base.filter(b => { const r = mesesRestantes(b); return r !== null && r > 0 && r <= 12; }).length, icon: 'fa-hourglass-half', box: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
      ];
  }, [bienes, dependenciaActual]);

  const filteredBienes = useMemo(() => {
    // Compara ignorando mayúsculas, tildes y espacios extra (antes el ===
    // exacto partía los resultados si el nombre tenía variantes de carga)
    let filtered = bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual));
    if (filtroFuncionario) filtered = filtered.filter(b => normalizeStr(b.funcionario || '') === normalizeStr(filtroFuncionario));
    if (filtroUbicacion) filtered = filtered.filter(b => normalizeStr(b.ubicacion || '') === normalizeStr(filtroUbicacion));
    if (filtroAnio) filtered = filtered.filter(b => parseDateInfo(b.fechaAdquisicion).year === filtroAnio);
    if (filtroMes) filtered = filtered.filter(b => parseDateInfo(b.fechaAdquisicion).month === filtroMes);
    if (filtroSubcuenta) filtered = filtered.filter(b => String(b.subcuenta||'').trim() === filtroSubcuenta);
    if (filtroAnalitico1) filtered = filtered.filter(b => String(b.analitico1||'').trim() === filtroAnalitico1);
    if (filtroAnalitico2) filtered = filtered.filter(b => String(b.analitico2||'').trim() === filtroAnalitico2);
    if (filtroEstado !== 'ALL') filtered = filtered.filter(b => b.estadoConservacion === filtroEstado);
    if (filtroQR === 'YES') filtered = filtered.filter(b => b.hasQR === true);
    if (filtroQR === 'NO') filtered = filtered.filter(b => b.hasQR !== true);
    if (filtroFC10 === 'YES') filtered = filtered.filter(b => b.hasFC10 === true);
    if (filtroFC10 === 'NO') filtered = filtered.filter(b => b.hasFC10 !== true);

    // Bandeja de pendientes: atajos operativos que combinan condiciones
    if (filtroPendiente === 'sinQR') filtered = filtered.filter(b => b.hasQR !== true);
    else if (filtroPendiente === 'sinFC10') filtered = filtered.filter(b => b.hasFC10 !== true);
    else if (filtroPendiente === 'sinUbicacion') filtered = filtered.filter(b => !String(b.ubicacion || '').trim());
    else if (filtroPendiente === 'sinFuncionario') filtered = filtered.filter(b => !String(b.funcionario || '').trim());
    else if (filtroPendiente === 'vidaVencida') filtered = filtered.filter(b => {
      const { year } = parseDateInfo(b.fechaAdquisicion);
      const vu = parseInt(b.vidaUtil, 10);
      return year && vu > 0 && (new Date().getFullYear() - parseInt(year, 10)) > vu;
    });
    else if (filtroPendiente === 'porVencer') filtered = filtered.filter(b => {
      const { year, month } = parseDateInfo(b.fechaAdquisicion);
      const vu = parseInt(b.vidaUtil, 10);
      if (!year || !month || !(vu > 0)) return false;
      const ahora = new Date();
      const transcurridos = (ahora.getFullYear() - parseInt(year, 10)) * 12 + (ahora.getMonth() + 1 - parseInt(month, 10));
      const restantes = vu * 12 - transcurridos;
      return restantes > 0 && restantes <= 12;
    });

    // Búsqueda robusta: tildes, multi-palabra (AND), rótulo sin ceros/guiones, más campos.
    // Usa término con debounce para no filtrar en cada tecla con 1800+ registros.
    if (debouncedSearchTerm && String(debouncedSearchTerm).trim()) {
      filtered = filtered.filter(b => matchBienSearch(b, debouncedSearchTerm));
    }

    filtered.sort((a, b) => {
        if (orden?.campo === 'valor') {
          const va = parseInt(String(a.valorUnitario || '0').replace(/\D/g, ''), 10) || 0;
          const vb = parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0;
          return orden.dir === 'desc' ? vb - va : va - vb;
        }
        if (orden?.campo === 'fecha') {
          const fa = String(a.fechaAdquisicion || '');
          const fb = String(b.fechaAdquisicion || '');
          return orden.dir === 'desc' ? fb.localeCompare(fa) : fa.localeCompare(fb);
        }
        if (orden?.campo === 'rotulo') {
          const c = String(a.rotulo || '').localeCompare(String(b.rotulo || ''));
          return orden.dir === 'desc' ? -c : c;
        }
        const getSuffixNum = (rot) => { const str = String(rot || '').trim(); const match = str.match(/\d+$/); return match ? parseInt(match[0], 10) : 0; };
        const numA = getSuffixNum(a.rotulo);
        const numB = getSuffixNum(b.rotulo);
        if (numA !== numB) return numA - numB;
        return String(a.rotulo || '').localeCompare(String(b.rotulo || ''));
    });

    return filtered;
  }, [bienes, dependenciaActual, filtroFuncionario, filtroUbicacion, filtroAnio, filtroMes, filtroSubcuenta, filtroAnalitico1, filtroAnalitico2, filtroEstado, filtroQR, filtroFC10, filtroPendiente, debouncedSearchTerm, orden]);

  const paginatedBienes = useMemo(() => { const start = (currentPage - 1) * itemsPorPagina; return filteredBienes.slice(start, start + itemsPorPagina); }, [filteredBienes, currentPage, itemsPorPagina]);
  const itemsPaginados = paginatedBienes;
  const totalPages = Math.max(1, Math.ceil(filteredBienes.length / itemsPorPagina));
  // Si un filtro deja menos resultados que la página actual, quedás viendo un
  // "no se encontraron bienes" con bienes que sí existen, y el contador dice
  // "41 - 3 de 3". Se vuelve a la última página válida.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return {
    searchInput, setSearchInput, searchTerm, setSearchTerm, debouncedSearchTerm,
    orden, setOrden, alternarOrden,
    filtroFuncionario, setFiltroFuncionario, filtroUbicacion, setFiltroUbicacion,
    filtroAnio, setFiltroAnio, filtroMes, setFiltroMes,
    filtroSubcuenta, setFiltroSubcuenta, filtroAnalitico1, setFiltroAnalitico1,
    filtroAnalitico2, setFiltroAnalitico2, filtroQR, setFiltroQR,
    filtroFC10, setFiltroFC10, filtroEstado, setFiltroEstado,
    filtroPendiente, setFiltroPendiente, currentPage, setCurrentPage,
    clearAllFilters, hasFilters,
    vistasGuardadas, nombreVista, setNombreVista, mostrarGuardarVista, setMostrarGuardarVista,
    guardarVistaActual, aplicarVista, eliminarVista,
    funcionariosUnicos, ubicacionesUnicas, aniosUnicos,
    subcuentasUnicas, analiticos1Unicos, analiticos2Unicos,
    stats, pendientes, filteredBienes, paginatedBienes, itemsPaginados, totalPages,
    itemsPorPagina, cambiarPaginaTam, seleccionados, toggleSeleccion, limpiarSeleccion,
    vistaInv, cambiarVistaInv, urlFiltrosActual
  };
}
