import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';

// Vista del registro mensual FC-04 (extraída de App.jsx, Fase 4).
export default function Fc04View({
  filteredFC04, fc10Year, setFc10Year, fc10Month, setFc10Month,
  openFC04Modal, STYLES, isLoading, ORIGENES_FC04,
  handleGenerateFC04PDF, isAdmin, setItemToDelete
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-file-invoice text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Registro Mensual FC-04</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                {filteredFC04.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Gestión contable de altas y bajas patrimoniales</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
          <button onClick={() => openFC04Modal(null)} className={STYLES.btnPrimary}>
              <i className="fa-solid fa-plus text-xs"></i> Redactar Planilla
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : filteredFC04.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                <i className="fa-solid fa-folder-open text-2xl"></i>
              </div>
              <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin expedientes registrados</h3>
              <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen formularios FC-04 generados en el ciclo seleccionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFC04.map(fc => {
              const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento);
              const isAlta = fc.origenMovimiento !== 'B';
              return (
                <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand-primary/50 transition-all group`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-2xs ${isAlta ? 'bg-zinc-100 text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300' : 'bg-brand-light text-brand-dark dark:bg-brand-primary/20 dark:text-brand-accent'}`}>
                          <i className={`fa-solid ${isAlta ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                      </div>
                      <div>
                          <p className="font-extrabold text-zinc-900 dark:text-white text-lg leading-snug">{origenObj?.nombre || fc.origenMovimiento}</p>
                          <p className="text-xs text-zinc-400 font-bold mt-0.5 uppercase tracking-wider">Periodo: {fc.mes} / {fc.anio}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>handleGenerateFC04PDF(fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Imprimir PDF" aria-label="Imprimir PDF"><i className="fa-solid fa-print text-xs"></i></button>
                      <button onClick={()=>openFC04Modal(fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/20 transition cursor-pointer" title="Editar" aria-label="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      {isAdmin && (
                          <button onClick={()=>setItemToDelete({type:'fc04', id:fc.id, item: fc})} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-darkbg-border">
                    {fc.sinMovimiento ? (
                      <span className="inline-flex items-center rounded-xl bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-darkbg-main dark:text-zinc-400 border border-zinc-200 dark:border-darkbg-border">Sin Movimiento</span>
                    ) : (
                      <div>
                          <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Activos ({fc.bienesSnapshot?.length || 0})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {fc.bienesSnapshot?.slice(0, 3).map(b => ( <span key={b.id} className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-mono font-bold text-zinc-800 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200/60 dark:border-darkbg-border">{b.rotulo}</span> ))}
                            {fc.bienesSnapshot?.length > 3 && <span className="text-xs font-bold text-brand-primary self-center ml-1">+{fc.bienesSnapshot.length - 3}</span>}
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
