import React, { useState, useEffect } from 'react';

// Tour guiado por pasos: resalta el elemento objetivo y muestra la tarjeta contextual.
export default function TourGuiado({ pasos, paso, setPaso, onClose, irTab }) {
  const [rect, setRect] = useState(null);
  const step = pasos[paso];

  useEffect(() => {
    if (!step) return;
    if (step.tab) irTab(step.tab);
    setRect(null);
    const t = setTimeout(() => {
      const el = step.selector ? document.querySelector(step.selector) : null;
      if (el) {
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 350);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [paso]);

  if (!step) return null;
  const ultimo = paso === pasos.length - 1;
  const esMovil = typeof window !== 'undefined' && window.innerWidth < 640;

  let cardStyle = {};
  if (!esMovil && rect) {
    const w = Math.min(340, window.innerWidth - 32);
    let left = Math.min(Math.max(16, rect.left), window.innerWidth - w - 16);
    let top = rect.bottom + 12;
    if (top + 230 > window.innerHeight) top = Math.max(16, rect.top - 242);
    cardStyle = { left, top, width: w };
  }

  return (
    <div className="fixed inset-0 z-[500]">
      {rect && (
        <div
          className="absolute rounded-2xl transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(5, 8, 20, 0.65)',
            border: '2px solid #60a5fa'
          }}
        />
      )}
      {!rect && <div className="absolute inset-0 bg-[#050814]/70 backdrop-blur-[1px]" onClick={onClose} />}

      <div
        className={`absolute z-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-5 sm:p-6 animate-slide-up ${
          esMovil || !rect ? 'inset-x-4 bottom-4' : ''
        }`}
        style={esMovil || !rect ? {} : cardStyle}
        role="dialog" aria-label={`Paso ${paso + 1} de ${pasos.length}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary dark:text-brand-accent mb-1.5">
          Paso {paso + 1} de {pasos.length}
        </p>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{step.titulo}</h3>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{step.texto}</p>
        <div className="flex items-center gap-1.5 mt-4 mb-4">
          {pasos.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === paso ? 'w-6 bg-brand-primary' : i < paso ? 'w-1.5 bg-brand-primary/50' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'}`}></span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer mr-auto">
            Omitir tour
          </button>
          {paso > 0 && (
            <button onClick={() => setPaso(paso - 1)} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer">
              Atrás
            </button>
          )}
          <button
            onClick={() => (ultimo ? onClose(true) : setPaso(paso + 1))}
            className="h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer"
          >
            {ultimo ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
