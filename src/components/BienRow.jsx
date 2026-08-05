// frontend/src/components/BienRow.jsx
import React from 'react';

const formatCurrency = (value) => {
  if (!value) return "0";
  const number = parseInt(value.toString().replace(/\D/g, ''), 10);
  return isNaN(number) ? "0" : new Intl.NumberFormat('es-PY').format(number);
};

const formatDateText = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim().replace(/\//g, '-');
  const p = str.split('-');
  if (p.length === 3) {
    if (p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`;
    if (p[2].length === 4) return `${p[0]}-${p[1]}-${p[2]}`;
  }
  return str;
};

export default function BienRow({ b, fcRecord, onAction, isAdmin }) {
  const isDeBaja = b.estadoConservacion === 'De Baja';
  const hasPendingBaja = b.solicitudBaja === true;

  return (
    <tr className={`hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover/60 border-b border-zinc-100 dark:border-darkbg-border/60 transition-all group ${isDeBaja ? 'opacity-60 bg-zinc-50/50' : ''}`}>
      
      {/* 1. IDENTIFICACIÓN Y DESCRIPCIÓN */}
      <td className="py-4 pl-6 pr-4 align-middle">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-zinc-900 dark:text-white text-sm font-mono tracking-tight">
            {b.rotulo || 'S/R'}
          </span>
          {hasPendingBaja && (
            <span className="inline-flex items-center rounded-xl bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 uppercase tracking-wider shadow-2xs">
              Req. Acción
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 max-w-md leading-relaxed">{b.descripcion || 'Sin descripción'}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-darkbg-main px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-darkbg-border">
            # {b.cuenta || 'S/C'}
          </span>
          <span className="text-xs text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <i className="fa-regular fa-calendar"></i> {formatDateText(b.fechaAdquisicion) || 'S/F'}
          </span>
        </div>
      </td>

      {/* 2. LOCALIZACIÓN Y CUSTODIO */}
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-500 dark:text-zinc-400">
            <i className="fa-solid fa-user text-xs"></i>
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {b.funcionario || fcRecord?.funcionarioNombre || fcRecord?.responsable || 'No asignado'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-zinc-500 dark:text-zinc-400">
              <i className="fa-solid fa-door-open text-xs"></i>
            </div>
            <span className="font-medium">{b.ubicacion || fcRecord?.ubicacion || 'Sin ubicación'}</span>
          </div>
          {(fcRecord?.entregadoFecha || fcRecord?.fecha || fcRecord?.fechaAsignacion) && (
            <span className="text-[10px] font-bold text-brand-primary dark:text-brand-accent font-mono bg-brand-light/50 dark:bg-brand-primary/10 px-2 py-0.5 rounded-md">
              Asig: {formatDateText(fcRecord?.entregadoFecha || fcRecord?.fecha || fcRecord?.fechaAsignacion)}
            </span>
          )}
        </div>
      </td>

      {/* 3. CONDICIÓN FÍSICA Y BADGES DE ESTADO */}
      <td className="px-4 py-4 align-middle whitespace-nowrap">
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-2xs border ${
            b.estadoConservacion === 'Muy bueno' || b.estadoConservacion === 'Bueno' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40' 
              : b.estadoConservacion === 'Regular'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              b.estadoConservacion === 'Muy bueno' || b.estadoConservacion === 'Bueno' 
                ? 'bg-emerald-500' 
                : b.estadoConservacion === 'Regular'
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}></span>
            {b.estadoConservacion || 'Bueno'}
          </span>
          
          <button 
            onClick={() => onAction('toggleQR', b)} 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider transition-all cursor-pointer shadow-2xs border ${
              b.hasQR 
                ? 'bg-brand-primary text-white border-brand-primary hover:bg-brand-hover' 
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-darkbg-main dark:text-zinc-400 dark:border-darkbg-border'
            }`}
          >
            <i className="fa-solid fa-qrcode text-[10px]"></i> {b.hasQR ? 'QR Activo' : 'Sin QR'}
          </button>
        </div>
      </td>

      {/* 4. BARRA DE ACCIONES CONTEXTUALES */}
      <td className="relative py-4 pl-4 pr-6 align-middle text-right">
        <div className="inline-flex items-center gap-1 bg-zinc-50 dark:bg-darkbg-main border border-zinc-200/60 dark:border-darkbg-border p-1 rounded-xl shadow-2xs">
          <button onClick={() => onAction('openQRDownload', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-brand-primary hover:bg-white dark:hover:bg-darkbg-card transition-all cursor-pointer" title="Descargar QR"><i className="fa-solid fa-qrcode text-xs"></i></button>
          <button onClick={() => onAction('openFC10', b, fcRecord)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-brand-primary hover:bg-white dark:hover:bg-darkbg-card transition-all cursor-pointer" title="Asignación FC-10"><i className="fa-solid fa-file-signature text-xs"></i></button>
          <button onClick={() => onAction('openFC11', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-brand-primary hover:bg-white dark:hover:bg-darkbg-card transition-all cursor-pointer" title="Traslado FC-11"><i className="fa-solid fa-truck-fast text-xs"></i></button>
          <button onClick={() => onAction('editBien', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-brand-primary hover:bg-white dark:hover:bg-darkbg-card transition-all cursor-pointer" title="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
          {isAdmin ? (
            <button onClick={() => onAction('deleteBien', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer" title="Eliminar"><i className="fa-solid fa-trash-can text-xs"></i></button>
          ) : (
            <button onClick={() => onAction('requestBaja', b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all cursor-pointer" title="Solicitar Baja"><i className="fa-solid fa-arrow-down-short-wide text-xs"></i></button>
          )}
        </div>
      </td>
    </tr>
  );
}