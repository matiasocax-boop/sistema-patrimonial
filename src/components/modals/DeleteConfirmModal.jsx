import React from 'react';

export default function DeleteConfirmModal({ itemToDelete, setItemToDelete, confirmDeleteAction, STYLES }) {
    if (!itemToDelete) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[380px] !p-0 !rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="p-8 text-center bg-white dark:bg-darkbg-card relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1 ${itemToDelete.type === 'requestBaja' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
              
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 shadow-inner ring-8 ${
                  itemToDelete.type === 'requestBaja' 
                      ? 'bg-orange-100 text-orange-600 ring-orange-50 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-900/10' 
                      : 'bg-red-100 text-red-600 ring-red-50 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-900/10'
              }`}>
                <i className={`fa-solid ${itemToDelete.type === 'requestBaja' ? 'fa-arrow-down-short-wide' : 'fa-trash-can'} text-2xl`}></i>
              </div>

              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
                  {itemToDelete.type === 'requestBaja' ? '¿Solicitar Baja?' : '¿Confirmar Eliminación?'}
              </h3>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
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
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-darkbg-card border border-zinc-200/80 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover shadow-sm hover:shadow transition-all cursor-pointer">
                  Cancelar
              </button>
              <button onClick={confirmDeleteAction} className={`flex-1 py-3.5 px-4 rounded-2xl text-sm font-black text-white shadow-md transition-all cursor-pointer ${
                  itemToDelete.type === 'requestBaja' 
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              }`}>
                {itemToDelete.type === 'requestBaja' ? 'Enviar Solicitud' : (itemToDelete.type === 'bien' && itemToDelete.item?.estadoConservacion !== 'De Baja' ? 'Pasar a Baja' : 'Sí, eliminar')}
              </button>
            </div>
          </div>
        </div>
    );
}