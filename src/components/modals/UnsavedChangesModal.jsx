import React from 'react';

export default function UnsavedChangesModal({ isOpen, onConfirmClose, onCancel, STYLES }) {
  if (!isOpen) return null;

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-sm rounded-[24px] p-6 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
        
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 mb-4">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
          ¿Descartar cambios?
        </h3>

        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Tienes datos modificados en el formulario. Si cierras ahora, se perderán las ediciones no guardadas.
        </p>

        <div className="flex gap-2.5 justify-end">
          <button 
            onClick={onCancel}
            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Continuar editando
          </button>
          <button 
            onClick={onConfirmClose}
            className="flex-1 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Sí, descartar
          </button>
        </div>

      </div>
    </div>
  );
}