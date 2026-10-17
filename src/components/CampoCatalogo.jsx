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
    deshabilitado,
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

    return (
        <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                {etiqueta}{required ? ' *' : ''}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px] gap-3">
                <div ref={cajaRef} className="relative">
                    <input
                        type="text"
                        name={name}
                        required={required}
                        value={texto}
                        disabled={deshabilitado}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={abierto}
                        aria-autocomplete="list"
                        placeholder={placeholder}
                        onChange={(e) => { setTexto(e.target.value); onEscribirNombre(e.target.value); completarCodigo(e.target.value); }}
                        onFocus={() => { setAbierto(true); setActivo(0); }}
                        onBlur={() => completarCodigo(texto)}
                        onKeyDown={onKeyDown}
                        className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${faltaCodigo ? 'border-amber-400/80 dark:border-amber-500/50' : ''}`}
                    />
                    {abierto && listado.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-56 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl animate-pop">
                            {listado.map((o, i) => (
                                <button
                                    key={`${o.nombre}-${i}`}
                                    type="button"
                                    data-activo={i === activo}
                                    onMouseEnter={() => setActivo(i)}
                                    onClick={() => elegir(o)}
                                    className={`w-full flex items-start justify-between gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer ${i === activo ? 'bg-brand-primary/10 dark:bg-brand-primary/20' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200 leading-tight">{o.nombre}</span>
                                        {(o.organo || o.aprendida) && (
                                            <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                                                {o.aprendida ? 'Usado en tu dependencia' : o.organo}
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 mt-0.5 text-[10px] tabular-nums font-black text-zinc-400">cod. {o.codigo || '—'}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {abierto && listado.length === 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl px-3.5 py-3 animate-pop">
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">
                                Sin coincidencias en el catálogo — escribí el nombre y cargá el código a mano.
                            </p>
                        </div>
                    )}
                </div>
                <div>
                    <label className="sr-only">{etiquetaCodigo || `Código de ${etiqueta}`}</label>
                    <input
                        type="text"
                        name={codigoName}
                        required={required}
                        value={codigo || ''}
                        disabled={deshabilitado}
                        placeholder="Código"
                        onChange={(e) => onCambiarCodigo(e.target.value)}
                        className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary tabular-nums ${faltaCodigo ? 'border-amber-400/80 dark:border-amber-500/50' : 'bg-zinc-100/60 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300'}`}
                    />
                </div>
            </div>
            {faltaCodigo && (
                <p className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">Sin código en el catálogo — escribilo a mano.</p>
            )}
            {!faltaCodigo && nota && (
                <p className="mt-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">{nota}</p>
            )}
        </div>
    );
}