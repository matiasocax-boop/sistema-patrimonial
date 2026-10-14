// src/components/modals/ResolucionBajaModal.jsx
import React from 'react';

export default function ResolucionBajaModal({ resolucionBaja, setResolucionBaja, submitResolucionBaja, motivoResolucion, setMotivoResolucion, STYLES }) {
    if (!resolucionBaja) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-lg !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="relative px-5 py-4 border-b border-zinc-100 dark:border-white/10 bg-white dark:bg-darkbg-card">
              <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${resolucionBaja.accion === 'aprobar' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white'}`}>
                          <i className={`fa-solid ${resolucionBaja.accion === 'aprobar' ? 'fa-check-double' : 'fa-xmark'} text-base`}></i> 
                      </div>
                      <div className="min-w-0">
                          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                              {resolucionBaja.accion === 'aprobar' ? 'Aprobar Baja Definitiva' : 'Rechazar Solicitud'}
                          </h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">{resolucionBaja.bien.rotulo}</p>
                      </div>
                  </div>
                  <button onClick={() => setResolucionBaja(null)} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            
            <form onSubmit={submitResolucionBaja} className="flex flex-col h-full overflow-hidden">
                <div className="p-8 bg-zinc-50/50 dark:bg-darkbg-main/50 space-y-6">
                    <div className="bg-white dark:bg-darkbg-card p-6 rounded-3xl border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary"></div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Bien Solicitado:</p>
                        <p className="text-sm font-black text-zinc-900 dark:text-white">{resolucionBaja.bien.rotulo}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed">{resolucionBaja.bien.descripcion}</p>
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-darkbg-border">
                            <p className="text-[11px] font-bold text-brand-primary flex items-center gap-1.5"><i className="fa-solid fa-user-clock"></i> Solicitado por: {resolucionBaja.bien.bajaSolicitadaPor || 'Desconocido'}</p>
                        </div>
                    </div>
                    
                    <div className="group relative">
                        <label className={STYLES.label}>Motivo / Observación {resolucionBaja.accion === 'aprobar' && <span className="text-zinc-400 font-normal lowercase">(Opcional)</span>}</label>
                        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500 ${resolucionBaja.accion === 'aprobar' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-zinc-500 to-zinc-700'}`}></div>
                        <textarea 
                            required={resolucionBaja.accion === 'rechazar'}
                            value={motivoResolucion} 
                            onChange={e => setMotivoResolucion(e.target.value)} 
                            className={`${STYLES.input} relative !rounded-2xl bg-white dark:bg-darkbg-card shadow-inner min-h-[110px] text-sm leading-relaxed resize-none p-4`} 
                            placeholder="Escribe un mensaje explicativo para el usuario que solicitó la baja..."
                        ></textarea>
                        {resolucionBaja.accion === 'aprobar' && <p className="text-[11px] text-red-500 font-bold mt-3 flex items-start gap-1.5"><i className="fa-solid fa-triangle-exclamation mt-0.5"></i> Al aprobar, el bien pasará a estado "De Baja" en todo el sistema. Esta acción es irreversible.</p>}
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-8 py-6 bg-white dark:bg-darkbg-card border-t border-zinc-100 dark:border-darkbg-border">
                    <button type="button" onClick={() => setResolucionBaja(null)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
                    <button type="submit" className={`inline-flex items-center justify-center h-10 px-5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${resolucionBaja.accion === 'aprobar' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}>
                        Confirmar {resolucionBaja.accion === 'aprobar' ? 'Baja Definitiva' : 'Rechazo'}
                    </button>
                </div>
            </form>
          </div>
        </div>
    );
}