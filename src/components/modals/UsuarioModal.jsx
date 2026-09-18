// src/components/modals/UsuarioModal.jsx
import React from 'react';

export default function UsuarioModal({ isOpen, onClose, usuarioEditing, saveUsuario, todasDependencias, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-lg"}>
            <div className={STYLES.modalHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent font-black">
                  <i className="fa-solid fa-user-gear text-base"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                    {usuarioEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">Configure las credenciales y nivel de acceso</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <form onSubmit={saveUsuario} className="flex flex-col h-full overflow-hidden">
              <div className={STYLES.modalBody}>
                <div className="space-y-5">
                    
                    <div>
                      <label className={STYLES.label}>Usuario (Login / ID)</label>
                      <div className="relative">
                        <i className="fa-solid fa-at absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                        <input 
                          type="text" 
                          name="username" 
                          required 
                          defaultValue={usuarioEditing?.username} 
                          disabled={!!usuarioEditing} 
                          className={`${STYLES.input} pl-11 ${usuarioEditing ? 'bg-zinc-100 dark:bg-zinc-800/80 cursor-not-allowed text-zinc-500' : ''}`} 
                          placeholder="Ej. mocampo" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className={STYLES.label}>Nombre Completo</label>
                      <div className="relative">
                        <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                        <input 
                          type="text" 
                          name="nombre" 
                          required 
                          defaultValue={usuarioEditing?.nombre} 
                          className={`${STYLES.input} pl-11`} 
                          placeholder="Ej. Matías Ocampo" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className={STYLES.label}>
                        Contraseña {usuarioEditing && <span className="text-zinc-400 font-normal lowercase">(dejar en blanco para conservar)</span>}
                      </label>
                      <div className="relative">
                        <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                        <input 
                          type="password" 
                          name="password" 
                          required={!usuarioEditing} 
                          className={`${STYLES.input} pl-11`} 
                          placeholder="••••••••" 
                          minLength="6" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className={STYLES.label}>Rol de Sistema</label>
                      <div className="relative">
                        <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
                        <select name="cargo" required defaultValue={usuarioEditing?.cargo || 'user'} className={`${STYLES.input} pl-11 appearance-none cursor-pointer pr-10`}>
                            <option value="user">Funcionario Local (Solo lectura y creación básica)</option>
                            <option value="admin">Administrador General (Control Total)</option>
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                      </div>
                    </div>
                  <div>
                      <label className={STYLES.label}>Dependencia Asignada</label>
                      <div className="relative">
                        <i className="fa-solid fa-building-columns absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
                        <select name="dependencia" required defaultValue={usuarioEditing?.dependencia || 'Rectorado'} className={`${STYLES.input} pl-11 appearance-none cursor-pointer pr-10`}>
                            {todasDependencias.map(dep => (
                                <option key={dep} value={dep}>{dep}</option>
                            ))}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                      </div>
                    </div>
                </div>
              </div>
              
              <div className={STYLES.modalFooter}>
                <button type="button" onClick={onClose} className={STYLES.btnSecondary}>Cancelar</button>
                <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-floppy-disk"></i> Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
    );
}