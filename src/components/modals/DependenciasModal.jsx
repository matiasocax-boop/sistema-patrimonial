import React, { useState, useEffect } from 'react';
import { normalizeStr } from '../../utils/helpers';

// Gestor del catálogo de dependencias (solo admin): oficiales + detectadas en datos.
export default function DependenciasModal({
  isOpen, onClose, dependencias, detectadas, conteos,
  onSave, onDelete, onFusionar, isSaving,
  dependenciaActual, onVerPadron,
  ubicacionesList, conteosUbicacion, funcionarios,
  onGuardarUbicacion, onEliminarUbicacion, onAsignarFuncionario,
  STYLES
}) {
  const [nuevo, setNuevo] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [expandida, setExpandida] = useState(null);
  const [nuevaUbic, setNuevaUbicacion] = useState('');
  const [editUbicId, setEditUbicId] = useState(null);
  const [editUbicNombre, setEditUbicNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNuevo('');
      setEditId(null);
      setEditNombre('');
      setExpandida(null);
      setNuevaUbicacion('');
      setEditUbicId(null);
      setEditUbicNombre('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ubicacionesDe = (depNombre) =>
    ubicacionesList.filter(u => normalizeStr(u.dependencia || '') === normalizeStr(depNombre));
  const funcionariosDeUbic = (depNombre, ubicNombre) =>
    funcionarios.filter(f =>
      normalizeStr(f.dependencia || '') === normalizeStr(depNombre) &&
      normalizeStr(f.ubicacion || '') === normalizeStr(ubicNombre)
    );
  const funcionariosDeDep = (depNombre) =>
    funcionarios.filter(f => normalizeStr(f.dependencia || '') === normalizeStr(depNombre));

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-2xl"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-building-columns text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Dependencias</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{dependencias.length} oficiales · {detectadas.length} detectadas en datos</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              placeholder="Nueva dependencia... Ej: Facultad de Ciencias Exactas"
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 h-11 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
            <button
              onClick={() => { if (nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              disabled={isSaving || !nuevo.trim()}
              title="Agregar dependencia"
              className="h-11 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-40 shrink-0"
            >
              <i className="fa-solid fa-plus text-xs mr-1.5"></i>Agregar
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {dependencias.map(d => {
              const c = conteos[d.nombre] || { bienes: 0, funcionarios: 0, ubicaciones: 0 };
              const esActual = d.nombre === dependenciaActual;
              const estaExpandida = expandida === d.id;
              const ubics = ubicacionesDe(d.nombre);
              return (
                <div key={d.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                  {editId === d.id ? (
                    <>
                      <input
                        type="text"
                        value={editNombre}
                        autoFocus
                        onChange={(e) => setEditNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editNombre.trim()) { onSave(d.id, editNombre.trim()); setEditId(null); }
                          if (e.key === 'Escape') setEditId(null);
                        }}
                        className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 h-9 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      />
                      <button
                        onClick={() => { if (editNombre.trim()) { onSave(d.id, editNombre.trim()); setEditId(null); } }}
                        title="Guardar (renombra también en todos los registros)"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-check text-xs"></i>
                      </button>
                      <button onClick={() => setEditId(null)} title="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setExpandida(estaExpandida ? null : d.id)}
                        title={estaExpandida ? 'Ocultar departamentos' : 'Ver departamentos y funcionarios'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                      >
                        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${estaExpandida ? 'rotate-180' : ''}`}></i>
                      </button>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="block text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={d.nombre}>{d.nombre}</span>
                          {esActual && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5">Actual</span>
                          )}
                        </span>
                        <span className="block text-[11px] text-zinc-400 tabular-nums">{c.bienes} bienes · {c.funcionarios} funcionarios · {ubics.length} departamentos</span>
                      </span>
                      <button
                        onClick={() => onVerPadron(d.nombre)}
                        title={`Ver padrón y bienes de ${d.nombre}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-users text-xs"></i>
                      </button>
                      <button
                        onClick={() => { setEditId(d.id); setEditNombre(d.nombre); }}
                        title="Renombrar (actualiza todos los registros)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button
                        onClick={() => onDelete(d.id, d.nombre)}
                        title="Eliminar (solo si no tiene registros)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </>
                  )}
                  </div>
                  {estaExpandida && (
                    <div className="mt-2 ml-10 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/10 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={expandida === d.id ? nuevaUbic : ''}
                          onChange={(e) => setNuevaUbicacion(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), d.nombre); setNuevaUbicacion(''); } }}
                          placeholder={`Nuevo departamento en ${d.nombre}...`}
                          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 h-9 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                        />
                        <button
                          onClick={() => { if (nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), d.nombre); setNuevaUbicacion(''); } }}
                          title="Agregar departamento"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                        </button>
                      </div>
                      {ubics.length === 0 && (
                        <p className="text-[11px] text-zinc-400 font-medium text-center py-1">Sin departamentos. Agrega el primero arriba.</p>
                      )}
                      {ubics.map(u => {
                        const flist = funcionariosDeUbic(d.nombre, u.nombre);
                        const candidatos = funcionariosDeDep(d.nombre).filter(f => normalizeStr(f.ubicacion || '') !== normalizeStr(u.nombre));
                        return (
                          <div key={u.id} className="rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {editUbicId === u.id ? (
                                <>
                                  <input
                                    type="text" value={editUbicNombre} autoFocus
                                    onChange={(e) => setEditUbicNombre(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editUbicNombre.trim()) { onGuardarUbicacion(u.id, editUbicNombre.trim(), d.nombre); setEditUbicId(null); }
                                      if (e.key === 'Escape') setEditUbicId(null);
                                    }}
                                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 h-8 text-xs font-medium outline-none focus:border-brand-primary"
                                  />
                                  <button onClick={() => { if (editUbicNombre.trim()) { onGuardarUbicacion(u.id, editUbicNombre.trim(), d.nombre); setEditUbicId(null); } }} title="Guardar" className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0">
                                    <i className="fa-solid fa-check text-[10px]"></i>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 min-w-0 text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={u.nombre}>{u.nombre}</span>
                                  <span className="text-[10px] tabular-nums text-zinc-400 shrink-0">{flist.length} func.</span>
                                  <button onClick={() => { setEditUbicId(u.id); setEditUbicNombre(u.nombre); }} title="Renombrar departamento" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer shrink-0">
                                    <i className="fa-solid fa-pen text-[10px]"></i>
                                  </button>
                                  <button onClick={() => onEliminarUbicacion(u.id, u.nombre)} title="Eliminar departamento" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer shrink-0">
                                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                                  </button>
                                </>
                              )}
                            </div>
                            {flist.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {flist.map(f => (
                                  <span key={f.id} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                    {f.nombre}
                                    <button onClick={() => onAsignarFuncionario(f.id, '')} title={`Quitar a ${f.nombre} de ${u.nombre}`} className="text-zinc-400 hover:text-rose-500 cursor-pointer">
                                      <i className="fa-solid fa-xmark text-[9px]"></i>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <select
                              value=""
                              onChange={(e) => { if (e.target.value) onAsignarFuncionario(e.target.value, u.nombre); e.target.value = ''; }}
                              title={`Asignar funcionario a ${u.nombre}`}
                              className="mt-1.5 w-full h-8 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-[11px] font-semibold text-zinc-400 outline-none cursor-pointer"
                            >
                              <option value="">+ Asignar funcionario...</option>
                              {candidatos.map(f => (
                                <option key={f.id} value={f.id}>{f.nombre}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {detectadas.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 mb-2">
                Detectadas en datos ({detectadas.length}) — nombres con errores o viejos
              </p>
              <div className="rounded-2xl border border-amber-500/25 divide-y divide-amber-500/10 overflow-hidden">
                {detectadas.map(d => (
                  <div key={d.nombre} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={d.nombre}>{d.nombre}</span>
                      <span className="block text-[11px] text-zinc-400 tabular-nums">{d.bienes} bienes · {d.funcionarios} funcionarios</span>
                    </span>
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) onFusionar(d.nombre, e.target.value); e.target.value = ''; }}
                      title="Fusionar en una dependencia oficial"
                      className="h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer max-w-[170px]"
                    >
                      <option value="">Fusionar en...</option>
                      {dependencias.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">Fusionar mueve todos sus bienes y funcionarios al nombre oficial elegido.</p>
            </div>
          )}
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
