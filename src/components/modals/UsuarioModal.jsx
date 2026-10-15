// src/components/modals/UsuarioModal.jsx
import React from 'react';

const LABEL = "block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2";

export default function UsuarioModal({ isOpen, onClose, usuarioEditing, saveUsuario, todasDependencias, esDesarrollador, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                  <i className="fa-solid fa-user-gear text-base"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    {usuarioEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Credenciales y nivel de acceso</p>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <form onSubmit={saveUsuario} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <div>
                  <label className={LABEL}>Usuario (Login / ID)</label>
                  <div className="relative">
                    <i className="fa-solid fa-at absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input
                      type="text"
                      name="username"
                      required
                      defaultValue={usuarioEditing?.username}
                      disabled={!!usuarioEditing}
                      className={`${STYLES.input} pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${usuarioEditing ? 'bg-zinc-100 dark:bg-zinc-900/80 cursor-not-allowed text-zinc-400' : ''}`}
                      placeholder="Ej. mocampo"
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Nombre Completo</label>
                  <div className="relative">
                    <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input
                      type="text"
                      name="nombre"
                      required
                      defaultValue={usuarioEditing?.nombre}
                      className={`${STYLES.input} pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
                      placeholder="Ej. Matías Ocampo"
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>
                    Contraseña {usuarioEditing && <span className="text-zinc-400 font-normal lowercase">(en blanco para conservar)</span>}
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input
                      type="password"
                      name="password"
                      required={!usuarioEditing}
                      className={`${STYLES.input} pl-10 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
                      placeholder="••••••••"
                      minLength="6"
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Rol de Sistema</label>
                  <div className="relative">
                    <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                    <select name="cargo" required defaultValue={usuarioEditing?.cargo || 'user'} className={`${STYLES.input} pl-10 appearance-none cursor-pointer pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}>
                        <option value="user">Funcionario Local (Lectura y creación)</option>
                        <option value="admin">Administrador General (Control Total)</option>
                        {esDesarrollador && <option value="desarrollador">Desarrollador del Sistema</option>}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Dependencia Asignada</label>
                  <div className="relative">
                    <i className="fa-solid fa-building-columns absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                    <select name="dependencia" required defaultValue={usuarioEditing?.dependencia || 'Rectorado'} className={`${STYLES.input} pl-10 appearance-none cursor-pointer pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}>
                        {todasDependencias.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"><i className="fa-solid fa-check text-xs"></i> Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
    );
}
