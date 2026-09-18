// src/components/modals/ConsolidadoFC10Modal.jsx
import React, { useState } from 'react';
import { formatCI, normalizeStr } from '../../utils/helpers';

export default function ConsolidadoFC10Modal({ isOpen, onClose, bienes, dependenciaActual, funcionariosPadron, handleGenerateConsolidatedFC10PDF, STYLES }) {
    const [searchConsolidadoModal, setSearchConsolidadoModal] = useState('');
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-2xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>
                
                <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-sm">
                            <i className="fa-solid fa-file-lines text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Actas FC-10 Consolidadas</h2>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Seleccione o busque un funcionario para generar su acta agrupada en {dependenciaActual}</p>
                        </div>
                    </div>
                    <button onClick={() => { onClose(); setSearchConsolidadoModal(''); }} className="rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div className="px-8 pt-6 pb-2 bg-white dark:bg-zinc-900">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                        <input 
                            type="text"
                            placeholder="Buscar por nombre o número de cédula..."
                            value={searchConsolidadoModal}
                            onChange={(e) => setSearchConsolidadoModal(e.target.value)}
                            className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 py-3 pl-11 pr-4 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-brand-primary/25 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="p-8 pt-4 max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar bg-white dark:bg-zinc-900">
                    {Array.from(new Set(
                        bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && b.estadoConservacion !== 'De Baja')
                              .map(b => b.funcionario)
                    ))
                    .filter(funcNombre => {
                        if (!searchConsolidadoModal.trim()) return true;
                        const termino = searchConsolidadoModal.toLowerCase().trim();
                        // Filtrado estricto por dependencia actual para evitar cruce de datos
                        const infoPadron = funcionariosPadron.find(f => f.dependencia === dependenciaActual && normalizeStr(f.nombre) === normalizeStr(funcNombre));
                        const cedulaStr = infoPadron ? String(infoPadron.cedula).toLowerCase() : '';
                        return funcNombre.toLowerCase().includes(termino) || cedulaStr.includes(termino);
                    })
                    .map(funcNombre => {
                        const bienesCount = bienes.filter(b => b.dependencia === dependenciaActual && normalizeStr(b.funcionario) === normalizeStr(funcNombre)).length;
                        // Búsqueda en el padrón acotada a la dependencia actual
                        const infoPadron = funcionariosPadron.find(f => f.dependencia === dependenciaActual && normalizeStr(f.nombre) === normalizeStr(funcNombre));

                        return (
                            <div key={funcNombre} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 hover:border-brand-primary transition-all">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-zinc-900 dark:text-white">{funcNombre}</p>
                                    <p className="text-xs font-bold text-zinc-400">
                                        C.I: {infoPadron ? formatCI(infoPadron.cedula) : 'S/D'} • <span className="text-brand-primary">{bienesCount} bienes asignados</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleGenerateConsolidatedFC10PDF(funcNombre)}
                                    className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-black shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-print"></i> Generar Acta
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
                    <button onClick={() => { onClose(); setSearchConsolidadoModal(''); }} className="py-3 px-6 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer">Cerrar</button>
                </div>
            </div>
        </div>
    );
}