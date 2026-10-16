// Resultado grande para modo campo: tras escanear muestra el bien con
// acciones claras (ver ficha o seguir escaneando). Pensado para móvil.
export default function CampoResultado({ escaneo, onVerFicha, onSeguir, onCerrar, STYLES }) {
  if (!escaneo?.bien) return null;
  const bien = escaneo.bien;
  return (
    <div className={STYLES.modalOverlay} onClick={onCerrar}>
      <div
        className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="animate-pop mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
          <i className="fa-solid fa-circle-check text-2xl"></i>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Activo localizado
        </p>
        <h3 className="mt-1 text-xl font-black tracking-tight text-zinc-900 dark:text-white font-mono">
          {bien.rotulo || 'S/R'}
        </h3>
        <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-300 line-clamp-2">
          {bien.descripcion || 'Sin descripción'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="rounded-lg bg-zinc-100 dark:bg-white/10 px-2.5 py-1">
            {bien.funcionario || 'Sin responsable'}
          </span>
          <span className="rounded-lg bg-zinc-100 dark:bg-white/10 px-2.5 py-1">
            {bien.ubicacion || 'Sin ubicación'}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => onVerFicha(bien)}
            className="h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-black hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer active:scale-[0.98]"
          >
            Ver ficha
          </button>
          <button
            onClick={onSeguir}
            className="h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
          >
            Seguir
          </button>
        </div>
        <button
          onClick={onCerrar}
          className="mt-3 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
