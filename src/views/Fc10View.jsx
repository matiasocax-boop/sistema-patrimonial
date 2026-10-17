import React, { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { formatDateText, formatCI } from '../utils/helpers';
import { ESTADOS_FC10, ESTADO_INFO, estadoInicialFC10, pendienteDeFirma, esFC10Legado } from '../utils/fc10Firmas';

// Vista de actas de responsabilidad FC-10 (extraída de App.jsx, Fase 4).
export default function Fc10View({
  filteredFC10, fc10Year, setFc10Year, fc10Month, setFc10Month,
  STYLES, setIsConsolidatedFC10ModalOpen, handleExportFC10CSV,
  isLoading, bienes, handleGenerateFC10PDF, openFC10Modal,
  isAdmin, setItemToDelete, setActiveTab, registrarFirmaFC10, registrarAmbasFirmas, firmandoId,
  ponerFC10EnTramite, poniendoEnTramite
}) {
  // Cuántas hay en cada etapa: el trabajo real que falta por hacer.
  const conteo = { pendientes: 0, cerradas: 0, esperaFuncionario: 0, esperaJefe: 0 };
  (filteredFC10 || []).forEach(fc => {
    const e = estadoInicialFC10(fc);
    if (e === ESTADOS_FC10.CERRADO) { conteo.cerradas++; return; }
    conteo.pendientes++;
    if (e === ESTADOS_FC10.ESPERA_FIRMA_1) conteo.esperaFuncionario++;
    if (e === ESTADOS_FC10.ESPERA_FIRMA_2) conteo.esperaJefe++;
  });

  // Filtro de etapa. Se usa en vez de tocar el estado de cada fila, que es lo
  // que hacia el sistema anterior y no dejaba ver de un vistazo que falta.
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const ETAPAS = [
    { id: 'todas', label: 'Todas', n: filteredFC10.length },
    { id: 'espera1', label: 'Falta funcionario', n: conteo.esperaFuncionario, activo: conteo.esperaFuncionario > 0 },
    { id: 'espera2', label: 'Falta jefe', n: conteo.esperaJefe, activo: conteo.esperaJefe > 0 },
    { id: 'cerradas', label: 'Cerradas', n: conteo.cerradas }
  ];
  const coincideEtapa = (fc) => {
    if (filtroEtapa === 'todas') return true;
    const e = estadoInicialFC10(fc);
    if (filtroEtapa === 'cerradas') return e === ESTADOS_FC10.CERRADO;
    if (filtroEtapa === 'espera1') return e === ESTADOS_FC10.ESPERA_FIRMA_1;
    if (filtroEtapa === 'espera2') return e === ESTADOS_FC10.ESPERA_FIRMA_2;
    return true;
  };
  const listaVisible = (filteredFC10 || []).filter(coincideEtapa);

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

          {/* Filtro por etapa del trámite: acá se ve qué falta firmar y se
              llega directo, sin recorrer todas las tarjetas. */}
          <div className="flex flex-wrap items-center gap-1.5 -mb-1">
            {ETAPAS.map(et => (
              <button
                key={et.id}
                onClick={() => setFiltroEtapa(et.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  filtroEtapa === et.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
                }`}
              >
                {et.label}
                <span className={`tabular-nums ${filtroEtapa === et.id ? 'opacity-80' : 'text-zinc-400 dark:text-zinc-500'}`}>{et.n}</span>
              </button>
            ))}
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
          ) : listaVisible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                <i className={`fa-solid ${filtroEtapa === 'todas' ? 'fa-folder-open' : 'fa-circle-check'} text-2xl`}></i>
              </div>
              {filtroEtapa === 'todas' ? (
                <>
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
                </>
              ) : (
                <>
                  <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">
                    Nada en esta etapa
                  </h3>
                  <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">
                    {ETAPAS.find(e => e.id === filtroEtapa)?.label === 'Cerradas'
                      ? 'Ningun acta de este periodo tiene las dos firmas registradas.'
                      : 'Ningun acta espera esta firma en el periodo seleccionado.'}
                  </p>
                  <button
                    onClick={() => setFiltroEtapa('todas')}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left text-[10px]"></i> Ver todas las actas
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {listaVisible.map(fc => {
                const bien = bienes.find(b=>b.id === fc.bienId) || {};
                const isDevuelto = !!fc.devolucionFecha;
                const estado = estadoInicialFC10(fc);
                const info = ESTADO_INFO[estado] || ESTADO_INFO[ESTADOS_FC10.CERRADO];
                const pendiente = pendienteDeFirma(fc);
                const f1 = fc.firmas?.firma1;
                const f2 = fc.firmas?.firma2;
                const estaFirmando = firmandoId === fc.id;
                const esLegada = esFC10Legado(fc);
                const ponerEnTramite = ponerFC10EnTramite;
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

{/* Estado de las dos firmas. Solo se muestra si el acta participa de este
    control. Las actas anteriores al flujo quedan "Cerrado" y, sin historial
    de firmas, no alcanzan a decir "pendiente": mostrarlas asi se leia como si
    el ciclo estuviera incompleto cuando ya estaba resuelto. */}
{!isDevuelto && (
  (fc.estadoFirma || pendiente) ? (
    <div className="mt-4 space-y-1.5" aria-label="Estado de las firmas">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
        Firmas del acta
      </p>
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
                {f.nombre || nombre} · firmado el {new Date(f.fecha).toLocaleDateString('es-PY')}
              </span>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 italic">sin firmar</span>
            )}
          </span>
        </div>
      ))}
    </div>
  ) : null
)}

{/* Actas anteriores al control de firmas: el sistema las muestra cerradas
    para no romper nada, pero si quedo alguna a medio camino hay que poder
    devolverla al circuito. Sin esto esas actas quedan atrapadas. */}
{!isDevuelto && esLegada && ponerEnTramite && (
  <div className="mt-4 rounded-xl border border-zinc-300/70 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-3">
    <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 leading-snug mb-2.5">
      Esta acta se creó antes del control de firmas. Si quedó a medio camino, ponela en trámite para registrar las firmas.
    </p>
    <button
      onClick={() => ponerEnTramite(fc)}
      disabled={poniendoEnTramite === fc.id}
      className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
    >
      {poniendoEnTramite === fc.id
        ? <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Activando...</>
        : <><i className="fa-solid fa-arrows-rotate text-[10px]"></i> Poner en trámite</>}
    </button>
  </div>
)}
{pendiente && (registrarFirmaFC10 || registrarAmbasFirmas) && (
  <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3 space-y-2">
    {registrarAmbasFirmas && (
      <>
        <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 leading-snug">
          ¿El PDF ya volvió con las <strong>dos firmas</strong>?
        </p>
        <button
          onClick={() => registrarAmbasFirmas(fc)}
          disabled={estaFirmando}
          title="Registrar las dos firmas y cerrar el ciclo de una vez"
          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {estaFirmando
            ? <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Cerrando...</>
            : <><i className="fa-solid fa-circle-check text-[11px]"></i> Ya firmaron ambos</>}
        </button>
        <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70 text-center">o registralas de a poco:</p>
      </>
    )}
    {registrarFirmaFC10 && (
      <button
        onClick={() => registrarFirmaFC10(fc)}
        disabled={estaFirmando}
        title={`Registrar solo la firma ${pendiente.orden} de ${pendiente.nombre || pendiente.puesto}`}
        className="w-full inline-flex items-center justify-center gap-2 h-8 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-60"
      >
        <i className="fa-solid fa-signature text-[10px]"></i>
        Solo {pendiente.puesto}
      </button>
    )}
  </div>
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
