// Vista de solicitudes de aprobación (bajas, firmas, etc.) - solo admin/desarrollador.
// Incluye estados claros (Pendiente, Aprobado, Rechazado, En Revisión) y auditoría básica.
import React, { useState } from 'react';
import EmptyState from '../components/EmptyState';

const ESTADO_INFO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30', dot: 'bg-amber-500' },
  APROBADO: { label: 'Aprobado', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30', dot: 'bg-rose-500' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30', dot: 'bg-sky-500' }
};

export default function AprobacionesView({
  solicitudesBaja, dependenciaActual, bienes,
  resolverSolicitudFuncionario, openResolucionModal,
  currentUser, isAdmin
}) {
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const conteo = solicitudesBaja.reduce(
    (acc, n) => {
      const e = n.estado || 'PENDIENTE';
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, APROBADO: 0, RECHAZADO: 0, EN_REVISION: 0 }
  );

  const listaFiltrada = filtroEstado === 'todos'
    ? solicitudesBaja
    : solicitudesBaja.filter(n => (n.estado || 'PENDIENTE') === filtroEstado);

  const ETAPAS = [
    { id: 'todos', label: 'Todos', n: solicitudesBaja.length },
    { id: 'PENDIENTE', label: 'Pendientes', n: conteo.PENDIENTE },
    { id: 'APROBADO', label: 'Aprobados', n: conteo.APROBADO },
    { id: 'RECHAZADO', label: 'Rechazados', n: conteo.RECHAZADO },
    { id: 'EN_REVISION', label: 'En Revisión', n: conteo.EN_REVISION }
  ];

  return (
    <div className="animate-fade-in flex flex-col flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-darkbg-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-check-to-slot text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Centro de Aprobaciones</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                {conteo.PENDIENTE} pendientes
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gestión y auditoría de solicitudes de baja en <strong className="text-zinc-900 dark:text-white font-semibold">{dependenciaActual}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 -mb-1">
          {ETAPAS.map(et => (
            <button
              key={et.id}
              onClick={() => setFiltroEstado(et.id)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                filtroEstado === et.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
              }`}
            >
              {et.label}
              <span className={`tabular-nums ${filtroEstado === et.id ? 'opacity-80' : 'text-zinc-400 dark:text-zinc-500'}`}>{et.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-darkbg-card border border-zinc-200/70 dark:border-darkbg-border rounded-3xl shadow-sm overflow-hidden flex-1 min-h-[400px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-zinc-50/50 dark:bg-darkbg-main/50 border-b border-zinc-200/50 dark:border-darkbg-border/50">
              <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                <th className="py-4 pl-6 sm:pl-8 pr-4">Bien / Solicitud</th>
                <th className="px-4 py-4">Solicitante</th>
                <th className="px-4 py-4">Fecha</th>
                <th className="px-4 py-4">Estado</th>
                <th className="py-4 pl-4 pr-6 sm:pr-8 text-right">Decisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 dark:divide-darkbg-border/30">
              {listaFiltrada.map((notif) => {
                const bienAsociado = bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || {
                  id: notif.bienId || notif.bien_id,
                  rotulo: notif.rotulo || 'S/R',
                  descripcion: notif.descripcion || 'Sin descripción'
                };
                const estado = notif.estado || 'PENDIENTE';
                const info = ESTADO_INFO[estado] || ESTADO_INFO.PENDIENTE;
                const estaResuelto = estado !== 'PENDIENTE';

                return (
                  <tr key={notif.id} className={`hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors ${estaResuelto ? 'opacity-80' : ''}`}>
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
                        {estaResuelto && notif.resueltoPor && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <i className="fa-solid fa-user-check text-[10px] shrink-0 text-zinc-400"></i>
                            <span className="font-semibold">Resuelto por: {notif.resueltoPor}</span>
                            {notif.resueltoEn && <span className="ml-2">· {new Date(notif.resueltoEn).toLocaleDateString()}</span>}
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
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>
                        <span className="h-2 w-2 rounded-full ${info.dot}"></span>
                        {info.label}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                      {!estaResuelto && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                            className="px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
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
                      )}
                      {estaResuelto && (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {estado.toLowerCase()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon="fa-check-double"
                      titulo="Bandeja de aprobaciones al día"
                      descripcion="No hay solicitudes pendientes con el filtro seleccionado."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        {Object.entries(ESTADO_INFO).map(([key, info]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full ${info.dot}"></span>
            {info.label}
          </span>
        ))}
      </div>
    </div>
  );
}
