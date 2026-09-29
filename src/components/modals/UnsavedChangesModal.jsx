import React from 'react';

export default function UnsavedChangesModal({ isOpen, onConfirmClose, onCancel, STYLES }) {
  if (!isOpen) return null;

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-sm !rounded-[28px] p-6 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
        
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-4 shadow-inner">
          <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>

        <h3 className="text-base font-black text-zinc-900 dark:text-white mb-1.5">
          ¿Descartar cambios?
        </h3>

        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Tienes datos modificados en el formulario. Si cierras ahora, se perderán las ediciones no guardadas.
        </p>

        <div className="flex gap-2.5 justify-end">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
          >
            Continuar editando
          </button>
          <button 
            onClick={onConfirmClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md cursor-pointer"
          >
            Sí, descartar
          </button>
        </div>

      </div>
    </div>
  );
}