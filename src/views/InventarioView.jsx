import { PENDIENTE_LABELS, ESTADOS_CONSERVACION } from '../constants/appConstants';
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
  renderPagination
}) {
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

      <button 
        onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Generar Lote Masivo de QRs"
      >
        <i className="fa-solid fa-qrcode text-indigo-600 dark:text-indigo-400"></i>
        <span>Lote QRs</span>
      </button>

      <button 
        onClick={openFC03Modal} 
        className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        title="Generar Reporte FC-03"
      >
        <i className="fa-solid fa-print text-amber-600"></i>
        <span>FC-03</span>
      </button>
    </div>

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
        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 pl-11 pr-11 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 outline-none transition-all"
      />
      {searchTerm && (
        <button
          onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); }}
          title="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      )}
    </div>

    {/* Rejilla de Filtros Secundarios (4 Columnas Equilibradas) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">

      {/* Responsables */}
      <select 
        value={filtroFuncionario || ''} 
        onChange={(e) => setFiltroFuncionario(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Responsables: Todos</option>
        {funcionariosUnicos.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Ubicaciones */}
      <select 
        value={filtroUbicacion || ''} 
        onChange={(e) => setFiltroUbicacion(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Ubicación: Todas</option>
        {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
      </select>

      {/* Año */}
      <select 
        value={filtroAnio || ''} 
        onChange={(e) => setFiltroAnio(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Año: Todos</option>
        {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      {/* Subcuenta */}
      <select 
        value={filtroSubcuenta || ''} 
        onChange={(e) => setFiltroSubcuenta(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Subcuenta: Todas</option>
        {subcuentasUnicas.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Analítico 1 */}
      <select 
        value={filtroAnalitico1 || ''} 
        onChange={(e) => setFiltroAnalitico1(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Analítico 1: Todos</option>
        {analiticos1Unicos.map(a1 => <option key={a1} value={a1}>{a1}</option>)}
      </select>

      {/* Analítico 2 */}
      <select 
        value={filtroAnalitico2 || ''} 
        onChange={(e) => setFiltroAnalitico2(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
      >
        <option value="">Analítico 2: Todos</option>
        {analiticos2Unicos.map(a2 => <option key={a2} value={a2}>{a2}</option>)}
      </select>

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
              <button onClick={() => eliminarVista(v.nombre)} title="Eliminar vista" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-400 transition-colors cursor-pointer">
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
            <button onClick={guardarVistaActual} title="Guardar" className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer">
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
    {filtroPendiente && (
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Mostrando:</span>
        <button
          onClick={() => { setFiltroPendiente(''); setCurrentPage(1); }}
          title="Quitar filtro de pendientes"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        >
          {PENDIENTE_LABELS[filtroPendiente] || filtroPendiente}
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>
    )}
                  <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden" data-tour="inv-table">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="anim-rows w-full text-left border-collapse min-w-[900px]">

                                                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
                          <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            <th className="py-4 pl-6 sm:pl-8 pr-4 w-[38%]">Identificación y Descripción</th>
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
                              <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">

                                {/* Columna 1: Identificación */}
                                <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                                  <div className="flex items-start gap-3.5">
                                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-xs">
                                      <i className="fa-solid fa-tag text-sm"></i>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                                          {item.rotulo || 'S/R'}
                                        </span>
                                        {item.fechaAdquisicion && (
                                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                            <i className="fa-regular fa-calendar text-[9px]"></i>
                                            {item.fechaAdquisicion}
                                          </span>
                                        )}
                                      </div>
                                      <p className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-snug">
                                        {item.descripcion}
                                      </p>
                                      {item.cuenta && (
                                        <span className="inline-block text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                          #{item.cuenta}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Columna 2: Localización y Custodio */}
                                <td className="px-4 py-4 align-top">
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
                                <td className="px-4 py-4 align-middle">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 min-w-[76px] text-center rounded-xl text-[11px] font-bold border uppercase tracking-wider ${getCondicionBadge(item.estadoConservacion)}`}>
                                      {item.estadoConservacion || 'Regular'}
                                    </span>

                                    <button 
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
                                    </button>
                                  </div>
                                </td>

                                {/* Columna 4: Matriz Completa de Acciones Restaurada */}
                                <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                                  <div className="flex items-center justify-end gap-1.5">

                                    {/* Ficha 360 y trazabilidad */}
                                    <button
                                      onClick={() => openFichaBien(item)}
                                      className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-xl transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                                      title="Ficha 360 y trazabilidad"
                                    >
                                      <i className="fa-solid fa-timeline text-xs"></i>
                                    </button>

                                    {/* Generar QR */}
                                    <button 
                                      onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                      className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Generar Código QR"
                                    >
                                      <i className="fa-solid fa-qrcode text-xs"></i>
                                    </button>

                                    {/* Asignar FC-10 */}
                                    <button 
                                      onClick={() => openFC10Modal(item)}
                                      className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Asignación FC-10"
                                    >
                                      <i className="fa-solid fa-file-signature text-xs"></i>
                                    </button>

                                    {/* Traslado FC-11 */}
                                    <button 
                                      onClick={() => openFC11Modal(item)}
                                      className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Traslado FC-11"
                                    >
                                      <i className="fa-solid fa-truck-fast text-xs"></i>
                                    </button>

                                    {/* Editar Bien */}
                                    <button 
                                      onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }}
                                      className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Editar Bien"
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
                                      className="h-8 w-8 flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                                      title="Eliminar o Solicitar Baja"
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
                              <td colSpan="4" className="p-16 text-center">
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

                    {/* Paginación Integrada */}
                    {renderPagination()}
                  </div>

                </div>
  );
}
