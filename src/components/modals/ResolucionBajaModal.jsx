// src/components/modals/ResolucionBajaModal.jsx
import React from 'react';

export default function ResolucionBajaModal({ resolucionBaja, setResolucionBaja, submitResolucionBaja, motivoResolucion, setMotivoResolucion, STYLES }) {
    if (!resolucionBaja) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-lg !p-0 !rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card">
              <div className={`absolute top-0 inset-x-0 h-1 ${resolucionBaja.accion === 'aprobar' ? 'bg-red-500' : 'bg-zinc-800 dark:bg-zinc-400'}`}></div>
              <div className="flex justify-between items-center">
                  <h2 className={`text-xl font-black tracking-tight ${resolucionBaja.accion === 'aprobar' ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'} flex items-center gap-3`}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${resolucionBaja.accion === 'aprobar' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-zinc-100 text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border'}`}>
                          <i className={`fa-solid ${resolucionBaja.accion === 'aprobar' ? 'fa-check-double' : 'fa-xmark'} text-lg`}></i> 
                      </div>
                      {resolucionBaja.accion === 'aprobar' ? 'Aprobar Baja Definitiva' : 'Rechazar Solicitud'}
                  </h2>
                  <button onClick={() => setResolucionBaja(null)} className="rounded-2xl p-2.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-darkbg-border"><i className="fa-solid fa-xmark text-xl"></i></button>
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
                    <button type="button" onClick={() => setResolucionBaja(null)} className="py-3.5 px-6 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-darkbg-card border border-zinc-200/80 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover shadow-sm transition-all cursor-pointer">Cancelar</button>
                    <button type="submit" className={`inline-flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-2xl text-sm font-black text-white shadow-md transition-all cursor-pointer ${resolucionBaja.accion === 'aprobar' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-zinc-900 hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'}`}>
                        Confirmar {resolucionBaja.accion === 'aprobar' ? 'Baja Definitiva' : 'Rechazo'}
                    </button>
                </div>
            </form>
          </div>
        </div>
    );
}