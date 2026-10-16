// Vista de solicitudes de baja -solo admin- (extraída de App.jsx, Fase 5).
import EmptyState from '../components/EmptyState';
export default function AprobacionesView({
  solicitudesBaja, dependenciaActual, bienes,
  resolverSolicitudFuncionario, openResolucionModal
}) {
  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-check-to-slot text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Solicitudes de Baja</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                {solicitudesBaja.length} pendientes
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gestión y aprobación de bienes dados de baja en <strong className="text-zinc-900 dark:text-white font-semibold">{dependenciaActual}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <th className="py-4 pl-6 sm:pl-8 pr-4">Registro Solicitado</th>
                <th className="px-4 py-4">Solicitante</th>
                <th className="px-4 py-4">Fecha</th>
                <th className="py-4 pl-4 pr-6 sm:pr-8 text-right">Decisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/30">
              {solicitudesBaja.map((notif) => {
                // Solicitud de padrón: fila adaptada a funcionario
                if (notif.tipo === 'BAJA_FUNCIONARIO') {
                  return (
                    <tr key={notif.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                            {(notif.nombre || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{notif.nombre || 'Sin nombre'}</p>
                            <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">CI {notif.cedula || 'S/C'} · Padrón</p>
                          </div>
                        </div>
                        {notif.motivo && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                            <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-amber-600"></i>
                            <div className="flex-1">
                              <span className="font-bold">Motivo:</span> {notif.motivo}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-user text-zinc-400"></i>
                          <span>{notif.solicitante || 'Funcionario'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-zinc-500 tabular-nums">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Reciente'}
                      </td>
                      <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => resolverSolicitudFuncionario(notif, false)}
                            className="px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => resolverSolicitudFuncionario(notif, true)}
                            className="px-4 h-10 rounded-xl text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                          >
                            Aprobar Baja
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                const bienAsociado = bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || {
                  id: notif.bienId || notif.bien_id,
                  rotulo: notif.rotulo || 'S/R',
                  descripcion: notif.descripcion || 'Sin descripción',
                  bajaSolicitadaPor: notif.solicitante || 'Usuario'
                };

                return (
                  <tr key={notif.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                      <div className="space-y-1">
                        <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                          {bienAsociado.rotulo}
                        </span>
                        <p className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2">
                          {bienAsociado.descripcion}
                        </p>
                        {notif.motivo && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                            <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-amber-600"></i>
                            <div className="flex-1">
                              <span className="font-bold">Motivo:</span> {notif.motivo}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user text-zinc-400"></i>
                        <span>{notif.solicitante || 'Funcionario'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-zinc-500 font-mono">
                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Reciente'}
                    </td>
                    <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                          className="px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => openResolucionModal(bienAsociado, 'aprobar', notif)}
                          className="px-4 h-10 rounded-xl text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                        >
                          Aprobar Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {solicitudesBaja.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <EmptyState
                      icon="fa-check-double"
                      titulo="Bandeja de aprobaciones al día"
                      descripcion="No hay solicitudes de baja pendientes en esta dependencia."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
