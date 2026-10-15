import AnimatedNumber from '../components/AnimatedNumber';
import { formatCurrency, formatDateText } from '../utils/helpers';

// Vista "Mi Dependencia" de solo lectura (extraída de App.jsx, Fase 4).
export default function ResumenView({ dependenciaActual, stats, pendientes, fc10List }) {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-house-user text-lg"></i>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Vista de solo lectura</p>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight mt-0.5">Mi Dependencia · {dependenciaActual}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight"><AnimatedNumber value={stats.totalItems} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">Bienes activos</p>
        </div>
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">Gs. {formatCurrency(stats.totalValue)}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">Valor patrimonial</p>
        </div>
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight"><AnimatedNumber value={stats.withoutQR} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">Pendientes de QR</p>
        </div>
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight"><AnimatedNumber value={stats.withoutFc10} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">Sin acta FC-10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <i className="fa-solid fa-list-check text-zinc-400"></i> Estado de regularización
          </h3>
          <div className="space-y-3">
            {pendientes.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${p.box}`}>
                  <i className={`fa-solid ${p.icon} text-xs`}></i>
                </span>
                <span className="flex-1 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">{p.label}</span>
                <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <i className="fa-solid fa-clock-rotate-left text-zinc-400"></i> Últimas asignaciones
          </h3>
          <div className="space-y-1">
            {fc10List.filter(fc => fc.dependencia === dependenciaActual).sort((a, b) => String(b.fechaGeneracion || b.entregadoFecha || '').localeCompare(String(a.fechaGeneracion || a.entregadoFecha || ''))).slice(0, 5).map(fc => (
              <div key={fc.id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-white/5 last:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                  {(fc.funcionarioNombre || '?').charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{fc.funcionarioNombre || 'Sin responsable'}</span>
                  <span className="block text-[11px] text-zinc-400 truncate">{fc.entregadoFecha ? formatDateText(fc.entregadoFecha) : (fc.fechaGeneracion ? formatDateText(fc.fechaGeneracion) : '')}</span>
                </span>
              </div>
            ))}
            {fc10List.filter(fc => fc.dependencia === dependenciaActual).length === 0 && (
              <p className="text-xs font-semibold text-zinc-400 py-4 text-center">Sin asignaciones registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
