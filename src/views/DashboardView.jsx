import React, { useState } from 'react';
import AnimatedNumber from '../components/AnimatedNumber';
import SimpleBar from '../components/SimpleBar';

// Vista del panel principal (extraída de App.jsx, Fase 5).
export default function DashboardView({
  currentUser, dependenciaActual, saludoBienvenida, stats, pendientes, isLoading,
  timeStats, clearAllFilters, setActiveTab,
  setFiltroQR, setFiltroFC10, setFiltroPendiente, setFiltroAnio, setFiltroMes,
  setBienEditing, setIsBienModalOpen, fileInputRef, handleExportInventarioCSV,
  setIsBulkQR, setQrTargetBien, setIsQRModalOpen, openFC03Modal,
  setFc10Year, setFc10Month
}) {
  // Widgets visibles del panel (preferencia por usuario).
  const [widgets, setWidgets] = useState(() => {
    try { return { metricas: true, pendientes: true, accesos: true, tendencias: true, ...JSON.parse(localStorage.getItem('dash_widgets') || '{}') }; }
    catch { return { metricas: true, pendientes: true, accesos: true, tendencias: true }; }
  });
  const [menuWidgets, setMenuWidgets] = useState(false);
  const alternarWidget = (k) => {
    setWidgets(prev => {
      const n = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem('dash_widgets', JSON.stringify(n)); } catch {}
      return n;
    });
  };
  const WIDGETS = [['metricas', 'Métricas'], ['pendientes', 'Pendientes'], ['accesos', 'Accesos'], ['tendencias', 'Tendencias']];
  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-12">

      {/* 1. ENCABEZADO DE PÁGINA COMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xl sm:text-2xl shadow-md dep-accent-ring">
            {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 truncate">
              Panel General · {dependenciaActual}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight truncate mt-0.5">
              {saludoBienvenida}, {currentUser?.nombre || 'Usuario'}!
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="relative">
            <button
              onClick={() => setMenuWidgets(v => !v)}
              title="Personalizar panel" aria-label="Personalizar panel"
              className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 shadow-sm text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-sliders text-xs"></i> <span className="hidden sm:inline">Personalizar</span>
            </button>
            {menuWidgets && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuWidgets(false)}></div>
                <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5 animate-pop">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Widgets visibles</p>
                  {WIDGETS.map(([k, label]) => (
                    <button
                      key={k} onClick={() => alternarWidget(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className={'flex h-4 w-4 items-center justify-center rounded border ' + (widgets[k] ? 'bg-brand-primary border-brand-primary text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]"></i>
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white dark:bg-white/5 px-4 py-2.5 border border-zinc-200/80 dark:border-white/10 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Sistema Sincronizado</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">Conexión activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS ACCIONABLES */}
      {widgets.metricas && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" data-tour="dash-stats">

        {/* Bienes Activos */}
        <button
          onClick={() => { clearAllFilters(); setActiveTab('inventario'); }}
          title="Ver inventario completo"
          className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <i className="fa-solid fa-boxes-stacked text-lg"></i>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all"></i>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {isLoading ? '…' : <AnimatedNumber value={stats.totalItems} />}
          </p>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
            Bienes Activos
          </p>
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-2 truncate">
            Total en {dependenciaActual}
          </p>
        </button>

        {/* Bienes con QR */}
        <button
          onClick={() => { clearAllFilters(); setFiltroQR('YES'); setActiveTab('inventario'); }}
          title="Ver bienes con QR"
          className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 backdrop-blur border border-violet-500/25 text-violet-600 dark:text-violet-300">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all"></i>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {isLoading ? '…' : <><AnimatedNumber value={stats.withQR} />
            <span className="text-base text-zinc-400 font-semibold"> / {isLoading ? '…' : Number(stats.totalItems || 0).toLocaleString('es-PY')}</span></>}
          </p>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
            Bienes con QR
          </p>
          <div className="mt-2.5 h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${stats.percQR || 0}%` }}></div>
          </div>
        </button>

        {/* Sin FC-10 */}
        <button
          onClick={() => { clearAllFilters(); setFiltroFC10('NO'); setActiveTab('inventario'); }}
          title="Ver bienes sin FC-10"
          className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-amber-200/70 dark:border-amber-400/20 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <i className="fa-solid fa-file-signature text-lg"></i>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"></i>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {isLoading ? '…' : <AnimatedNumber value={stats.withoutFc10} />}
          </p>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
            Sin FC-10
          </p>
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">
            Pendientes de asignación
          </p>
        </button>

        {/* Pendiente QR */}
        <button
          onClick={() => { clearAllFilters(); setFiltroQR('NO'); setActiveTab('inventario'); }}
          title="Ver bienes sin QR"
          className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-rose-200/70 dark:border-rose-400/20 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all"></i>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
            {isLoading ? '…' : <AnimatedNumber value={stats.withoutQR} />}
          </p>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
            Pendiente QR
          </p>
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-2">
            Sin etiqueta generada
          </p>
        </button>

      </div>
      )}

      {/* 2B. BANDEJA DE PENDIENTES */}
      {widgets.pendientes && (
      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm" data-tour="dash-pendientes">
          <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-zinc-400"></i> Atención requerida
              </h2>
              {pendientes.every(p => p.count === 0) && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <i className="fa-solid fa-circle-check"></i> Todo al día
                  </span>
              )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {pendientes.map(p => (
                  <button
                      key={p.id}
                      onClick={() => { clearAllFilters(); setFiltroPendiente(p.id); setActiveTab('inventario'); }}
                      title={`Atender: ${p.label}`}
                      className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/[0.06] px-3.5 py-3 text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${p.box}`}>
                          <i className={`fa-solid ${p.icon} text-sm`}></i>
                      </span>
                      <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold tabular-nums text-zinc-900 dark:text-white leading-tight"><AnimatedNumber value={p.count} /></span>
                          <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">{p.label}</span>
                      </span>
                      <i className="fa-solid fa-chevron-right text-[10px] text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all shrink-0"></i>
                  </button>
              ))}
          </div>
      </div>
      )}

      {/* 3. ACCESOS DIRECTOS */}
      {widgets.accesos && (
      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-3 sm:p-4 shadow-sm">
          <p className="px-2 pb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Accesos directos</p>
          <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title="Añadir nuevo registro" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-[13px] transition-all shadow-sm active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-plus text-xs"></i> Nuevo registro
              </button>
              <span className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1"></span>
              <button onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i> Importar
              </button>
              <button onClick={handleExportInventarioCSV} title="Exportar archivo CSV" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-file-export text-sky-600 dark:text-sky-400"></i> Exportar
              </button>
              <button onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} title="Generar lote masivo de QRs" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-qrcode text-violet-600 dark:text-violet-400"></i> Lote QRs
              </button>
              <button onClick={openFC03Modal} title="Generar reporte FC-03" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-print text-amber-600 dark:text-amber-400"></i> FC-03
              </button>
          </div>
      </div>
      )}

      {/* 4. GRÁFICOS Y TENDENCIAS */}
      {widgets.tendencias && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Estado de Regularización */}
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-pie text-emerald-500"></i> Metas de Cobertura
            </h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/5">Metas</span>
          </div>

          <div className="flex flex-1 flex-col gap-8 justify-center">
            {/* Progreso FC-10 */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Cobertura FC-10</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withFc10} de {stats.totalItems} activos asignados</p>
                </div>
                <span className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{stats.percFC10.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${stats.percFC10}%` }}></div>
              </div>
            </div>

            {/* Progreso QR */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Etiquetado QR</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withQR} de {stats.totalItems} activos con código</p>
                </div>
                <span className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{stats.percQR.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${stats.percQR}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencias Operativas */}
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-line text-brand-primary"></i> Gestión Anual
            </h2>
          </div>
          <div className="flex flex-1 flex-col sm:flex-row gap-8">

            <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-200/60 dark:border-white/10 pb-6 sm:pb-0 sm:pr-6">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Adquisiciones Anuales</h3>
              <div className="flex-1 flex flex-col justify-center gap-5">
                {timeStats.adqByYear.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-4 opacity-50">
                        <p className="text-xs font-medium text-zinc-500">Sin adquisiciones.</p>
                    </div>
                ) : timeStats.adqByYear.map((item, idx) => {
                    const colors = ["bg-zinc-900 dark:bg-white", "bg-zinc-600 dark:bg-zinc-400", "bg-zinc-400 dark:bg-zinc-600", "bg-zinc-300 dark:bg-zinc-700"];
                    return <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={colors[idx] || "bg-zinc-400"} bgClass="bg-zinc-100 dark:bg-white/5" title={`Filtrar inventario por año ${item.year}`} onClick={() => { clearAllFilters(); setFiltroAnio(item.year); setActiveTab('inventario'); }} />;
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Asignaciones (FC-10)</h3>
              <div className="flex-1 flex flex-col justify-center gap-6">
                <SimpleBar label={`Actual (${timeStats.currentMonthName})`} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones de este mes" onClick={() => { setFc10Year(timeStats.asigCurrent.year); setFc10Month(timeStats.asigCurrent.month); setActiveTab('fc10'); }} />
                <SimpleBar label={`Anterior (${timeStats.prevMonthName})`} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-zinc-300 dark:bg-zinc-600" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones del mes anterior" onClick={() => { setFc10Year(timeStats.asigPrev.year); setFc10Month(timeStats.asigPrev.month); setActiveTab('fc10'); }} />
              </div>
            </div>

          </div>
        </div>

      </div>
      )}

    </div>
  );
}
