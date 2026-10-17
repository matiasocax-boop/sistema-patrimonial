import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { formatDateText, formatCI } from '../utils/helpers';
import { ESTADOS_FC10, ESTADO_INFO, estadoInicialFC10, pendienteDeFirma } from '../utils/fc10Firmas';

// Vista de actas de responsabilidad FC-10 (extraída de App.jsx, Fase 4).
export default function Fc10View({
  filteredFC10, fc10Year, setFc10Year, fc10Month, setFc10Month,
  STYLES, setIsConsolidatedFC10ModalOpen, handleExportFC10CSV,
  isLoading, bienes, handleGenerateFC10PDF, openFC10Modal,
  isAdmin, setItemToDelete, setActiveTab, registrarFirmaFC10, firmandoId
}) {
  // Cuántas hay en cada etapa: el trabajo real que falta por hacer.
  const conteo = { pendientes: 0, cerradas: 0 };
  (filteredFC10 || []).forEach(fc => {
    if (estadoInicialFC10(fc) === ESTADOS_FC10.CERRADO) conteo.cerradas++;
    else conteo.pendientes++;
  });

  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-file-signature text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Actas de Responsabilidad (FC-10)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                  {filteredFC10.length}
                </span>
                {conteo.pendientes > 0 && (
                  <span
                    title={`${conteo.pendientes} actas esperando firma`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25"
                  >
                    <i className="fa-solid fa-hourglass-half text-[10px]"></i>
                    {conteo.pendientes} sin cerrar
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Delegación y custodia legal de los bienes institucionales</p>
            </div>
          </div>

          {/* CONTENEDOR DE CONTROLES SUPERIOR */}
          <div className="flex flex-wrap gap-2 items-center">
            <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
            {/* NUEVO BOTÓN CONSOLIDADO */}
            <button onClick={() => setIsConsolidatedFC10ModalOpen(true)} className={STYLES.btnPrimary + " flex items-center gap-2"}>
                <i className="fa-solid fa-file-lines text-xs"></i> FC-10 Consolidado
            </button>
            <button onClick={handleExportFC10CSV} title={`Exportar actas del año ${fc10Year} a CSV`} className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                <i className="fa-solid fa-file-csv text-emerald-600 dark:text-emerald-400"></i> Exportar año
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs min-h-[400px]">
          {isLoading ? (
            <SkeletonLoader />
          ) : filteredFC10.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                <i className="fa-solid fa-folder-open text-2xl"></i>
              </div>
              <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin asignaciones en el ciclo</h3>
              <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen actas FC-10 generadas en el periodo seleccionado.</p>
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('inventario')}
                  className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer active:scale-95"
                >
                  <i className="fa-solid fa-boxes-stacked text-xs"></i> Asignar desde inventario
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFC10.map(fc => {
                const bien = bienes.find(b=>b.id === fc.bienId) || {};
                const isDevuelto = !!fc.devolucionFecha;
                const estado = estadoInicialFC10(fc);
                const info = ESTADO_INFO[estado] || ESTADO_INFO[ESTADOS_FC10.CERRADO];
                const pendiente = pendienteDeFirma(fc);
                const f1 = fc.firmas?.firma1;
                const f2 = fc.firmas?.firma2;
                const estaFirmando = firmandoId === fc.id;
                return (
                  <div key={fc.id} className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                    {/* Franja del estado: permite escanear la grilla de un vistazo */}
                    <div className={`h-1 w-full ${info.dot}`}></div>
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-4">
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {isDevuelto ? (
                                        <span className="inline-flex w-fit items-center rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                                            Devuelto
                                        </span>
                                    ) : (
                                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${info.badge}`} title={info.descripcion}>
                                            <i className={`fa-solid ${info.icon} text-[9px]`}></i>
                                            {info.corto}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <i className="fa-regular fa-calendar"></i> {formatDateText(fc.entregadoFecha || fc.fechaGeneracion)}
                                </span>
                            </div>
                            <div className="flex gap-1 shrink-0 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 p-1">
                                <button onClick={()=>handleGenerateFC10PDF([fc], [bien])} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-white/10 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" title="Imprimir acta" aria-label="Imprimir acta"><i className="fa-solid fa-print text-xs"></i></button>
                                <button onClick={() => openFC10Modal(bien, fc)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-white/10 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" title="Editar acta" aria-label="Editar acta"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                {isAdmin && (
                                    <button onClick={()=>setItemToDelete({type:'fc10', id:fc.id, bienId:bien.id, item: { ...fc, bienRotulo: bien?.rotulo, bienDescripcion: bien?.descripcion }})} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" title="Eliminar acta" aria-label="Eliminar acta"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                )}
                            </div>
                        </div>
                        <div className="mt-1 flex flex-col flex-1">
<h4 className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight truncate" title={fc.funcionarioNombre}>{fc.funcionarioNombre}</h4>
<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium truncate">{fc.funcionarioCargo}{fc.funcionarioDoc ? ` · CI ${formatCI(fc.funcionarioDoc)}` : ''}</p>

{/* Estado de las dos firmas. La clave del trámite: se ve exactamente a quién
    le falta firmar y qué falta para cerrar. */}
{!isDevuelto && (
  <div className="mt-4 space-y-1.5" aria-label="Estado de las firmas">
    {[
      { n: 1, puesto: 'Funcionario', nombre: fc.funcionarioNombre, f: f1 },
      { n: 2, puesto: 'Jefe inmediato', nombre: fc.jefeInmediatoNombre, f: f2 }
    ].map(({ n, puesto, nombre, f }) => (
      <div key={n} className="flex items-center gap-2 text-[11px]">
        <i className={`fa-solid ${f ? 'fa-circle-check text-emerald-500' : 'fa-circle text-zinc-300 dark:text-zinc-600'} text-[11px] shrink-0`}></i>
        <span className="font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">{puesto}:</span>
        <span className="truncate text-zinc-500 dark:text-zinc-400">
          {f ? (
            <span title={`Registrado por ${f.registradoPorNombre || f.registradoPor} · ${new Date(f.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}`}>
              {f.nombre || nombre} · {new Date(f.fecha).toLocaleDateString('es-PY')}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 italic">pendiente</span>
          )}
        </span>
      </div>
    ))}
  </div>
)}

{/* Acción: registrar la firma pendiente. El acto de firmar ocurre en
    Acrobat; esto deja constancia de que ese trámite ya se completó. */}
{pendiente && registrarFirmaFC10 && (
  <button
    onClick={() => registrarFirmaFC10(fc)}
    disabled={estaFirmando}
    title={`Registrar la firma de ${pendiente.nombre || pendiente.puesto}`}
    className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
  >
    {estaFirmando ? (
      <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Registrando...</>
    ) : (
      <><i className="fa-solid fa-signature text-[10px]"></i> Registrar firma {pendiente.orden} · {pendiente.puesto}</>
    )}
  </button>
)}

<div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10">
<p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 line-clamp-2 leading-relaxed" title={bien.descripcion || 'Descripción no disponible'}>
{bien.descripcion || 'Descripción no disponible'}
</p>
<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 font-semibold tabular-nums">
<i className="fa-solid fa-tag mr-1.5"></i>{bien.rotulo || 'S/Rótulo'}
</p>
</div>
</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
