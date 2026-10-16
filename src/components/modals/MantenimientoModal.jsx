import React, { useState, useEffect } from 'react';

export default function MantenimientoModal({ isOpen, onClose, initial, onSave, isSaving, STYLES }) {
  const [activo, setActivo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mejoras, setMejoras] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActivo(Boolean(initial?.en_mantenimiento));
      setTitulo(initial?.titulo || '');
      setMensaje(initial?.mensaje || '');
      const m = Array.isArray(initial?.mejoras) ? initial.mejoras.join('\n') : (initial?.mejoras || '');
      setMejoras(m);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-md"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-screwdriver-wrench text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Modo Mantenimiento</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Bloquea el acceso y muestra el aviso a todos</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActivo(!activo)}
            className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span className="flex items-center gap-3">
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {activo ? 'Mantenimiento activado' : 'Mantenimiento desactivado'}
              </span>
            </span>
          </button>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Título del aviso</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Estamos mejorando el sistema"
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Mensaje</label>
            <textarea
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: El acceso está pausado por trabajos programados..."
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Mejoras en curso (una por línea)</label>
            <textarea
              rows={4}
              value={mejoras}
              onChange={(e) => setMejoras(e.target.value)}
              placeholder={"Ej:\nNuevo buscador con tildes\nReportes FC más rápidos"}
              className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-5 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Cancelar
          </button>
          <button
            onClick={() => onSave({ en_mantenimiento: activo, titulo: titulo.trim(), mensaje: mensaje.trim(), mejoras: mejoras.split('\n').map(s => s.trim()).filter(Boolean) })}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Publicar aviso'}
          </button>
        </div>
      </div>
    </div>
  );
}
