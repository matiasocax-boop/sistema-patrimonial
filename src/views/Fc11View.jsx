import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';

// Vista de autorizaciones de traslado FC-11 (extraída de App.jsx, Fase 4).
export default function Fc11View({
  filteredFC11, fc10Year, setFc10Year, fc10Month, setFc10Month,
  STYLES, handleExportFC11CSV, isLoading, dependenciaActual,
  handleGenerateFC11PDF, openFC11Modal, bienes, isAdmin, setItemToDelete
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-truck-fast text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Autorizaciones de Traslado (FC-11)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                {filteredFC11.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Movilidad interna institucional de bienes entre dependencias</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
          <button onClick={handleExportFC11CSV} className={STYLES.btnSecondary}>
              <i className="fa-solid fa-file-csv text-emerald-600 dark:text-emerald-400"></i> Exportar CSV
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : filteredFC11.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
              <i className="fa-solid fa-boxes-packing text-2xl"></i>
            </div>
            <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin traslados registrados</h3>
            <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen expedientes FC-11 procesados en el periodo seleccionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFC11.map(fc => {
              const depRemitente = fc.dependenciaRemitente || fc.remitente || '';
              const depDestinataria = fc.dependenciaDestinataria || fc.destinatario || '';
              const esSalida = depRemitente === dependenciaActual;
              return (
                <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand-primary/50 transition-all group relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${esSalida ? 'bg-zinc-500' : 'bg-brand-primary'}`}></div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-2xs ${esSalida ? 'bg-zinc-100 text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300' : 'bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent'}`}>
                          <i className={`fa-solid ${esSalida ? 'fa-arrow-right-from-bracket' : 'fa-arrow-right-to-bracket'}`}></i>
                      </div>
                      <div className="flex flex-col">
                          {esSalida ? <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black text-zinc-700 border border-zinc-200 dark:bg-darkbg-main dark:text-zinc-300 dark:border-darkbg-border uppercase tracking-wider">Despacho</span> : <span className="inline-flex items-center rounded-lg bg-brand-light px-2.5 py-0.5 text-[10px] font-black text-brand-primary border border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-accent uppercase tracking-wider">Recepción</span>}
                          <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1 uppercase">Nº {fc.numeroFormulario}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>handleGenerateFC11PDF([fc])} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Re-imprimir"><i className="fa-solid fa-print text-xs"></i></button>
                      <button onClick={()=>openFC11Modal(bienes.find(b => b.id === fc.bienId) || fc.bienSnapshot, fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/20 transition cursor-pointer" title="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      {isAdmin && (
                          <button onClick={()=>setItemToDelete({type:'fc11', id:fc.id, item: fc})} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex-1 flex flex-col">
                    <div className="flex flex-col gap-1.5 mb-4 border-l-2 border-zinc-200 dark:border-darkbg-border pl-3 py-1">
                       <p className="text-xs text-zinc-500 dark:text-zinc-400"><span className="font-bold text-zinc-900 dark:text-zinc-100">{esSalida ? 'Hacia:' : 'Desde:'}</span> {esSalida ? depDestinataria : depRemitente}</p>
                    </div>
                    <div className="mt-auto bg-zinc-50/80 dark:bg-darkbg-main/80 p-3.5 rounded-xl border border-zinc-200/60 dark:border-darkbg-border">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-mono"><i className="fa-solid fa-tag text-zinc-400 mr-1.5"></i> {fc.bienSnapshot?.rotulo}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{fc.bienSnapshot?.descripcion || 'Especificación omitida'}</p>
                    </div>
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
