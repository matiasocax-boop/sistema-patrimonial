import React from 'react';
import { SHORTCUTS } from '../../constants/appConstants';

export default function AtajosModal({ isOpen, onClose, STYLES }) {
  if (!isOpen) return null;
  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-md"} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Atajos de teclado">
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-keyboard text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Atajos de teclado</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Trabaja sin tocar el mouse</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>
        <div className="p-6 space-y-1 overflow-y-auto custom-scrollbar">
          {SHORTCUTS.map(s => (
            <div key={s.accion} className="flex items-center justify-between gap-4 py-2.5 border-b border-zinc-100 dark:border-white/5 last:border-0">
              <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">{s.accion}</span>
              <span className="flex gap-1 shrink-0">
                {s.teclas.map(k => (
                  <kbd key={k} className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-white/5 px-2 py-1 text-[11px] font-black text-zinc-600 dark:text-zinc-300">{k}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer">Entendido</button>
        </div>
      </div>
    </div>
  );
}
