import React, { useState } from 'react';
import { PENDIENTE_LABELS, ESTADOS_CONSERVACION } from '../constants/appConstants';
import FiltroCombo from '../components/FiltroCombo';
import CompararBienesModal from '../components/CompararBienesModal';
import { formatDateText } from '../utils/helpers';

// Vista del inventario general (extraída de App.jsx, Fase 5).
// Es la vista más grande del sistema; recibe todo por props.
export default function InventarioView({
  hasFilters,
  filteredBienes,
  stats,
  handleDownloadTemplateCSV,
  fileInputRef,
  handleExportInventarioCSV,
  handleExportInventarioExcel,
  ultimaExportacion,
  onRepetirExport,
  setIsBulkQR,
  setQrTargetBien,
  setIsQRModalOpen,
  openFC03Modal,
  setBienEditing,
  setIsBienModalOpen,
  searchRef,
  searchTerm,
  setSearchTerm,
  setSearchInput,
  setCurrentPage,
  orden,
  setOrden,
  filtroFuncionario,
  setFiltroFuncionario,
  funcionariosUnicos,
  filtroUbicacion,
  setFiltroUbicacion,
  ubicacionesUnicas,
  filtroAnio,
  setFiltroAnio,
  aniosUnicos,
  filtroSubcuenta,
  setFiltroSubcuenta,
  subcuentasUnicas,
  filtroAnalitico1,
  setFiltroAnalitico1,
  analiticos1Unicos,
  filtroAnalitico2,
  setFiltroAnalitico2,
  analiticos2Unicos,
  filtroFC10,
  setFiltroFC10,
  filtroEstado,
  setFiltroEstado,
  vistasGuardadas,
  aplicarVista,
  eliminarVista,
  mostrarGuardarVista,
  setMostrarGuardarVista,
  nombreVista,
  setNombreVista,
  guardarVistaActual,
  clearAllFilters,
  filtroPendiente,
  setFiltroPendiente,
  itemsPaginados,
  fc10VigentePorBien,
  isAdmin,
  setItemToDelete,
  openFichaBien,
  openFC10Modal,
  openFC11Modal,
  renderPagination,
  seleccionados,
  toggleSeleccion,
  limpiarSeleccion,
  vistaInv,
  cambiarVistaInv,
  lastMutatedBienId,
  onDuplicar,
  onBajaMasiva,
  onQRLoteSeleccion,
  STYLES
}) {
  // Densidad y columnas visibles (preferencia local por usuario)
  const [densidad, setDensidad] = useState(() => {
    try { return localStorage.getItem('inv_densidad') || 'comoda'; } catch { return 'comoda'; }
  });
  const compacto = densidad === 'compacta';
  const cambiarDensidad = () => {
    const v = compacto ? 'comoda' : 'compacta';
    setDensidad(v);
    try { localStorage.setItem('inv_densidad', v); } catch {}
  };
  const [cols, setCols] = useState(() => {
    try { return { fecha: true, cuenta: true, qr: true, ...JSON.parse(localStorage.getItem('inv_columnas') || '{}') }; }
    catch { return { fecha: true, cuenta: true, qr: true }; }
  });
  const alternarCol = (k) => {
    setCols(prev => {
      const n = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem('inv_columnas', JSON.stringify(n)); } catch {}
      return n;
    });
  };
  const [menuCols, setMenuCols] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [recientes, setRecientes] = useState(() => { try { return JSON.parse(localStorage.getItem('inv_recientes') || '[]'); } catch { return []; } });
  const guardarReciente = (texto) => {
    const v = String(texto || '').trim();
    if (!v) return;
    setRecientes(prev => {
      const next = [v, ...prev.filter(x => x !== v)].slice(0, 6);
      try { localStorage.setItem('inv_recientes', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const ORDENES = [
    { id: 'natural', label: 'Orden natural' },
    { id: 'rotulo-asc', label: 'Rótulo A–Z' },
    { id: 'rotulo-desc', label: 'Rótulo Z–A' },
    { id: 'valor-desc', label: 'Mayor valor' },
    { id: 'valor-asc', label: 'Menor valor' },
    { id: 'fecha-desc', label: 'Más recientes' },
    { id: 'fecha-asc', label: 'Más antiguos' }
  ];
  const ordenActual = !orden ? 'natural' : (orden.campo + '-' + orden.dir);
  const cambiarOrden = (id) => {
    if (id === 'natural') { setOrden(null); setCurrentPage(1); return; }
    const [campo, dir] = id.split('-');
    setOrden({ campo, dir });
    setCurrentPage(1);
  };
  // Orden rápido por campo (clic en encabezado o aquí): asc -> desc -> natural
  const ciclarOrden = (campo) => {
    if (!orden || orden.campo !== campo) { setOrden({ campo, dir: campo === 'valor' ? 'desc' : 'asc' }); }
    else if (orden.dir === 'asc') { setOrden({ campo, dir: 'desc' }); }
    else { setOrden(null); }
    setCurrentPage(1);
  };
  const flechaOrden = (campo) => (!orden || orden.campo !== campo) ? 'fa-sort' : (orden.dir === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short');
  const [comparando, setComparando] = useState(false);
  const [confirmaBajaMasiva, setConfirmaBajaMasiva] = useState(false);
  const bienesSeleccionados = itemsPaginados.filter(i => seleccionados.includes(i.id));
  const selFueraPagina = seleccionados.length - bienesSeleccionados.length;
  // Chips de filtros activos con limpieza individual
  const limpiarPag = (fn) => () => { fn(); setCurrentPage(1); };
  const chips = [];
  if (searchTerm) chips.push({ id: 'q', label: searchTerm, limpiar: () => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); } });
  if (filtroFuncionario) chips.push({ id: 'func', label: filtroFuncionario, limpiar: limpiarPag(() => setFiltroFuncionario('')) });
  if (filtroUbicacion) chips.push({ id: 'ubi', label: filtroUbicacion, limpiar: limpiarPag(() => setFiltroUbicacion('')) });
  if (filtroAnio) chips.push({ id: 'anio', label: 'Año ' + filtroAnio, limpiar: limpiarPag(() => setFiltroAnio('')) });
  if (filtroSubcuenta) chips.push({ id: 'sub', label: 'Sub. ' + filtroSubcuenta, limpiar: limpiarPag(() => setFiltroSubcuenta('')) });
  if (filtroAnalitico1) chips.push({ id: 'a1', label: 'An.1 ' + filtroAnalitico1, limpiar: limpiarPag(() => setFiltroAnalitico1('')) });
  if (filtroAnalitico2) chips.push({ id: 'a2', label: 'An.2 ' + filtroAnalitico2, limpiar: limpiarPag(() => setFiltroAnalitico2('')) });
  if (filtroFC10 !== 'ALL') chips.push({ id: 'fc10', label: 'FC-10: ' + (filtroFC10 === 'YES' ? 'Con acta' : 'Sin acta'), limpiar: limpiarPag(() => setFiltroFC10('ALL')) });
  if (filtroEstado !== 'ALL') chips.push({ id: 'est', label: filtroEstado, limpiar: limpiarPag(() => setFiltroEstado('ALL')) });
  if (filtroPendiente) chips.push({ id: 'pend', label: PENDIENTE_LABELS[filtroPendiente] || filtroPendiente, limpiar: limpiarPag(() => setFiltroPendiente('')) });
  if (orden) chips.push({ id: 'ord', label: 'Orden: ' + (ORDENES.find(o => o.id === ordenActual)?.label || ordenActual), limpiar: () => cambiarOrden('natural') });
  return (
<div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-900 dark:text-slate-100">

  {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
  <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

    {/* Título de la Sección + Contador */}
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
        <i className="fa-solid fa-boxes-stacked text-lg"></i>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap">
            Inventario General
          </h2>
          <span title={hasFilters ? 'Bienes que coinciden con los filtros' : 'Incluye bienes dados de baja; los activos se miden en el Panel'} className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 whitespace-nowrap shrink-0">
            {hasFilters ? `${filteredBienes.length} resultados` : `${filteredBienes.length} registros · ${stats.totalItems} activos`}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Gestión integral e inventario consolidado de activos de la Universidad
        </p>
      </div>
    </div>

    {/* Barra de Acciones Rápidas: secundarias con scroll, CTA primario siempre visible */}
    <div className="flex items-center gap-2 min-w-0">
    <div className="flex items-center gap-2 min-w-0 overflow-x-auto hide-scrollbar py-0.5 -my-0.5">
      <button 
        onClick={handleDownloadTemplateCSV} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Descargar Plantilla CSV"
      >
        <i className="fa-solid fa-file-excel text-emerald-600"></i>
        <span>Plantilla</span>
      </button>

      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Importar archivo CSV"
      >
        <i className="fa-solid fa-file-import text-emerald-600"></i>
        <span>Importar</span>
      </button>

      <button 
        onClick={handleExportInventarioCSV} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Exportar archivo CSV"
      >
        <i className="fa-solid fa-file-export text-sky-600"></i>
        <span>Exportar</span>
      </button>

      <button 
        onClick={handleExportInventarioExcel} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Exportar Excel real (.xlsx)"
      >
        <i className="fa-solid fa-file-excel text-emerald-600 dark:text-emerald-400"></i>
        <span>Excel</span>
      </button>

      {ultimaExportacion && (
        <button 
          onClick={onRepetirExport} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title={`Repetir última exportación (${ultimaExportacion.formato.toUpperCase()}) con los filtros actuales`}
        >
          <i className="fa-solid fa-rotate-right text-zinc-500"></i>
          <span>Repetir</span>
        </button>
      )}

      <button 
        onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Generar Lote Masivo de QRs"
      >
        <i className="fa-solid fa-qrcode text-indigo-600 dark:text-indigo-400"></i>
        <span>Lote QRs</span>
      </button>
    </div>

      <button 
        onClick={openFC03Modal} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Generar Reporte FC-03"
      >
        <i className="fa-solid fa-print text-amber-600"></i>
        <span>FC-03</span>
      </button>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block shrink-0"></div>

      <button 
        onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} 
        className="inline-flex shrink-0 items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
      >
        <i className="fa-solid fa-plus text-xs"></i>
        <span className="whitespace-nowrap">Añadir Registro</span>
      </button>
    </div>

  </div>

  {/* 2. PANEL DE FILTROS BaSQUEDA Y SELECCIÓN EN GRID */}
  <div className="bg-white dark:bg-white/[0.04] p-4 sm:p-5 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm space-y-4">

    {/* Campo de Búsqueda Principal */}
    <div className="relative w-full">
      <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
      <input 
        type="text"
        ref={searchRef}
        title="Buscar (atajo: /)"
        data-tour="inv-search"
        placeholder="Buscar por rótulo, descripción, funcionario... Ej: 1045 silla"
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setSearchInput(e.target.value); setCurrentPage(1); }}
        onFocus={() => setShowHistorial(true)}
        onBlur={() => setTimeout(() => setShowHistorial(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) { guardarReciente(searchTerm); setShowHistorial(false); } }}
        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 pl-11 pr-11 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 outline-none transition-all"
      />
      {showHistorial && !searchTerm && recientes.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl py-1.5 animate-pop">
          <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Búsquedas recientes</p>
          {recientes.map(r => (
            <button
              key={r} type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setSearchTerm(r); setSearchInput(r); setCurrentPage(1); setShowHistorial(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-clock-rotate-left text-[10px] text-zinc-400 shrink-0"></i>
              <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">{r}</span>
            </button>
          ))}
          <button
            type="button" onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setRecientes([]); try { localStorage.removeItem('inv_recientes'); } catch {} }}
            className="w-full px-4 py-1.5 text-left text-[11px] font-bold text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Borrar historial
          </button>
        </div>
      )}
      {searchTerm && (
        <button
          onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); }}
          title="Limpiar búsqueda" aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      )}
    </div>

    {/* Rejilla de Filtros Secundarios (4 Columnas Equilibradas) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">

      {/* Responsables */}
      <FiltroCombo
        valor={filtroFuncionario}
        opciones={funcionariosUnicos}
        onElegir={(v) => { setFiltroFuncionario(v); setCurrentPage(1); }}
        etiquetaTodos="Responsables: Todos"
        titulo="Filtrar por responsable"
      />

      {/* Ubicaciones */}
      <FiltroCombo
        valor={filtroUbicacion}
        opciones={ubicacionesUnicas}
        onElegir={(v) => { setFiltroUbicacion(v); setCurrentPage(1); }}
        etiquetaTodos="Ubicación: Todas"
        titulo="Filtrar por ubicación"
      />

      {/* Año */}
      <FiltroCombo
        valor={filtroAnio}
        opciones={aniosUnicos}
        onElegir={(v) => { setFiltroAnio(v); setCurrentPage(1); }}
        etiquetaTodos="Año: Todos"
        titulo="Filtrar por año"
      />

      {/* Subcuenta */}
      <FiltroCombo
        valor={filtroSubcuenta}
        opciones={subcuentasUnicas}
        onElegir={(v) => { setFiltroSubcuenta(v); setCurrentPage(1); }}
        etiquetaTodos="Subcuenta: Todas"
        titulo="Filtrar por subcuenta"
      />

      {/* Analítico 1 */}
      <FiltroCombo
        valor={filtroAnalitico1}
        opciones={analiticos1Unicos}
        onElegir={(v) => { setFiltroAnalitico1(v); setCurrentPage(1); }}
        etiquetaTodos="Analítico 1: Todos"
        titulo="Filtrar por analítico 1"
      />

      {/* Analítico 2 */}
      <FiltroCombo
        valor={filtroAnalitico2}
        opciones={analiticos2Unicos}
        onElegir={(v) => { setFiltroAnalitico2(v); setCurrentPage(1); }}
        etiquetaTodos="Analítico 2: Todos"
        titulo="Filtrar por analítico 2"
      />

      {/* FC-10 */}
      <select 
        value={filtroFC10 || 'ALL'} 
        onChange={(e) => setFiltroFC10(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="ALL">FC-10: Todos</option>
        <option value="YES">Con FC-10</option>
        <option value="NO">Sin FC-10</option>
      </select>

      {/* Estado */}
      <select 
        value={filtroEstado || 'ALL'} 
        onChange={(e) => setFiltroEstado(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="ALL">Estado: Todos</option>
        {ESTADOS_CONSERVACION.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

    </div>

    {/* Vistas guardadas + Restablecer */}
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {vistasGuardadas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mr-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Vistas:</span>
          {vistasGuardadas.map(v => (
            <span key={v.nombre} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
              <button onClick={() => aplicarVista(v)} title={`Aplicar vista "${v.nombre}"`} className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                {v.nombre}
              </button>
              <button onClick={() => eliminarVista(v.nombre)} title="Eliminar vista" aria-label="Eliminar vista" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-400 transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark text-[9px]"></i>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && !mostrarGuardarVista && (
          <button
            onClick={() => setMostrarGuardarVista(true)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Guardar los filtros actuales como vista"
          >
            <i className="fa-solid fa-bookmark text-xs"></i> Guardar vista
          </button>
        )}
        {mostrarGuardarVista && (
          <span className="flex items-center gap-1.5">
            <input
              type="text"
              value={nombreVista}
              onChange={(e) => setNombreVista(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') guardarVistaActual(); if (e.key === 'Escape') setMostrarGuardarVista(false); }}
              placeholder="Nombre de la vista..."
              autoFocus
              className="h-8 w-40 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
            />
            <button onClick={guardarVistaActual} title="Guardar" aria-label="Guardar" className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer">
              <i className="fa-solid fa-check text-[11px]"></i>
            </button>
          </span>
        )}
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i> Restablecer filtros
          </button>
        )}
      </div>
    </div>

  </div>

  {/* 3. TABLA Y LISTADO DE BIENES CON MATRIZ COMPLETA DE ACCIONES */}
  {/* Chips de filtros + controles de vista */}
    <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {chips.length === 0 && (
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 dark:text-zinc-600">Sin filtros</span>
          )}
          {chips.map(c => (
            <button
              key={c.id}
              onClick={c.limpiar}
              title={'Quitar filtro: ' + c.label}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none animate-pop"
            >
              <span className="max-w-[220px] truncate">{c.label}</span>
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden md:flex items-center rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden" title="Vista de resultados">
            <button
              onClick={() => cambiarVistaInv('tabla')} title="Vista tabla" aria-label="Vista tabla"
              className={`flex h-9 w-9 items-center justify-center transition-all cursor-pointer ${vistaInv === 'tabla' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
            >
              <i className="fa-solid fa-table-list text-xs"></i>
            </button>
            <button
              onClick={() => cambiarVistaInv('tarjetas')} title="Vista tarjetas" aria-label="Vista tarjetas"
              className={`flex h-9 w-9 items-center justify-center transition-all cursor-pointer ${vistaInv === 'tarjetas' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
            >
              <i className="fa-solid fa-grip text-xs"></i>
            </button>
          </div>
          <div className="hidden xl:flex items-center gap-1 shrink-0" title="Orden rápido">
            {[['rotulo', 'Rótulo'], ['valor', 'Valor'], ['fecha', 'Fecha']].map(([campo, label]) => (
              <button
                key={campo} onClick={() => ciclarOrden(campo)} title={`Ordenar por ${label}`}
                className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${orden?.campo === campo ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
              >
                {label} <i className={`fa-solid ${flechaOrden(campo)} text-[9px]`}></i>
              </button>
            ))}
          </div>
          <select
            value={ordenActual} onChange={(e) => cambiarOrden(e.target.value)}
            title="Orden de la tabla"
            className="h-9 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {ORDENES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button
            onClick={cambiarDensidad}
            title={compacto ? 'Vista cómoda' : 'Vista compacta'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          >
            <i className={'fa-solid text-xs ' + (compacto ? 'fa-arrows-up-down' : 'fa-arrows-up-down-left-right')}></i>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuCols(v => !v)}
              title="Columnas visibles" aria-label="Columnas visibles"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
            >
              <i className="fa-solid fa-table-columns text-xs"></i>
            </button>
            {menuCols && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuCols(false)}></div>
                <div className="absolute right-0 z-50 mt-1.5 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5 animate-pop">
                  {[['fecha', 'Fecha de compra'], ['cuenta', 'Cuenta'], ['qr', 'Estado / QR']].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => alternarCol(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className={'flex h-4 w-4 items-center justify-center rounded border ' + (cols[k] ? 'bg-brand-primary border-brand-primary text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]"></i>
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
                    {/* Barra de acciones en lote */}
                    {seleccionados.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md animate-pop">
                        <span className="text-[13px] font-bold tabular-nums">
                          {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}{selFueraPagina > 0 ? ` (${selFueraPagina} en otras páginas)` : ''}
                        </span>
                        <span className="flex-1"></span>
                        <button onClick={() => onQRLoteSeleccion && onQRLoteSeleccion()} title="Generar ZIP de etiquetas de la selección" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-white/15 dark:bg-zinc-900/10 hover:bg-white/25 dark:hover:bg-zinc-900/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-qrcode text-[11px]"></i> QRs
                        </button>
                        <button onClick={() => setComparando(true)} disabled={seleccionados.length < 2 || seleccionados.length > 3} title="Comparar 2 o 3 bienes lado a lado" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-white/15 dark:bg-zinc-900/10 hover:bg-white/25 dark:hover:bg-zinc-900/20 transition-all cursor-pointer disabled:opacity-40">
                          <i className="fa-solid fa-columns-compare text-[11px]"></i> Comparar
                        </button>
                        <button onClick={() => setConfirmaBajaMasiva(true)} title={isAdmin ? 'Dar de baja la selección' : 'Solicitar baja de la selección'} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-rose-500/90 hover:bg-rose-500 text-white transition-all cursor-pointer">
                          <i className="fa-solid fa-trash-can text-[11px]"></i> Baja
                        </button>
                        <button onClick={limpiarSeleccion} title="Limpiar selección" aria-label="Limpiar selección" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/15 dark:hover:bg-zinc-900/10 transition-all cursor-pointer">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </div>
                    )}
                  <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden" data-tour="inv-table">
                    {vistaInv === 'tarjetas' ? (
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {itemsPaginados.map((item) => (
                          <div key={item.id} className={`relative rounded-2xl border p-4 shadow-xs card-lift bg-white dark:bg-white/[0.03] ${lastMutatedBienId === item.id ? 'row-flash border-brand-primary/50' : 'border-zinc-200/70 dark:border-white/10'}`}>
                            <div className="flex items-start gap-2.5">
                              <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={() => toggleSeleccion(item.id)} title="Seleccionar" aria-label={`Seleccionar ${item.rotulo}`} className="mt-1 h-4 w-4 rounded border-zinc-300 text-brand-primary cursor-pointer" />
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">{item.rotulo || 'S/R'}</span>
                                <p className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug line-clamp-2 mt-1.5">{item.descripcion}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate"><i className="fa-solid fa-user-check text-emerald-500 text-[10px] mr-1"></i>{item.funcionario || 'Sin asignación'}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate"><i className="fa-solid fa-location-dot text-rose-500 text-[10px] mr-1"></i>{item.ubicacion || 'Sin ubicación'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                              <button onClick={() => openFichaBien(item)} title="Ficha 360" aria-label="Ficha 360" className="flex h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"><i className="fa-solid fa-timeline text-xs"></i></button>
                              <button onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }} title="QR" aria-label="QR" className="flex h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"><i className="fa-solid fa-qrcode text-xs"></i></button>
                              <button onClick={() => openFC10Modal(item)} title="Asignación FC-10" aria-label="Asignación FC-10" className="flex h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"><i className="fa-solid fa-file-signature text-xs"></i></button>
                              <button onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }} title="Editar" aria-label="Editar" className="flex h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                              <button onClick={() => onDuplicar && onDuplicar(item)} title="Duplicar registro" aria-label="Duplicar registro" className="flex h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"><i className="fa-solid fa-copy text-xs"></i></button>
                            </div>
                          </div>
                        ))}
                        {itemsPaginados.length === 0 && (
                          <div className="col-span-full p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3 shadow-inner">
                              <i className="fa-solid fa-boxes-packing text-2xl"></i>
                            </div>
                            <span className="text-sm font-bold text-zinc-400">No se encontraron bienes coincidentes con los filtros.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="anim-rows w-full text-left border-collapse min-w-[900px]">

                                                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
                          <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            <th className="py-4 pl-4 sm:pl-5 pr-1 w-[36px]">
                              <input
                                type="checkbox" title="Seleccionar página" aria-label="Seleccionar página"
                                checked={itemsPaginados.length > 0 && itemsPaginados.every(i => seleccionados.includes(i.id))}
                                onChange={(e) => { if (e.target.checked) { itemsPaginados.forEach(i => { if (!seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } else { itemsPaginados.forEach(i => { if (seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } }}
                                className="h-4 w-4 rounded border-zinc-300 text-brand-primary cursor-pointer"
                              />
                            </th>
                            <th className="py-4 pr-4 w-[38%]">
                              <button onClick={() => ciclarOrden('rotulo')} title="Ordenar por rótulo" className="inline-flex items-center gap-1.5 uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                                Identificación y Descripción <i className={`fa-solid ${flechaOrden('rotulo')} text-[9px]`}></i>
                              </button>
                            </th>
                            <th className="px-4 py-4 w-[28%]">Localización y Custodio</th>
                            <th className="px-4 py-4 w-[18%]">Condición y Estado</th>
                            <th className="py-4 pl-4 pr-6 sm:pr-8 text-right w-[16%]">Acciones</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/30">
                          {itemsPaginados.map((item) => {

                            const getCondicionBadge = (cond) => {
                              const c = (cond || '').toLowerCase();
                              if (c.includes('muy bueno') || c.includes('excelente')) 
                                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                              if (c.includes('bueno')) 
                                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                              return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                            };

                            return (
                              <tr key={item.id} className={`hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group ${lastMutatedBienId === item.id ? 'row-flash' : ''}`}>

                                {/* Selección */}
                                <td className={`pl-4 sm:pl-5 pr-1 align-top ${compacto ? 'py-2' : 'py-4'}`}>
                                  <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={() => toggleSeleccion(item.id)} title="Seleccionar" aria-label={`Seleccionar ${item.rotulo}`} className="mt-1.5 h-4 w-4 rounded border-zinc-300 text-brand-primary cursor-pointer" />
                                </td>
                                {/* Columna 1: Identificación */}
                                <td className={`pr-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex items-start gap-3.5">
                                    <div className={`shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-xs ${compacto ? 'hidden' : 'mt-1 flex h-10 w-10'}`}>
                                      <i className="fa-solid fa-tag text-sm"></i>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                                          {item.rotulo || 'S/R'}
                                        </span>
                                        {cols.fecha && item.fechaAdquisicion && (
                                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                            <i className="fa-regular fa-calendar text-[9px]"></i>
                                            {item.fechaAdquisicion}
                                          </span>
                                        )}
                                      </div>
                                      <p className={`font-semibold text-zinc-900 dark:text-white text-sm leading-snug ${compacto ? 'line-clamp-1' : 'line-clamp-2'}`} >
                                        {item.descripcion}
                                      </p>
                                      {cols.cuenta && item.cuenta && (
                                        <span className="inline-block text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                          #{item.cuenta}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Columna 2: Localización y Custodio */}
                                <td className={`px-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                      <i className="fa-solid fa-user-check text-emerald-500 text-xs shrink-0"></i>
                                      <span className="truncate">{item.funcionario || 'Sin asignación'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                      <i className="fa-solid fa-location-dot text-rose-500 text-xs shrink-0"></i>
                                      <span className="truncate">{item.ubicacion || 'Sin ubicación'}</span>
                                    </div>
                                    {(() => {
                                      const fc10 = fc10VigentePorBien.get(item.id);
                                      const fechaAsig = fc10 ? (fc10.entregadoFecha || fc10.fechaGeneracion) : null;
                                      if (!fechaAsig) return null;
                                      return (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400" title={`Asignado por FC-10 el ${formatDateText(fechaAsig)}`}>
                                          <i className="fa-solid fa-file-signature text-brand-primary dark:text-brand-accent text-xs shrink-0"></i>
                                          <span className="truncate tabular-nums">Asignado: {formatDateText(fechaAsig)}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </td>

                                {/* Columna 3: Condición y QR (Botón interactivo) */}
                                <td className={`px-4 align-middle ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 min-w-[76px] text-center rounded-xl text-[11px] font-bold border uppercase tracking-wider ${getCondicionBadge(item.estadoConservacion)}`}>
                                      {item.estadoConservacion || 'Regular'}
                                    </span>

                                    {cols.qr && (<button 
                                      type="button"
                                      onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                      title={item.hasQR ? "Ver / Descargar Código QR" : "Generar Código QR"}
                                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 min-w-[76px] rounded-xl text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                                        item.hasQR 
                                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs hover:opacity-85' 
                                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-400'
                                      }`}
                                    >
                                      <i className="fa-solid fa-qrcode text-[10px]"></i>
                                      <span>{item.hasQR ? 'Con QR' : 'Sin QR'}</span>
                                    </button>)}
                                  </div>
                                </td>

                                {/* Columna 4: Matriz Completa de Acciones Restaurada */}
                                <td className={`pl-4 pr-6 sm:pr-8 align-top text-right ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex items-center justify-end gap-1.5">

                                    {/* Ficha 360 y trazabilidad */}
                                    <button
                                      onClick={() => openFichaBien(item)}
                                      className="h-9 w-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                                      title="Ficha 360 y trazabilidad" aria-label="Ficha 360 y trazabilidad"
                                    >
                                      <i className="fa-solid fa-timeline text-xs"></i>
                                    </button>

                                    {/* Generar QR */}
                                    <button 
                                      onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                      className="h-9 w-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Generar Código QR" aria-label="Generar Código QR"
                                    >
                                      <i className="fa-solid fa-qrcode text-xs"></i>
                                    </button>

                                    {/* Asignar FC-10 */}
                                    <button 
                                      onClick={() => openFC10Modal(item)}
                                      className="h-9 w-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Asignación FC-10" aria-label="Asignación FC-10"
                                    >
                                      <i className="fa-solid fa-file-signature text-xs"></i>
                                    </button>

                                    {/* Traslado FC-11 */}
                                    <button 
                                      onClick={() => openFC11Modal(item)}
                                      className="h-9 w-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Traslado FC-11" aria-label="Traslado FC-11"
                                    >
                                      <i className="fa-solid fa-truck-fast text-xs"></i>
                                    </button>

                                    {/* Duplicar registro */}
                                    <button 
                                      onClick={() => onDuplicar && onDuplicar(item)}
                                      className="h-9 w-9 items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer hidden sm:inline-flex"
                                      title="Duplicar registro (alta similar)" aria-label="Duplicar registro"
                                    >
                                      <i className="fa-solid fa-copy text-xs"></i>
                                    </button>

                                    {/* Editar Bien */}
                                    <button 
                                      onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }}
                                      className="h-9 w-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Editar Bien" aria-label="Editar Bien"
                                    >
                                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                                    </button>

                                    {/* Eliminar o Solicitar Baja */}
                                    <button 
                                      onClick={() => {
                                        if (isAdmin) {
                                          setItemToDelete({ type: 'bien', id: item.id, item }); 
                                        } else {
                                          setItemToDelete({ type: 'requestBaja', id: item.id, item });
                                        }
                                      }}
                                      className="h-9 w-9 flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Eliminar o Solicitar Baja" aria-label="Eliminar o Solicitar Baja"
                                    >
                                      <i className="fa-solid fa-trash-can text-xs"></i>
                                    </button>

                                  </div>
                                </td>

                              </tr>
                            );
                          })}

                          {itemsPaginados.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-16 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3 shadow-inner">
                                  <i className="fa-solid fa-boxes-packing text-2xl"></i>
                                </div>
                                <span className="text-sm font-bold text-zinc-400">No se encontraron bienes coincidentes con los filtros.</span>
                              </td>
                            </tr>
                          )}
                        </tbody>

                      </table>
                    </div>
                    )}

                    {/* Paginación Integrada */}
                    {renderPagination()}
                  </div>

      {comparando && (
        <CompararBienesModal
          bienes={itemsPaginados.filter(i => seleccionados.includes(i.id)).slice(0, 3)}
          onClose={() => setComparando(false)}
          STYLES={STYLES}
        />
      )}
      {confirmaBajaMasiva && (
        <div className={STYLES.modalOverlay} onClick={() => setConfirmaBajaMasiva(false)}>
          <div className={STYLES.modalContent + ' max-w-[380px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up'} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirmar baja masiva">
            <div className="p-8 text-center bg-white dark:bg-darkbg-card">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl mb-6 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                <i className="fa-solid fa-trash-can text-xl"></i>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                {isAdmin ? `¿Dar de baja ${seleccionados.length} bienes?` : `¿Solicitar baja de ${seleccionados.length} bienes?`}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                {isAdmin ? 'Pasarán a estado "De Baja" y quedará registro en auditoría.' : 'Se enviarán como solicitudes al administrador para su revisión.'}
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 bg-zinc-50 dark:bg-darkbg-main border-t border-zinc-100 dark:border-darkbg-border">
              <button onClick={() => setConfirmaBajaMasiva(false)} className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={() => { setConfirmaBajaMasiva(false); onBajaMasiva && onBajaMasiva(seleccionados); }} className="flex-1 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer">Confirmar</button>
            </div>
          </div>
        </div>
      )}

                </div>
  );
}
