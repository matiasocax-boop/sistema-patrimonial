// src/components/modals/LogoutModal.jsx
import React from 'react';

export default function LogoutModal({ isOpen, onClose, onConfirm, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[360px] !p-0 !rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
            <div className="p-8 text-center bg-white dark:bg-darkbg-card relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-zinc-300 dark:bg-zinc-600"></div>
              
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-6 text-zinc-600 dark:text-zinc-400 ring-8 ring-zinc-50 dark:ring-zinc-900/50 shadow-inner">
                <i className="fa-solid fa-right-from-bracket text-2xl relative left-0.5"></i>
              </div>
              
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">¿Cerrar Sesión?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                Está a punto de salir de su cuenta actual. Deberá ingresar sus credenciales nuevamente para acceder.
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-6 bg-zinc-50 dark:bg-darkbg-main border-t border-zinc-100 dark:border-darkbg-border">
              <button onClick={onClose} className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-darkbg-card border border-zinc-200/80 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover shadow-sm hover:shadow transition-all cursor-pointer">
                  Cancelar
              </button>
              <button onClick={onConfirm} className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-zinc-900 hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-md transition-all cursor-pointer">
                  Sí, salir
              </button>
            </div>
          </div>
        </div>
    );
}