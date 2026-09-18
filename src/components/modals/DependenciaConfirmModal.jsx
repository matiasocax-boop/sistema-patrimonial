import React from 'react';

export default function DependenciaConfirmModal({ showDependenciaConfirm, setShowDependenciaConfirm, confirmDependenciaChange, pendingDependencia, STYLES }) {
    if (!showDependenciaConfirm) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[380px] !p-0 !rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="p-8 text-center bg-white dark:bg-darkbg-card relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-brand-primary"></div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 shadow-inner ring-8 bg-brand-light text-brand-primary ring-brand-primary/10 dark:bg-brand-primary/20 dark:text-brand-accent dark:ring-brand-primary/10">
                <i className="fa-solid fa-building-columns text-2xl"></i>
              </div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
                  Cambiar Entorno
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                ¿Está seguro que desea cambiar el entorno de trabajo a <strong className="text-zinc-800 dark:text-zinc-200">{pendingDependencia}</strong>? Esto recargará los datos y limpiará los filtros actuales.
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 bg-zinc-50 dark:bg-darkbg-main border-t border-zinc-100 dark:border-darkbg-border">
              <button onClick={() => setShowDependenciaConfirm(false)} className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-darkbg-card border border-zinc-200/80 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover shadow-sm hover:shadow transition-all cursor-pointer">
                  Cancelar
              </button>
              <button onClick={confirmDependenciaChange} className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-[#213f8f] hover:bg-[#182e6b] dark:bg-brand-primary dark:hover:bg-brand-hover shadow-md shadow-[#213f8f]/20 transition-all cursor-pointer border border-transparent">
                  Sí, Cambiar
              </button>
            </div>
          </div>
        </div>
    );
}