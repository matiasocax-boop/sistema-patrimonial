import React from 'react';

export default function CSVPreviewModal({ isOpen, onClose, onConfirm, data, STYLES }) {
  if (!isOpen) return null;

  const { validos = [], duplicados = [], errores = [], tipo = 'bienes' } = data;

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-2xl overflow-hidden"}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-file-shield text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                Previsualización de Importación ({tipo.toUpperCase()})
              </h2>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Resumen rápido */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{validos.length}</p>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-1 uppercase tracking-wider">Listos para importar</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-center">
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{duplicados.length}</p>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-1 uppercase tracking-wider">Duplicados (Omitidos)</p>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-center">
              <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{errores.length}</p>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mt-1 uppercase tracking-wider">Con Errores</p>
            </div>
          </div>

          {/* Listado de Errores si los hay */}
          {errores.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Filas con errores (Descartadas):</p>
              <div className="bg-white dark:bg-zinc-950 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1">
                {errores.map((err, idx) => (
                  <div key={idx} className="text-xs text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                    • Fila {err.linea}: {err.motivo}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado Válidos */}
          {validos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vista previa de registros válidos:</p>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1">
                {validos.slice(0, 10).map((v, idx) => (
                  <div key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 font-medium flex justify-between gap-3">
                    <span className="truncate">{v.rotulo || v.cedula} - {v.descripcion || v.nombre}</span>
                    <span className="text-zinc-400 tabular-nums shrink-0">{v.valorUnitario ? `Gs. ${v.valorUnitario}` : v.cargo}</span>
                  </div>
                ))}
                {validos.length > 10 && <p className="text-xs text-zinc-400 text-center italic pt-2 tabular-nums">Y {validos.length - 10} registros más...</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
          <button onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={validos.length === 0}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50 tabular-nums"
          >
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i> Confirmar e Importar ({validos.length})
          </button>
        </div>
      </div>
    </div>
  );
}
