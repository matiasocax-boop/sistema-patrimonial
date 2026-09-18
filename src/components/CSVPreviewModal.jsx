import React from 'react';

export default function CSVPreviewModal({ isOpen, onClose, onConfirm, data, STYLES }) {
  if (!isOpen) return null;

  const { validos = [], duplicados = [], errores = [], tipo = 'bienes' } = data;

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-2xl !rounded-[32px] overflow-hidden"}>
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card flex justify-between items-center">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent">
              <i className="fa-solid fa-file-shield text-base"></i>
            </div>
            Previsualización de Importación ({tipo.toUpperCase()})
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover cursor-pointer">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-8 space-y-6 bg-zinc-50/50 dark:bg-darkbg-main/50 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Resumen rápido */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-center">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{validos.length}</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1 uppercase">Listos para importar</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-center">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{duplicados.length}</p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1 uppercase">Duplicados (Omitidos)</p>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-center">
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{errores.length}</p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1 uppercase">Con Errores</p>
            </div>
          </div>

          {/* Listado de Errores si los hay */}
          {errores.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Filas con errores (Descartadas):</p>
              <div className="bg-white dark:bg-darkbg-card border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1">
                {errores.map((err, idx) => (
                  <div key={idx} className="text-xs text-rose-700 dark:text-rose-400 font-mono">
                    • Fila {err.linea}: {err.motivo}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado Válidos */}
          {validos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Vista previa de registros válidos:</p>
              <div className="bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1">
                {validos.slice(0, 10).map((v, idx) => (
                  <div key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 font-medium flex justify-between">
                    <span>{v.rotulo || v.cedula} - {v.descripcion || v.nombre}</span>
                    <span className="text-zinc-400">{v.valorUnitario ? `Gs. ${v.valorUnitario}` : v.cargo}</span>
                  </div>
                ))}
                {validos.length > 10 && <p className="text-xs text-zinc-400 text-center italic pt-2">Y {validos.length - 10} registros más...</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card">
          <button onClick={onClose} className={STYLES.btnSecondary}>Cancelar</button>
          <button 
            onClick={onConfirm} 
            disabled={validos.length === 0} 
            className={STYLES.btnPrimary + " disabled:opacity-50"}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Confirmar e Importar ({validos.length})
          </button>
        </div>
      </div>
    </div>
  );
}