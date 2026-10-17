import { normalizeStr } from '../utils/helpers';
import FiltroCombo from '../components/FiltroCombo';

// Vista de auditoría -solo admin- (extraída de App.jsx, Fase 5).
export default function AuditoriaView({
  fetchAuditoria, isLoadingAud, kpisAud, evolucionValor, maxEvolucion, formatoCortoGs,
  clearAllFilters, setFiltroAnio, setFiltroMes, setActiveTab,
  saludDatos, usoDb, alertaDb, setSearchTerm, setSearchInput, setCurrentPage,
  setSearchFuncionarioInput, setCurrentPaginaFuncionarios,
  conteoUbicacion, setConteoUbicacion, bienes, dependenciaActual,
  ubicacionesUnicas, conteoCodigos, conteoInput, setConteoInput, agregarCodigoConteo,
  resultadoConteo, setScanParaConteo, setIsScannerOpen, setConteoCodigos,
  exportarConteoCSV, descargarActaConteoPDF, guardarActaConteo,
  muestraN, setMuestraN, muestraUbicacion, setMuestraUbicacion,
  muestra, verificadosMuestra, setVerificadosMuestra, generarMuestra,
  guardarActaMuestreo, descargarActaMuestreoPDF,
  totalAud, paginaAud, alcanceAud, setAlcanceAud, searchAud, setSearchAud,
  filtroAccionAud, setFiltroAccionAud, accionesUnicasAud, auditoriaList,
  actorAud, tonoAccionAud, detalleAudCorto
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-magnifying-glass-chart text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Auditoría</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                Solo administradores
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Trazabilidad, conciliación física y verificación por muestreo</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => fetchAuditoria(1)} title="Recargar libro de auditoría" className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
          <i className={`fa-solid fa-rotate ${isLoadingAud ? 'fa-spin' : ''}`}></i> Actualizar
        </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="aud-kpis">
        {[
          { label: 'Eventos (30 días)', valor: kpisAud.total, icon: 'fa-bolt', box: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' },
          { label: 'Altas registradas', valor: kpisAud.altas, icon: 'fa-plus', box: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
          { label: 'Modificaciones', valor: kpisAud.mods, icon: 'fa-pen-to-square', box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border border-zinc-500/20' },
          { label: 'Bajas y eliminaciones', valor: kpisAud.bajas, icon: 'fa-flag', box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl mb-4 ${k.box}`}>
              <i className={`fa-solid ${k.icon}`}></i>
            </div>
            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight">{k.valor}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-chart-line text-emerald-500"></i> Evolución del valor patrimonial
              </h3>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Últimos 12 meses</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">Valor incorporado por mes · clic en una barra para filtrar el inventario.</p>
          <div className="flex items-end gap-1.5 sm:gap-2 h-40">
              {evolucionValor.map(e => (
                  <button
                      key={e.key}
                      onClick={() => { clearAllFilters(); setFiltroAnio(e.year); setFiltroMes(e.month); setActiveTab('inventario'); }}
                      title={`${e.etiqueta}: Gs. ${Number(e.valor).toLocaleString('es-PY')} — clic para filtrar`}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 rounded-lg group/bar focus-visible:ring-2 focus-visible:ring-brand-primary outline-none cursor-pointer"
                  >
                      <span className="text-[10px] font-bold tabular-nums text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {e.valor > 0 ? formatoCortoGs(e.valor) : ''}
                      </span>
                      <span
                          className={`w-full rounded-t-lg transition-all ${e.valor > 0 ? 'bg-emerald-500 group-hover/bar:bg-emerald-400' : 'bg-zinc-100 dark:bg-white/10'}`}
                          style={{ height: e.valor > 0 ? `${Math.max(6, (e.valor / maxEvolucion) * 100)}%` : '4px' }}
                      ></span>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">{e.etiqueta}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-heart-pulse text-rose-500"></i> Salud de datos
              </h3>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Solo lectura</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Detecta inconsistencias sin modificar nada. Toca un duplicado para revisarlo.</p>

          {/* Consumo del plan free de Supabase. El número es estimado a partir
              del conteo de filas por tabla: sirve para saber cuanto margen queda
              antes de tener que archivar informacion vieja. */}
          {usoDb && (
            <div className="mb-4 rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-database text-[10px]"></i> Consumo de base de datos
                </span>
                <span className={`text-[11px] font-black tabular-nums ${alertaDb?.nivel === 'critico' ? 'text-rose-600 dark:text-rose-400' : alertaDb?.nivel === 'aviso' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {usoDb.pctUso.toFixed(1)}% de 500 MB
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-200/60 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    alertaDb?.nivel === 'critico' ? 'bg-rose-500' : alertaDb?.nivel === 'aviso' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(1.5, usoDb.pctUso))}%` }}
                ></div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                {usoDb.totalFilas.toLocaleString('es-PY')} filas · ~{(usoDb.bytesEstimados / 1024 / 1024).toFixed(1)} MB estimados
                {alertaDb ? ` · ${alertaDb.texto}` : ' · Dentro del plan free.'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
              {saludDatos.map(s => (
                  <div key={s.id} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 px-3 py-3 text-center">
                      <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{s.count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5 leading-tight">{s.label}</p>
                  </div>
              ))}
          </div>
          {saludDatos[0].detalle.length > 0 && (
              <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
                  {saludDatos[0].detalle.map(b => (
                      <button
                          key={b.id}
                          onClick={() => { clearAllFilters(); setSearchTerm(b.rotulo || ''); setSearchInput(b.rotulo || ''); setCurrentPage(1); setActiveTab('inventario'); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                          title="Revisar en inventario"
                      >
                          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">{b.rotulo}</span>
                          <span className="text-zinc-400 truncate">{b.descripcion}</span>
                      </button>
                  ))}
              </div>
          )}
          {saludDatos[1].detalle.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar rounded-2xl border border-violet-500/20 divide-y divide-zinc-100 dark:divide-white/5">
                  {saludDatos[1].detalle.map(f => (
                      <button
                          key={f.id}
                          onClick={() => { setSearchFuncionarioInput(f.nombre || ''); setCurrentPaginaFuncionarios(1); setActiveTab('funcionarios'); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                          title="Revisar en el padrón"
                      >
                          <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate">{f.nombre}</span>
                          <span className="text-zinc-400 tabular-nums truncate">CI {f.cedula} · {f.cargo}</span>
                      </button>
                  ))}
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
            <i className="fa-solid fa-clipboard-check text-emerald-500"></i> Conciliación física
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Escanea o escribe rótulos y compara contra el inventario activo del alcance elegido.</p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <FiltroCombo
              valor={conteoUbicacion}
              opciones={ubicacionesUnicas}
              onElegir={setConteoUbicacion}
              etiquetaTodos={`Toda la dependencia (${bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) && b.estadoConservacion !== 'De Baja').length})`}
              titulo="Alcance de la conciliación"
              ancho="max-w-[240px]"
            />
          </div>
          <div className="relative mb-4">
            <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={conteoInput}
              onChange={(e) => setConteoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCodigoConteo(conteoInput); } }}
              placeholder="Rótulo o código QR + Enter..."
              className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-11 pl-11 pr-10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all"
            />
            {conteoInput && (
              <button onClick={() => agregarCodigoConteo(conteoInput)} title="Agregar" aria-label="Agregar" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer">
                <i className="fa-solid fa-plus text-[11px]"></i>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{resultadoConteo.hallados}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hallados</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{resultadoConteo.faltantes.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Faltantes</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{resultadoConteo.noRegistrados.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">No registrados</p>
            </div>
          </div>
          {resultadoConteo.faltantes.length > 0 && (
            <div className="mb-3 max-h-36 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
              {resultadoConteo.faltantes.slice(0, 50).map(b => (
                <div key={b.id} className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs">
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">{b.rotulo}</span>
                  <span className="text-zinc-400 truncate">{b.descripcion}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setScanParaConteo(true); setIsScannerOpen(true); }} title="Escanear etiquetas con la cámara" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
              <i className="fa-solid fa-camera"></i> Escanear con cámara
            </button>
            <button onClick={() => { setConteoCodigos([]); setConteoInput(''); }} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">Limpiar</button>
            <button onClick={exportarConteoCSV} disabled={conteoCodigos.length === 0} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">Exportar CSV</button>
            <button onClick={descargarActaConteoPDF} disabled={conteoCodigos.length === 0} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">
              <i className="fa-solid fa-file-pdf mr-1.5 text-rose-500"></i>Acta PDF
            </button>
            <button onClick={guardarActaConteo} disabled={conteoCodigos.length === 0} className="h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">Guardar acta</button>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
            <i className="fa-solid fa-shuffle text-violet-500"></i> Muestreo aleatorio
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Selección al azar para verificación física y acta del resultado.</p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="number" min="1" max="200"
              value={muestraN}
              onChange={(e) => setMuestraN(e.target.value)}
              title="Cantidad a muestrear"
              className="w-20 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 px-3 text-sm font-bold tabular-nums text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10"
            />
            <FiltroCombo
              valor={muestraUbicacion}
              opciones={ubicacionesUnicas}
              onElegir={setMuestraUbicacion}
              etiquetaTodos="Toda la dependencia"
              titulo="Alcance del muestreo"
              ancho="max-w-[240px]"
            />
            <button onClick={generarMuestra} className="h-10 px-4 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
              Generar muestra
            </button>
            {muestra.length > 0 && (
              <span className="text-xs font-bold tabular-nums text-zinc-500">{Object.values(verificadosMuestra).filter(Boolean).length}/{muestra.length} verificados</span>
            )}
          </div>
          {muestra.length > 0 && (
            <>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${muestra.length ? (Object.values(verificadosMuestra).filter(Boolean).length / muestra.length) * 100 : 0}%` }}></div>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5 mb-4">
                {muestra.map(b => (
                  <label key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
                    <input
                      type="checkbox"
                      checked={Boolean(verificadosMuestra[b.id])}
                      onChange={() => setVerificadosMuestra(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                      className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{b.rotulo}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">{b.descripcion} · {b.ubicacion || 'Sin ubicación'}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={guardarActaMuestreo} className="h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                Guardar acta de muestreo
              </button>
              <button onClick={descargarActaMuestreoPDF} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                <i className="fa-solid fa-file-pdf mr-1.5 text-rose-500"></i>Acta PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-zinc-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mr-auto">
            <i className="fa-solid fa-book-open text-zinc-400"></i> Libro de auditoría
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">{totalAud} eventos</span>
          </h3>
          <div className="flex rounded-xl bg-zinc-100 dark:bg-white/5 p-1 gap-1" role="tablist" aria-label="Alcance del libro">
            {[
              { id: 'dep', label: dependenciaActual },
              { id: 'todas', label: 'Todas' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setAlcanceAud(o.id)}
                className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate max-w-[160px] ${alcanceAud === o.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                title={o.id === 'dep' ? 'Solo eventos de esta dependencia' : 'Eventos de todas las dependencias'}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
            <input
              type="text" value={searchAud} onChange={(e) => setSearchAud(e.target.value)} placeholder="Buscar en el libro..."
              className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 pl-10 pr-3 text-[13px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 w-full sm:w-56"
            />
          </div>
          <FiltroCombo
            valor={filtroAccionAud}
            opciones={accionesUnicasAud}
            onElegir={setFiltroAccionAud}
            etiquetaTodos="Acción: Todas"
            titulo="Filtrar por acción"
            ancho="max-w-[200px]"
          />
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead className="bg-zinc-50/70 dark:bg-white/[0.02] border-b border-zinc-200/70 dark:border-white/10">
              <tr className="text-[10px] sm:text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.14em]">
                <th className="py-3.5 pl-6 pr-4">Fecha</th>
                <th className="px-4 py-3.5">Usuario</th>
                <th className="px-4 py-3.5">Acción</th>
                <th className="px-4 py-3.5">Evento</th>
                <th className="py-3.5 pl-4 pr-6">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {isLoadingAud ? (
                <tr><td colSpan="5" className="p-10 text-center text-xs font-semibold text-zinc-400">Cargando libro...</td></tr>
              ) : auditoriaList.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-xs font-semibold text-zinc-400">Sin eventos para los filtros aplicados.</td></tr>
              ) : (
                auditoriaList.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 pl-6 pr-4 align-top text-xs tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {r.fecha ? new Date(r.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="px-4 py-3 align-top text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{actorAud(r)}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tonoAccionAud(r.accion)}`}>
                        {r.accion || 'OTROS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.titulo || '-'}</td>
                    <td className="py-3 pl-4 pr-6 align-top text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] truncate" title={detalleAudCorto(r)}>{detalleAudCorto(r)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-white/10">
          <span className="text-xs text-zinc-500 font-medium">
            Página <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{totalAud === 0 ? 0 : paginaAud}</span> de <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{Math.max(1, Math.ceil(totalAud / 50))}</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={paginaAud <= 1 || isLoadingAud}
              onClick={() => fetchAuditoria(paginaAud - 1)}
              className="rounded-xl bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              Anterior
            </button>
            <button
              disabled={paginaAud >= Math.ceil(totalAud / 50) || isLoadingAud}
              onClick={() => fetchAuditoria(paginaAud + 1)}
              className="rounded-xl bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
