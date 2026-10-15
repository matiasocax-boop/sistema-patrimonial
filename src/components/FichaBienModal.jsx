import React from 'react';

const TIPO_STYLE = {
  alta: { box: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: 'fa-plus', dot: 'bg-emerald-500' },
  asignacion: { box: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: 'fa-file-signature', dot: 'bg-blue-500' },
  traslado: { box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: 'fa-truck-fast', dot: 'bg-amber-500' },
  modificacion: { box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20', icon: 'fa-pen-to-square', dot: 'bg-zinc-400' },
  baja: { box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: 'fa-flag', dot: 'bg-rose-500' },
  otro: { box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', icon: 'fa-circle-info', dot: 'bg-violet-500' },
};

export default function FichaBienModal({ isOpen, onClose, bien, eventos, formatCurrency, formatDateText, STYLES }) {
  if (!isOpen || !bien) return null;
  const st = TIPO_STYLE.otro;

  const Dato = ({ label, value, sensible }) => (
    <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className={`text-xs font-bold text-zinc-900 dark:text-white mt-0.5 truncate ${sensible ? 'dato-sensible' : ''}`} title={String(value ?? '')}>{value || '-'}</p>
    </div>
  );

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-2xl"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-id-card text-base"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                Ficha del bien <span className="font-mono">{bien.rotulo || 'S/R'}</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={bien.descripcion}>{bien.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Dato label="Cuenta" value={[bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('.')} />
            <Dato label="Valor" value={`Gs. ${formatCurrency(bien.valorUnitario || '0')}`} sensible />
            <Dato label="Estado" value={bien.estadoConservacion || '-'} />
            <Dato label="Ubicación" value={bien.ubicacion} />
            <Dato label="Responsable" value={bien.funcionario} />
            <Dato label="Adquisición" value={bien.fechaAdquisicion ? formatDateText(bien.fechaAdquisicion) : null} />
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-3">
              Trazabilidad · {eventos.length} evento{eventos.length === 1 ? '' : 's'}
            </p>
            {eventos.length === 0 ? (
              <p className="text-xs text-zinc-400 font-medium rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-5 text-center">
                Sin movimientos registrados para este bien.
              </p>
            ) : (
              <ol className="relative space-y-0 border-l-2 border-zinc-100 dark:border-white/10 ml-2">
                {eventos.map((ev, i) => {
                  const s = TIPO_STYLE[ev.tipo] || st;
                  return (
                    <li key={i} className="relative pl-6 pb-5 last:pb-0">
                      <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${s.dot} ring-4 ring-white dark:ring-zinc-900`}></span>
                      <div className="flex items-start gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${s.box}`}>
                          <i className={`fa-solid ${s.icon} text-xs`}></i>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">{ev.titulo}</p>
                          {ev.detalle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{ev.detalle}</p>}
                          <p className="text-[11px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500 mt-1">{ev.fechaFmt || ev.fecha}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-5 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
