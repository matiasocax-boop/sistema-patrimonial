import { formatCI } from '../utils/helpers';

// Vista del plantel de funcionarios (extraída de App.jsx, Fase 5).
export default function FuncionariosView({
  funcionariosPurosDependencia, dependenciaActual,
  sincronizarBienesConPadron, handleDownloadTemplateFuncionarios,
  fileInputFuncionariosRef, isAdmin, setIsUbicacionesModalOpen,
  setIsNewFuncionarioModalOpen, searchFuncionarioInput, setSearchFuncionarioInput,
  setCurrentPaginaFuncionarios, funcionariosPaginados,
  handleEditFuncionario, handleDeleteFuncionario, renderPaginationFuncionarios
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-12">

      {/* CABECERA DE SECCIÓN */}
      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Identificación de la sección */}
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-address-book text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Plantel de Funcionarios</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                  {funcionariosPurosDependencia.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Directorio oficial de personal asignado a <strong className="text-zinc-900 dark:text-white font-semibold">{dependenciaActual}</strong>
              </p>
            </div>
          </div>

          {/* Botones de Acción Principal */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={sincronizarBienesConPadron}
              className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              title="Sincronizar custodios con inventario"
            >
              <i className="fa-solid fa-rotate"></i>
              <span>Sincronizar</span>
            </button>

            <button
              onClick={handleDownloadTemplateFuncionarios}
              className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              title="Descargar plantilla de funcionarios"
            >
              <i className="fa-solid fa-file-excel text-emerald-600 dark:text-emerald-400"></i>
              <span>Plantilla</span>
            </button>

            <button
              onClick={() => fileInputFuncionariosRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              title="Importar lista de funcionarios desde CSV"
            >
              <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i>
              <span>Importar CSV</span>
            </button>

            {isAdmin && (
            <button
              onClick={() => setIsUbicacionesModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              title="Gestionar catálogo de ubicaciones"
            >
              <i className="fa-solid fa-location-dot text-sky-600 dark:text-sky-400"></i>
              <span>Ubicaciones</span>
            </button>
            )}

            <span className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1"></span>

            <button
              onClick={() => setIsNewFuncionarioModalOpen(true)}
              title="Registrar nuevo funcionario"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              <span>Nuevo Funcionario</span>
            </button>
          </div>

        </div>

        {/* Barra de búsqueda del padrón */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/10">
  <div className="relative w-full">
    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
    <input
      type="text"
      placeholder="Buscar funcionario por nombre, apellido o número de cédula..."
      value={searchFuncionarioInput}
      onChange={(e) => {
        setSearchFuncionarioInput(e.target.value);
        setCurrentPaginaFuncionarios(1); // Resetea la paginación para mostrar resultados desde la página 1
      }}
      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-11 pl-11 pr-4 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none transition-all"
    />
  </div>
</div>

      </div>

      {/* TABLA DE FUNCIONARIOS */}
      <div className="flex-1 bg-white dark:bg-white/[0.04] shadow-sm border border-zinc-200/70 dark:border-white/10 rounded-3xl flex flex-col overflow-hidden relative min-h-[450px]">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-10 border-b border-zinc-200/70 dark:border-white/10">
                <tr className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.14em]">
                  <th className="py-4 pl-8 pr-4">Cédula de Identidad</th>
                  <th className="px-4 py-4 w-1/3">Nombre Completo</th>
                  <th className="px-4 py-4 w-1/3">Cargo Institucional</th>
                  <th className="relative py-4 pl-4 pr-8 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {funcionariosPaginados.map((f, idx) => {
                  if (f.esSeparador) {
                      return (
                          <tr key={`sep-${f.letra}-${idx}`}>
                              <td colSpan="4" className="py-2.5 pl-8 pr-4 bg-zinc-50/70 dark:bg-white/[0.02] border-y border-zinc-100 dark:border-white/5">
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold">
                                      {f.letra}
                                  </span>
                              </td>
                          </tr>
                      );
                  }

                  const inicial = f.nombre ? f.nombre.charAt(0).toUpperCase() : 'F';

                  return (
                    <tr key={f.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group">
                        <td className="py-4 pl-8 pr-4 align-middle tabular-nums font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                            {formatCI(f.cedula)}
                        </td>
                        <td className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                                    {inicial}
                                </div>
                                <span className="font-bold text-zinc-900 dark:text-white text-sm">{f.nombre}</span>
                            </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                                {f.cargo || 'Funcionario'}
                            </span>
                        </td>
                        <td className="relative py-4 pl-4 pr-8 align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                                <button
                                    onClick={() => handleEditFuncionario(f)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                    title="Editar funcionario" aria-label="Editar funcionario"
                                >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <button
                                    onClick={() => handleDeleteFuncionario(f.id)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                                    title={isAdmin ? 'Eliminar funcionario' : 'Solicitar eliminación al administrador'}
                                >
                                    <i className={`fa-solid ${isAdmin ? 'fa-trash-can' : 'fa-paper-plane'} text-xs`}></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                  );
                })}
                {funcionariosPurosDependencia.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3 shadow-inner">
                            <i className="fa-solid fa-users-slash text-2xl"></i>
                        </div>
                        <span className="text-sm font-bold text-zinc-400">No hay funcionarios registrados en esta dependencia.</span>
                        <div>
                          <button
                            onClick={() => setIsNewFuncionarioModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer active:scale-95"
                          >
                            <i className="fa-solid fa-user-plus text-xs"></i> Registrar el primero
                          </button>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPaginationFuncionarios()}
      </div>
    </div>
  );
}
