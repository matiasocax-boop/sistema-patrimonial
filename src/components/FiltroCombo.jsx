import React, { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import { puntuarOpcion } from '../utils/busqueda';

// Combo con buscador que reemplaza a los <select> nativos. Motivo: el popup del
// <select> lo dibuja el sistema operativo (listado blanco sobre la app oscura,
// con las opciones superpuestas e ilegibles) y no se puede estilar por CSS.
//
// - Búsqueda insensible a tildes/mayúsculas ("victor" encuentra "VÍCTOR").
// - Ordena por cercanía: empieza con > palabra que empieza con > contiene.
// - `opciones` acepta strings o { label, value }.
// - Controlado si se pasa `valor`; si no, guarda el valor internamente y lo
//   expone en un input oculto `name` para que los formularios con FormData
//   sigan leyendo el valor.

export default function FiltroCombo({
  valor, opciones, onElegir, etiquetaTodos, titulo, ancho = 'w-full',
  name, required, disabled, className = '', compacto = false
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [interno, setInterno] = useState(valor ?? '');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const valorActual = valor !== undefined && valor !== null ? valor : interno;

  const elegir = (v) => {
    setInterno(v);
    setAbierto(false);
    if (onElegir) onElegir(v);
  };

  const q = normalizeStr(texto);
  const items = useMemo(
    () => (opciones || []).map(o => (typeof o === 'object' && o !== null)
      ? { label: String(o.label ?? ''), value: o.value ?? o.label ?? '' }
      : { label: String(o), value: String(o) }),
    [opciones]
  );

  const lista = useMemo(() => {
    const base = items.map(o => ({ ...o, norm: normalizeStr(o.label) }));
    const filtrada = q ? base.filter(o => o.norm.includes(q)) : base;
    return filtrada
      .map(o => ({ ...o, score: puntuarOpcion(o.norm, q) }))
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, 'es'))
      .slice(0, 100);
  }, [items, q]);

  const total = useMemo(() => {
    if (!q) return items.length;
    return items.filter(o => normalizeStr(o.label).includes(q)).length;
  }, [items, q]);

  const valorTexto = items.find(o => String(o.value) === String(valorActual))?.label || '';
  const etiqueta = valorTexto || etiquetaTodos;
  const alto = compacto ? 'h-9 text-[12px]' : 'h-10 text-[13px]';

  return (
    <div ref={cajaRef} className={`relative ${ancho}`}>
      {name && <input type="hidden" name={name} value={valorActual ?? ''} required={required} />}
      <button
        type="button"
        onClick={() => { if (disabled) return; setTexto(''); setAbierto(v => !v); }}
        title={titulo}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-required={required || undefined}
        className={`w-full ${alto} rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all focus-visible:ring-2 cursor-pointer hover:border-zinc-300 dark:hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
      >
        <span className={`flex-1 min-w-0 truncate text-left ${!valorTexto ? 'text-zinc-400 dark:text-zinc-500' : ''}`}>{etiqueta}</span>
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
                if (e.key === 'Enter' && lista.length > 0) elegir(lista[0].value);
              }}
              placeholder="Escribe para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
            <button
              type="button"
              onClick={() => elegir('')}
              className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${!valorActual ? 'font-black text-brand-primary dark:text-brand-accent' : 'font-semibold text-zinc-500 dark:text-zinc-400'}`}
            >
              {etiquetaTodos}
            </button>
            {lista.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => elegir(o.value)}
                title={o.label}
                className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${String(o.value) === String(valorActual) ? 'font-black text-brand-primary dark:text-brand-accent' : 'font-semibold text-zinc-700 dark:text-zinc-200'}`}
              >
                <span className="block truncate">{o.label}</span>
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