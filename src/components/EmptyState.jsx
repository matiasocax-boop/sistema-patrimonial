import React from 'react';

// Estado vacío reutilizable: icono, título, descripción y acción opcional.
export default function EmptyState({ icon = 'fa-box-open', titulo, descripcion, accionLabel, onAccion }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14 animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 mb-4 shadow-inner">
        <i className={`fa-solid ${icon} text-2xl`}></i>
      </div>
      <p className="text-sm font-black text-zinc-700 dark:text-zinc-200">{titulo}</p>
      {descripcion && <p className="text-xs text-zinc-400 mt-1.5 max-w-sm">{descripcion}</p>}
      {accionLabel && onAccion && (
        <button
          onClick={onAccion}
          className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
        >
          <i className="fa-solid fa-plus text-xs"></i> {accionLabel}
        </button>
      )}
    </div>
  );
}
