import React, { useState, useEffect, useMemo, useRef } from 'react';
import { normalizeStr } from '../utils/helpers';
import { puntuarOpcion } from '../utils/busqueda';

// Combo con buscador para reemplazar selects nativos interminables.
// - Búsqueda insensible a tildes/mayúsculas ("victor" encuentra "VÍCTOR").
// - Ordena por cercanía: empieza con > palabra que empieza con > contiene.

export default function FiltroCombo({
  valor, opciones, onElegir, etiquetaTodos, titulo, ancho = 'w-full'
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const q = normalizeStr(texto);
  const lista = useMemo(() => {
    const base = (opciones || []).map(o => ({ original: o, norm: normalizeStr(o) }));
    const filtrada = q
      ? base.filter(o => o.norm.includes(q))
      : base;
    return filtrada
      .map(o => ({ ...o, score: puntuarOpcion(o.norm, q) }))
      .sort((a, b) => a.score - b.score || a.original.localeCompare(b.original, 'es'))
      .slice(0, 100);
  }, [opciones, q]);

  const total = useMemo(() => {
    if (!q) return (opciones || []).length;
    return (opciones || []).filter(o => normalizeStr(o).includes(q)).length;
  }, [opciones, q]);

  const etiqueta = valor || etiquetaTodos;

  return (
    <div ref={cajaRef} className={`relative ${ancho}`}>
      <button
        type="button"
        onClick={() => { setTexto(''); setAbierto(v => !v); }}
        title={titulo}
        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2 flex items-center gap-2 hover:border-zinc-300 dark:hover:border-white/20"
      >
        <span className="flex-1 min-w-0 truncate text-left">{etiqueta}</span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-zinc-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}></i>
      </button>
      {abierto && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-pop">
          <div className="relative border-b border-zinc-100 dark:border-white/10">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
            <input
              autoFocus
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAbierto(false);
                if (e.key === 'Enter' && lista.length > 0) { onElegir(lista[0].original); setAbierto(false); }
              }}
              placeholder="Escribe para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
            <button
              type="button"
              onClick={() => { onElegir(''); setAbierto(false); }}
              className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${!valor ? 'font-black text-brand-primary dark:text-brand-accent' : 'font-semibold text-zinc-500 dark:text-zinc-400'}`}
            >
              {etiquetaTodos}
            </button>
            {lista.map(o => (
              <button
                key={o.original}
                type="button"
                onClick={() => { onElegir(o.original); setAbierto(false); }}
                title={o.original}
                className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${o.original === valor ? 'font-black text-brand-primary dark:text-brand-accent' : 'font-semibold text-zinc-700 dark:text-zinc-200'}`}
              >
                <span className="block truncate">{o.original}</span>
              </button>
            ))}
            {lista.length === 0 && (
              <p className="px-3.5 py-3 text-xs font-semibold text-zinc-400 text-center">Sin coincidencias.</p>
            )}
            {total > 100 && (
              <p className="px-3.5 py-1.5 text-[10px] font-semibold text-zinc-400 border-t border-zinc-100 dark:border-white/10">
                {total - 100} más… afina la búsqueda.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
