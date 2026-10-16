// Vista de gestión de usuarios -solo admin- (extraída de App.jsx, Fase 4).
export default function UsuariosView({
  usuariosList, setUsuarioEditing, setIsUsuarioModalOpen,
  esDesarrollador, currentUser, setItemToDelete, STYLES
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-users-gear text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Gestión de Usuarios</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                {usuariosList.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Gestión de cuentas y roles de acceso al sistema</p>
          </div>
        </div>

        <button onClick={() => { setUsuarioEditing(null); setIsUsuarioModalOpen(true); }} className={STYLES.btnPrimary}>
          <i className="fa-solid fa-user-plus text-xs"></i> Nuevo Usuario
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 backdrop-blur-md z-10 border-b border-zinc-200/80 dark:border-darkbg-border">
                <tr className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4 w-1/3">Usuario y Nombre</th>
                  <th className="px-4 py-3.5 w-1/3">Rol de Sistema</th>
                  <th className="relative py-3.5 pl-4 pr-6 text-right"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                {usuariosList.map(u => (
                  <tr key={u.username} className="hover:bg-zinc-50 dark:hover:bg-darkbg-hover/50 transition-colors border-b border-zinc-50 dark:border-darkbg-border/30">
                      <td className="py-3 pl-6 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-brand-primary dark:text-brand-accent font-bold text-sm border border-zinc-200/60 dark:border-darkbg-border/60 shadow-sm">
                                {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-zinc-900 dark:text-white text-sm">{u.nombre}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">@{u.username}</div>
                            </div>
                          </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          {u.cargo === 'desarrollador'
                              ? <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-500/20 shadow-sm"><i className="fa-solid fa-code text-[10px]"></i> Desarrollador</span>
                              : u.cargo === 'admin'
                              ? <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm"><i className="fa-solid fa-shield-halved text-[10px]"></i> Administrador</span>
                              : <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 shadow-sm"><i className="fa-solid fa-user text-[10px]"></i> Funcionario</span>
                          }
                      </td>
                      <td className="relative py-3 pl-4 pr-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.cargo === 'desarrollador' && !esDesarrollador ? (
                                <span title="Solo el Desarrollador gestiona esta cuenta" className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600">
                                    <i className="fa-solid fa-lock text-[13px]"></i>
                                </span>
                            ) : (
                            <>
                            <button onClick={() => { setUsuarioEditing(u); setIsUsuarioModalOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" title="Editar usuario" aria-label="Editar usuario">
                                <i className="fa-solid fa-pen-to-square text-[13px]"></i>
                            </button>
                            {u.username !== currentUser.username && (
                                <button onClick={() => setItemToDelete({type:'usuario', username: u.username, cargo: u.cargo, item: u})} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" title="Eliminar usuario" aria-label="Eliminar usuario">
                                    <i className="fa-solid fa-trash-can text-[13px]"></i>
                                </button>
                            )}
                            </>
                            )}
                          </div>
                      </td>
                  </tr>
                ))}
                {usuariosList.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-sm font-medium text-zinc-400 italic">No hay usuarios registrados en el sistema.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
