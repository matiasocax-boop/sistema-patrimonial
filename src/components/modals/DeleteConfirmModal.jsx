import React from 'react';

export default function DeleteConfirmModal({ itemToDelete, setItemToDelete, confirmDeleteAction, STYLES }) {
    if (!itemToDelete) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[380px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="p-8 text-center bg-white dark:bg-darkbg-card relative overflow-hidden">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-2xl mb-6 ${
                  itemToDelete.type === 'requestBaja' 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              }`}>
                <i className={`fa-solid ${itemToDelete.type === 'requestBaja' ? 'fa-arrow-down-short-wide' : 'fa-trash-can'} text-xl`}></i>
              </div>

              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                  {itemToDelete.type === 'requestBaja' ? '¿Solicitar Baja?' : '¿Confirmar Eliminación?'}
              </h3>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                {itemToDelete.type === 'requestBaja' 
                    ? 'El bien será etiquetado como "Pendiente de Baja" y enviado al Administrador para su revisión y aprobación final.' 
                    : itemToDelete.type === 'bien' && itemToDelete.item?.estadoConservacion !== 'De Baja'
                    ? 'El bien pasará a estado "De Baja". Podrá eliminarlo definitivamente volviendo a hacer clic en eliminar.'
                    : 'Esta acción eliminará físicamente este registro del servidor de forma permanente. Esta acción no se puede deshacer.'}
              </p>
              
              {itemToDelete.type === 'usuario' && itemToDelete.cargo === 'admin' && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200/80 dark:border-red-900/30 rounded-2xl text-left shadow-sm">
                      <span className="inline-flex items-center rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm tracking-widest uppercase mb-2">
                        <i className="fa-solid fa-shield-halved mr-1.5"></i> Privilegio Admin
                      </span>
                      <p className="text-xs text-red-700 dark:text-red-400 font-bold leading-snug">Está a punto de eliminar una cuenta con control total sobre el sistema.</p>
                  </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-6 bg-zinc-50 dark:bg-darkbg-main border-t border-zinc-100 dark:border-darkbg-border">
              <button onClick={() => setItemToDelete(null)} className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Cancelar
              </button>
              <button onClick={confirmDeleteAction} className="flex-1 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                {itemToDelete.type === 'requestBaja' ? 'Enviar Solicitud' : (itemToDelete.type === 'bien' && itemToDelete.item?.estadoConservacion !== 'De Baja' ? 'Pasar a Baja' : 'Sí, eliminar')}
              </button>
            </div>
          </div>
        </div>
    );
}