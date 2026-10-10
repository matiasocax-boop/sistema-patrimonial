// src/components/modals/UsuarioModal.jsx
import React from 'react';

export default function UsuarioModal({ isOpen, onClose, usuarioEditing, saveUsuario, todasDependencias, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md !rounded-[28px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950"}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-white/5">
                  <i className="fa-solid fa-user-gear text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {usuarioEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Credenciales y nivel de acceso</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-xl p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>
            
            <form onSubmit={saveUsuario} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-zinc-950 custom-scrollbar">
                <div>
                  <label className={STYLES.label}>Usuario (Login / ID)</label>
                  <div className="relative">
                    <i className="fa-solid fa-at absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input 
                      type="text" 
                      name="username" 
                      required 
                      defaultValue={usuarioEditing?.username} 
                      disabled={!!usuarioEditing} 
                      className={`${STYLES.input} pl-10 ${usuarioEditing ? 'bg-zinc-100 dark:bg-zinc-900/80 cursor-not-allowed text-zinc-400' : ''}`} 
                      placeholder="Ej. mocampo" 
                    />
                  </div>
                </div>

                <div>
                  <label className={STYLES.label}>Nombre Completo</label>
                  <div className="relative">
                    <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input 
                      type="text" 
                      name="nombre" 
                      required 
                      defaultValue={usuarioEditing?.nombre} 
                      className={`${STYLES.input} pl-10`} 
                      placeholder="Ej. Matías Ocampo" 
                    />
                  </div>
                </div>

                <div>
                  <label className={STYLES.label}>
                    Contraseña {usuarioEditing && <span className="text-zinc-400 font-normal lowercase">(en blanco para conservar)</span>}
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input 
                      type="password" 
                      name="password" 
                      required={!usuarioEditing} 
                      className={`${STYLES.input} pl-10`} 
                      placeholder="••••••••" 
                      minLength="6" 
                    />
                  </div>
                </div>

                <div>
                  <label className={STYLES.label}>Rol de Sistema</label>
                  <div className="relative">
                    <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                    <select name="cargo" required defaultValue={usuarioEditing?.cargo || 'user'} className={`${STYLES.input} pl-10 appearance-none cursor-pointer pr-10`}>
                        <option value="user">Funcionario Local (Lectura y creación)</option>
                        <option value="admin">Administrador General (Control Total)</option>
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className={STYLES.label}>Dependencia Asignada</label>
                  <div className="relative">
                    <i className="fa-solid fa-building-columns absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                    <select name="dependencia" required defaultValue={usuarioEditing?.dependencia || 'Rectorado'} className={`${STYLES.input} pl-10 appearance-none cursor-pointer pr-10`}>
                        {todasDependencias.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0">
                <button type="button" onClick={onClose} className={STYLES.btnSecondary}>Cancelar</button>
                <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-check text-xs"></i> Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
    );
}