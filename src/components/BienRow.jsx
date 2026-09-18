import React from 'react';

export default function BienRow({ b, fcRecord, onAction, isAdmin }) {
    const isDeBaja = b.estadoConservacion === 'De Baja';

    return (
        <tr className={`
            /* Comportamiento Base (Móvil: Tarjetas) */
            block mb-4 p-4 rounded-2xl border border-zinc-200/80 shadow-sm bg-white dark:bg-darkbg-card
            /* Comportamiento md+ (Escritorio: Fila de Tabla) */
            md:table-row md:mb-0 md:p-0 md:rounded-none md:border-0 md:border-b md:border-zinc-100 md:shadow-none md:bg-transparent
            hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover/50 transition-colors group dark:md:border-darkbg-border/60
            ${isDeBaja ? 'opacity-60 bg-zinc-50/50 dark:bg-zinc-900/20' : ''}
        `}>
            
            {/* 1. Identificación y Descripción */}
            <td 
                data-label="Identificación" 
                className={`
                    block md:table-cell py-2 md:py-4 md:pl-6 md:pr-4 align-middle
                    /* CSS Trick: Etiqueta visible solo en móvil */
                    before:content-[attr(data-label)] before:font-bold before:text-[10px] before:uppercase before:tracking-wider before:text-zinc-400 before:block before:mb-1.5 md:before:hidden
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent font-mono font-black text-xs shadow-2xs">
                        <i className="fa-solid fa-tag"></i>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-zinc-900 dark:text-white tracking-tight">{b.rotulo || 'S/Rótulo'}</span>
                            {isDeBaja && (
                                <span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                                    De Baja
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">{b.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-darkbg-main px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-darkbg-border">
                                <i className="fa-solid fa-hashtag text-[9px] text-zinc-400"></i> {b.cuenta || 'S/Cta'}
                            </span>
                            {b.fechaAdquisicion && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                                    <i className="fa-regular fa-calendar text-[10px]"></i> {b.fechaAdquisicion}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* 2. Localización y Custodio */}
            <td 
                data-label="Localización / Custodio" 
                className={`
                    block md:table-cell py-2 md:px-4 md:py-4 align-middle border-t border-zinc-100 border-dashed md:border-none mt-2 pt-3 md:mt-0 md:pt-0 dark:border-darkbg-border
                    before:content-[attr(data-label)] before:font-bold before:text-[10px] before:uppercase before:tracking-wider before:text-zinc-400 before:block before:mb-1.5 md:before:hidden
                `}
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        <i className="fa-solid fa-user-tie text-indigo-500 w-4"></i>
                        <span>{b.funcionario || 'No asignado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <i className="fa-solid fa-location-dot text-emerald-500 w-4"></i>
                        <span>{b.ubicacion || 'Sin ubicación'}</span>
                    </div>
                </div>
            </td>

            {/* 3. Condición Física */}
            <td 
                data-label="Estado y QR" 
                className={`
                    block md:table-cell py-2 md:px-4 md:py-4 align-middle border-t border-zinc-100 border-dashed md:border-none mt-2 pt-3 md:mt-0 md:pt-0 dark:border-darkbg-border
                    before:content-[attr(data-label)] before:font-bold before:text-[10px] before:uppercase before:tracking-wider before:text-zinc-400 before:block before:mb-1.5 md:before:hidden
                `}
            >
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs ${
                        b.estadoConservacion === 'Muy bueno' || b.estadoConservacion === 'Bueno' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40' 
                            : b.estadoConservacion === 'Regular'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                    }`}>
                        {b.estadoConservacion || 'Bueno'}
                    </span>

                    <button 
                        onClick={() => onAction('toggleQR', b)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 outline-none ${
                            b.hasQR 
                                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40' 
                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-darkbg-main dark:text-zinc-400 border border-zinc-200 dark:border-darkbg-border'
                        }`}
                        title="Cambiar estado de etiqueta QR"
                    >
                        <i className={`fa-solid fa-qrcode ${b.hasQR ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}></i>
                        <span>{b.hasQR ? 'Con QR' : 'Sin QR'}</span>
                    </button>
                </div>
            </td>

            {/* 4. Acciones Rápidas */}
            <td 
                className={`
                    block md:table-cell py-3 md:py-4 md:pl-4 md:pr-6 align-middle text-right border-t border-zinc-100 md:border-none mt-3 pt-4 md:mt-0 md:pt-0 dark:border-darkbg-border
                `}
            >
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-1.5 opacity-100 md:opacity-90 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onAction('openQRDownload', b)} 
                        className="flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 outline-none" 
                        title="Imprimir Etiqueta / QR"
                    >
                        <i className="fa-solid fa-qrcode text-xs"></i>
                    </button>

                    <button 
                        onClick={() => onAction('openFC10', b)} 
                        className="flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none" 
                        title="Generar Acta FC-10"
                    >
                        <i className="fa-solid fa-file-signature text-xs"></i>
                    </button>

                    <button 
                        onClick={() => onAction('openFC11', b)} 
                        className="flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500 outline-none" 
                        title="Trasladar Bien (FC-11)"
                    >
                        <i className="fa-solid fa-truck-fast text-xs"></i>
                    </button>

                    <button 
                        onClick={() => onAction('editBien', b)} 
                        className="flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/50 dark:hover:text-sky-400 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-sky-500 outline-none" 
                        title="Editar Registro"
                    >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>

                    {/* BOTÓN DISPONIBLE PARA TODOS: Admin borra directo, Usuario regular envía solicitud de baja */}
                    <button 
                        onClick={() => {
                            if (isAdmin) {
                                onAction('deleteBien', b);
                            } else {
                                onAction('requestBaja', b);
                            }
                        }} 
                        className="flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" 
                        title={isAdmin ? (b.estadoConservacion === 'De Baja' ? 'Eliminar Definitivamente' : 'Dar de Baja') : 'Solicitar Baja de Bien'}
                    >
                        <i className={`fa-solid ${isAdmin ? 'fa-trash-can' : 'fa-paper-plane'} text-xs`}></i>
                    </button>
                </div>
            </td>
        </tr>
    );
}