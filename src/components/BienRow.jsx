import React from 'react';

export default function BienRow({ b, fcRecord, onAction, isAdmin }) {
    const isBaja = b.estadoConservacion === 'De Baja';
    const isPendienteBaja = b.solicitudBaja;

    return (
        <tr className={`group transition-colors border-b border-zinc-100 dark:border-darkbg-border/50 ${isBaja ? 'bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-zinc-50 dark:hover:bg-darkbg-hover/50'}`}>
            <td className="py-4 pl-6 pr-4 align-top">
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm font-mono tracking-tight">
                        {b.rotulo || 'SIN RÓTULO'}
                    </span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug line-clamp-2">
                        {b.descripcion}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500 font-medium">
                        <span><i className="fa-solid fa-hashtag mr-1"></i> {b.cuenta || 'Sin cuenta'}</span>
                        {b.fechaAdquisicion && <span><i className="fa-regular fa-calendar mr-1"></i> {b.fechaAdquisicion.split('-').reverse().join('-')}</span>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                        <i className="fa-solid fa-user text-zinc-400 mt-0.5 text-xs"></i>
                        <span className={`text-sm ${b.funcionario ? 'font-semibold text-zinc-800 dark:text-zinc-200' : 'font-medium text-zinc-400 italic'}`}>
                            {b.funcionario || 'No asignado'}
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <i className="fa-solid fa-door-open text-zinc-400 mt-0.5 text-xs"></i>
                        <span className={`text-xs ${b.ubicacion ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 italic'}`}>
                            {b.ubicacion || 'Sin ubicación'}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 align-top">
                <div className="flex flex-col items-start gap-2">
                    {isBaja ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 ring-1 ring-inset ring-red-600/20 shadow-sm uppercase tracking-wider">
                            <i className="fa-solid fa-circle text-[8px]"></i> De Baja
                        </span>
                    ) : isPendienteBaja ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20 shadow-sm uppercase tracking-wider">
                            <i className="fa-solid fa-clock text-[10px]"></i> Baja en Revisión
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                            {b.estadoConservacion}
                        </span>
                    )}
                    
                    <button onClick={() => onAction('toggleQR', b)} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition-all shadow-sm cursor-pointer border ${b.hasQR ? 'bg-zinc-800 text-white border-zinc-900 hover:bg-zinc-700' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>
                        <i className="fa-solid fa-qrcode text-[10px]"></i> {b.hasQR ? 'QR Listo' : 'Sin QR'}
                    </button>
                </div>
            </td>
            <td className="relative py-4 pl-4 pr-6 align-middle text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAction('openQRDownload', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer" title="Descargar QR"><i className="fa-solid fa-qrcode"></i></button>
                    {!isBaja && <button onClick={() => onAction('openFC10', b)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${b.hasFC10 ? 'text-brand-primary bg-brand-light/50 hover:bg-brand-light' : 'text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50'}`} title="Gestionar FC-10"><i className="fa-solid fa-file-signature"></i></button>}
                    {!isBaja && <button onClick={() => onAction('openFC11', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer" title="Trasladar (FC-11)"><i className="fa-solid fa-truck-fast"></i></button>}
                    <button onClick={() => onAction('editBien', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer" title="Editar Información"><i className="fa-solid fa-pen-to-square"></i></button>
                    {!isBaja && !isPendienteBaja && (isAdmin ? (
                        <button onClick={() => onAction('deleteBien', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Dar de Baja"><i className="fa-solid fa-trash-can"></i></button>
                    ) : (
                        <button onClick={() => onAction('requestBaja', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer" title="Solicitar Baja"><i className="fa-solid fa-arrow-down-short-wide"></i></button>
                    ))}
                    {fcRecord && <button onClick={() => onAction('printFC10', b, fcRecord)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer" title="Imprimir FC-10 Vigente"><i className="fa-solid fa-print"></i></button>}
                </div>
            </td>
        </tr>
    );
}