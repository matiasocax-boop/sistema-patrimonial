import React, { useState, useEffect } from 'react';

// Gestor del catálogo de ubicaciones de la dependencia (solo admin).
export default function UbicacionesModal({ isOpen, onClose, ubicaciones, conteos, onSave, onDelete, isSaving, dependenciaActual, STYLES }) {
  const [nuevo, setNuevo] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNuevo('');
      setEditId(null);
      setEditNombre('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const empezarEdicion = (u) => {
    setEditId(u.id);
    setEditNombre(u.nombre);
  };

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-lg"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-location-dot text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Ubicaciones</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{dependenciaActual} · {ubicaciones.length} registradas</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              placeholder="Nueva ubicación... Ej: Dirección General TIC"
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 h-11 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
            <button
              onClick={() => { if (nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              disabled={isSaving || !nuevo.trim()}
              title="Agregar ubicación"
              className="h-11 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-40 shrink-0"
            >
              <i className="fa-solid fa-plus text-xs mr-1.5"></i>Agregar
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {ubicaciones.length === 0 && (
              <p className="p-5 text-center text-xs font-semibold text-zinc-400">Sin ubicaciones. Agrega la primera arriba.</p>
            )}
            {ubicaciones.map(u => {
              const c = conteos[u.nombre] || { bienes: 0, funcionarios: 0 };
              const enUso = c.bienes > 0 || c.funcionarios > 0;
              return (
                <div key={u.id} className="flex items-center gap-2 px-4 py-2.5">
                  {editId === u.id ? (
                    <>
                      <input
                        type="text"
                        value={editNombre}
                        autoFocus
                        onChange={(e) => setEditNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editNombre.trim()) { onSave(u.id, editNombre.trim()); setEditId(null); }
                          if (e.key === 'Escape') setEditId(null);
                        }}
                        className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 h-9 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      />
                      <button
                        onClick={() => { if (editNombre.trim()) { onSave(u.id, editNombre.trim()); setEditId(null); } }}
                        title="Guardar" aria-label="Guardar"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-check text-xs"></i>
                      </button>
                      <button onClick={() => setEditId(null)} title="Cancelar" aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={u.nombre}>{u.nombre}</span>
                        <span className="block text-[11px] text-zinc-400 tabular-nums">{c.bienes} bienes · {c.funcionarios} funcionarios</span>
                      </span>
                      <button onClick={() => empezarEdicion(u)} title="Renombrar" aria-label="Renombrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer shrink-0">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.nombre)}
                        title={enUso ? 'En uso: no se puede eliminar' : 'Eliminar ubicación'}
                        disabled={enUso}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">Solo se puede eliminar una ubicación sin bienes ni funcionarios asignados. Renombrar no altera los registros existentes.</p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
