import React from 'react';

export default function DependenciaConfirmModal({ showDependenciaConfirm, setShowDependenciaConfirm, confirmDependenciaChange, pendingDependencia, STYLES }) {
    if (!showDependenciaConfirm) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[380px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="p-8 text-center bg-white dark:bg-darkbg-card relative overflow-hidden">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white mb-6">
                <i className="fa-solid fa-building-columns text-xl"></i>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                  Cambiar Entorno
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                ¿Está seguro que desea cambiar el entorno de trabajo a <strong className="text-zinc-800 dark:text-zinc-200">{pendingDependencia}</strong>? Esto recargará los datos y limpiará los filtros actuales.
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 bg-zinc-50 dark:bg-darkbg-main border-t border-zinc-100 dark:border-darkbg-border">
              <button onClick={() => setShowDependenciaConfirm(false)} className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Cancelar
              </button>
              <button onClick={confirmDependenciaChange} className="flex-1 h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Sí, Cambiar
              </button>
            </div>
          </div>
        </div>
    );
}