import React, { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import { puntuarOpcion } from '../utils/busqueda';

// ============================================================================
// SELECTOR DE PERSONA DEL PADRON
// ============================================================================
// Reemplaza al <input list> + <datalist> nativo que usaba el modal de FC-10.
//
// Por que no el datalist: es un control del sistema operativo. Al elegir una
// opcion, el valor llega al input pero el evento change no siempre se dispara de
// la misma forma que al teclear, y los campos derivados (cedula, cargo) se
// quedaban vacios aunque la persona estuviera en el padron. Este selector es
// un control propio: al elegir, siempre seznsa los tres datos juntos.
//
// Ademas muestra el cargo y la CI de cada opcion, que es justo lo que hace
// falta para distinguir a homonimos sin adivinar.
export default function SelectorPersona({
  valor, funcionarios, onElegir, placeholder = 'Buscar funcionario...',
  altura = 'h-10', requerido = false, autoFocus = false, allowLibre = true
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  // cerrar al click fuera
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  // El texto de la caja es el nombre que se busca; se resetea al abrir.
  const q = normalizeStr(texto);

  const lista = useMemo(() => {
    const base = (funcionarios || []).map(f => ({
      nombre: String(f.nombre || '').trim(),
      doc: f.doc || '',
      cargo: f.cargo || '',
      norm: normalizeStr(f.nombre || '')
    })).filter(f => f.nombre);
    const filtrada = q ? base.filter(f => f.norm.includes(q)) : base;
    return filtrada
      .map(f => ({ ...f, score: puntuarOpcion(f.norm, q) }))
      // Los que tienen CI y cargo completos primero: son los que auto completan
      // de verdad y los mas utiles para elegir.
      .sort((a, b) => {
        const completos = (f) => (f.doc && f.cargo ? 0 : 1);
        if (completos(a) !== completos(b)) return completos(a) - completos(b);
        return a.score - b.score || a.nombre.localeCompare(b.nombre, 'es');
      })
      .slice(0, 80);
  }, [funcionarios, q]);

  const elegido = (funcionarios || []).find(f => normalizeStr(f.nombre || '') === normalizeStr(valor || ''));
  const tieneDatos = !!(elegido?.doc || elegido?.cargo);

  const seleccionar = (f) => {
    setAbierto(false);
    setTexto('');
    onElegir(f);
  };

  const etiqueta = valor
    ? (elegido ? `${elegido.nombre}${tieneDatos ? ` · ${elegido.doc || 's/cI'}` : ''}` : valor)
    : '';

  return (
    <div ref={cajaRef} className="relative">
      <button
        type="button"
        onClick={() => { setTexto(''); setAbierto(v => !v); }}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-required={requerido || undefined}
        className={`w-full ${altura} rounded-xl border bg-white dark:bg-zinc-900 px-4 text-left font-medium outline-none transition-all focus:ring-2 flex items-center gap-2 cursor-pointer ${
          requerido && !valor ? 'border-rose-300 dark:border-rose-800' : 'border-zinc-200 dark:border-white/10'
        } focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-zinc-900/5 dark:focus:ring-white/10 hover:border-zinc-300 dark:hover:border-white/20`}
      >
        <span className={`flex-1 min-w-0 truncate ${!etiqueta ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
          {etiqueta || placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-zinc-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Campo invisible para que FormData siga leyendo el valor real. */}
      <input type="hidden" value={valor || ''} readOnly />

      {abierto && (
        <div className="absolute left-0 right-0 z-[60] mt-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-pop">
          <div className="relative border-b border-zinc-100 dark:border-white/10">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
            <input
              autoFocus={autoFocus}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setAbierto(false); setTexto(''); }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (lista.length > 0) seleccionar(lista[0]);
                  else if (allowLibre && texto.trim()) seleccionar({ nombre: texto.trim(), doc: '', cargo: '' });
                }
              }}
              placeholder="Escribe el nombre para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {lista.map(f => (
              <button
                key={f.nombre}
                type="button"
                onClick={() => seleccionar(f)}
                title={f.doc ? `${f.nombre} · CI ${f.doc}` : f.nombre}
                className={`w-full px-3.5 py-2 text-left transition-colors cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${
                  normalizeStr(f.nombre) === normalizeStr(valor || '') ? 'bg-brand-primary/[0.07] dark:bg-brand-primary/[0.14]' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-user text-[9px] text-zinc-400 shrink-0"></i>
                  <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">{f.nombre}</span>
                  {f.cargo && <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">· {f.cargo}</span>}
                  {f.doc && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 tabular-nums">CI {f.doc}</span>}
                </span>
              </button>
            ))}
            {lista.length === 0 && allowLibre && texto.trim() && (
              <button
                type="button"
                onClick={() => seleccionar({ nombre: texto.trim(), doc: '', cargo: '' })}
                className="w-full px-3.5 py-2 text-left text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-plus text-[10px] mr-1.5"></i>
                Usar "{texto.trim()}" (no está en el padrón)
              </button>
            )}
            {lista.length === 0 && !allowLibre && (
              <p className="px-3.5 py-3 text-xs font-semibold text-zinc-400 text-center">Sin coincidencias.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}