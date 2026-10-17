import React, { useEffect, useRef, useState } from 'react';
import { normalizeStr } from '../utils/helpers';

// Campo del catálogo organizacional del FC-10: input de texto libre + desplegable
// de sugerencias. El desplegable va posicionado sobre el contenido (absolute),
// así nunca empuja ni se superpone con los campos siguientes (que era el problema
// del grid anterior). Incluye navegación con teclado y cierre al hacer clic fuera.
export default function CampoCatalogo({
    etiqueta,
    name,
    required,
    nombre,
    codigo,
    codigoName,
    etiquetaCodigo,
    onEscribirNombre,
    onCambiarCodigo,
    onElegirOpcion,
    opciones = [],
    placeholder,
    STYLES,
    nota,
}) {
    const [abierto, setAbierto] = useState(false);
    const [texto, setTexto] = useState(nombre || '');
    const [activo, setActivo] = useState(0);
    const cajaRef = useRef(null);
    const listaRef = useRef(null);

    // Refleja cambios externos (edición, "usar última asignación", cascada).
    useEffect(() => {
        setTexto(nombre || '');
    }, [nombre]);

    useEffect(() => {
        if (!abierto) return;
        const cerrar = (e) => {
            if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false);
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [abierto]);

    const hayTexto = texto.trim() !== '';
    // El padre manda el contexto (órgano / padre ya elegidos); el filtro por
    // texto se hace acá para que la lista reaccione al teclear.
    const q = normalizeStr(texto).trim();
    const listado = (opciones || [])
        .filter(o => !q || normalizeStr(o.nombre).includes(q) || normalizeStr(o.codigo).includes(q))
        .slice(0, 40);
    const faltaCodigo = required && hayTexto && !String(codigo || '').trim();

    // Si el nombre escrito coincide exacto con el catálogo, se completa el
    // código aunque la persona elija con Enter o lo escriba a mano.
    const completarCodigo = (valor) => {
        const q2 = normalizeStr(valor).trim();
        if (!q2) return;
        const hit = (opciones || []).find(o => normalizeStr(o.nombre) === q2 && o.codigo);
        if (hit && String(codigo || '').trim() !== hit.codigo) onCambiarCodigo(hit.codigo);
    };

    useEffect(() => {
        if (activo >= listado.length) setActivo(0);
    }, [listado.length, activo]);

    const elegir = (opcion) => {
        onEscribirNombre(opcion.nombre);
        if (opcion.codigo) onCambiarCodigo(opcion.codigo);
        setAbierto(false);
        setActivo(0);
        if (onElegirOpcion) onElegirOpcion(opcion);
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!abierto) { setAbierto(true); return; }
            setActivo(a => Math.min(a + 1, listado.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActivo(a => Math.max(a - 1, 0));
        } else if (e.key === 'Enter' && abierto && listado[activo]) {
            e.preventDefault();
            elegir(listado[activo]);
        } else if (e.key === 'Escape') {
            setAbierto(false);
        }
    };

    // Mantiene la opción activa a la vista al navegar con el teclado.
    useEffect(() => {
        if (!abierto || !listaRef.current) return;
        const el = listaRef.current.querySelector('[data-activo="true"]');
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [activo, abierto]);

    const hayCodigo = String(codigo || '').trim() !== '';

    return (
        <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                {etiqueta}{required ? ' *' : ''}
            </label>
            <div className="flex items-stretch gap-2">
                <div ref={cajaRef} className="relative flex-1 min-w-0">
                    <input
                        type="text"
                        name={name}
                        required={required}
                        value={texto}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={abierto}
                        aria-autocomplete="list"
                        placeholder={placeholder}
                        onChange={(e) => { setTexto(e.target.value); onEscribirNombre(e.target.value); completarCodigo(e.target.value); }}
                        onFocus={() => { setAbierto(true); setActivo(0); }}
                        onKeyDown={onKeyDown}
                        className={`${STYLES.input} py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${faltaCodigo ? 'border-amber-400/80 dark:border-amber-500/50' : ''}`}
                    />
                    {abierto && listado.length > 0 && (
                        <div ref={listaRef} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl py-1 animate-pop">
                            {listado.map((o, i) => (
                                <button
                                    key={`${o.nombre}-${i}`}
                                    type="button"
                                    data-activo={i === activo}
                                    onMouseEnter={() => setActivo(i)}
                                    onClick={() => elegir(o)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer ${i === activo ? 'bg-zinc-100 dark:bg-white/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`min-w-0 flex-1 truncate text-[13px] ${o.aprendida ? 'font-medium normal-case text-zinc-500 dark:text-zinc-400' : 'font-semibold text-zinc-700 dark:text-zinc-200'}`} title={o.nombre}>
                                        {o.nombre}
                                    </span>
                                    {o.aprendida && (
                                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">usada</span>
                                    )}
                                    <span className="shrink-0 font-mono text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                                        {o.codigo || '—'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    {abierto && listado.length === 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl px-3.5 py-2.5 animate-pop">
                            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                Sin coincidencias — podés escribirlo y cargar el código.
                            </p>
                        </div>
                    )}
                </div>
                <label className="sr-only">{etiquetaCodigo || `Código de ${etiqueta}`}</label>
                <div className="relative w-[92px] shrink-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">cód.</span>
                    <input
                        type="text"
                        name={codigoName}
                        required={required}
                        value={codigo || ''}
                        placeholder="—"
                        onChange={(e) => onCambiarCodigo(e.target.value)}
                        className={`${STYLES.input} py-2.5 pl-10 text-center font-mono text-[13px] font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${hayCodigo
                            ? 'bg-emerald-50/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/40'
                            : `bg-zinc-50 dark:bg-darkbg-main text-zinc-400 ${faltaCodigo ? 'border-amber-400/80 dark:border-amber-500/50' : ''}`}`}
                    />
                </div>
            </div>
            {(faltaCodigo || nota) && (
                <p className={`mt-1 text-[11px] font-medium ${faltaCodigo ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {faltaCodigo ? 'Cargá el código patrimonial.' : nota}
                </p>
            )}
        </div>
    );
}