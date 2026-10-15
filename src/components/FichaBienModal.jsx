import React, { useState } from 'react';

const TIPO_STYLE = {
  alta: { box: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: 'fa-plus', dot: 'bg-emerald-500' },
  asignacion: { box: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: 'fa-file-signature', dot: 'bg-blue-500' },
  traslado: { box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: 'fa-truck-fast', dot: 'bg-amber-500' },
  modificacion: { box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20', icon: 'fa-pen-to-square', dot: 'bg-zinc-400' },
  baja: { box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: 'fa-flag', dot: 'bg-rose-500' },
  otro: { box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', icon: 'fa-circle-info', dot: 'bg-violet-500' },
};

export default function FichaBienModal({ isOpen, onClose, bien, eventos, formatCurrency, formatDateText, onAgregarFoto, onEliminarFoto, subiendoFoto, esAdmin, STYLES }) {
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <i className="fa-solid fa-id-card text-lg"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight font-mono">
                  {bien.rotulo || 'S/R'}
                </h2>
                {bien.estadoConservacion && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    bien.estadoConservacion === 'De Baja'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {bien.estadoConservacion}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={bien.descripcion}>{bien.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Valor</p>
              <p className="text-base font-black tabular-nums text-zinc-900 dark:text-white dato-sensible">Gs. {formatCurrency(bien.valorUnitario || '0')}</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Dato label="Cuenta" value={[bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('.')} />
            <Dato label="Adquisición" value={bien.fechaAdquisicion ? formatDateText(bien.fechaAdquisicion) : null} />
            <Dato label="Vida útil" value={bien.vidaUtil ? `${bien.vidaUtil} años` : null} />
            <Dato label="Ubicación" value={bien.ubicacion} />
            <Dato label="Responsable" value={bien.funcionario} />
            <Dato label="Dependencia" value={bien.dependencia} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                Evidencia fotográfica · {(bien.fotos || []).length}/5
              </p>
              <label
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${subiendoFoto ? 'opacity-50 pointer-events-none bg-zinc-100 dark:bg-white/10 text-zinc-400' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200'}`}
                title="Tomar o subir foto del estado físico"
              >
                <i className={`fa-solid ${subiendoFoto ? 'fa-circle-notch fa-spin' : 'fa-camera'}`}></i>
                {subiendoFoto ? 'Subiendo...' : 'Agregar foto'}
                <input
                  type="file" accept="image/*" capture="environment" className="hidden"
                  disabled={subiendoFoto}
                  onChange={(e) => { if (e.target.files?.[0]) onAgregarFoto(e.target.files[0]); e.target.value = ''; }}
                />
              </label>
            </div>
            {(bien.fotos || []).length === 0 ? (
              <p className="text-xs text-zinc-400 font-medium rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-5 text-center">
                Sin fotos. Agrega la primera como evidencia del estado físico.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(bien.fotos || []).map((f, i) => (
                  <div key={f.url || i} className="relative group/foto rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-white/5 aspect-square">
                    <button onClick={() => setFotoAmpliada(f.url)} className="w-full h-full cursor-pointer" title="Ampliar foto">
                      <img src={f.url} alt={`Foto ${i + 1} del bien`} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </button>
                    {esAdmin && (
                      <button
                        onClick={() => onEliminarFoto(f)}
                        title="Eliminar foto"
                        className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-lg bg-zinc-950/70 text-white hidden group-hover/foto:flex hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-3">
              Trazabilidad · {eventos.length} evento{eventos.length === 1 ? '' : 's'}
            </p>
            {eventos.length === 0 ? (
              <div className="text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6">
                <i className="fa-solid fa-timeline text-xl text-zinc-300 dark:text-zinc-600 mb-2"></i>
                <p className="text-xs text-zinc-400 font-semibold">Sin movimientos registrados para este bien.</p>
              </div>
            ) : (
              <ol className="relative ml-2 border-l-2 border-zinc-100 dark:border-white/10">
                {eventos.map((ev, i) => {
                  const s = TIPO_STYLE[ev.tipo] || st;
                  return (
                    <li key={i} className="relative pl-6 pb-5 last:pb-1">
                      <span className={`absolute -left-[7px] top-2 h-3 w-3 rounded-full ${s.dot} ring-4 ring-white dark:ring-zinc-900`}></span>
                      <div className="rounded-2xl border border-zinc-100 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.03] px-3.5 py-3 hover:border-zinc-200 dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${s.box}`}>
                            <i className={`fa-solid ${s.icon} text-[11px]`}></i>
                          </span>
                          <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight flex-1 min-w-0 truncate" title={ev.titulo}>{ev.titulo}</p>
                          <span className="shrink-0 text-[10px] font-bold tabular-nums uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-white dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 rounded-lg px-2 py-0.5">
                            {ev.fechaFmt || ev.fecha || ''}
                          </span>
                        </div>
                        {ev.detalle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed pl-[38px]">{ev.detalle}</p>}
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
      {fotoAmpliada && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm animate-fade-in" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Foto ampliada del bien" className="max-h-[90dvh] max-w-full rounded-2xl shadow-2xl object-contain" />
          <button
            onClick={() => setFotoAmpliada(null)}
            title="Cerrar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
    </div>
  );
}
