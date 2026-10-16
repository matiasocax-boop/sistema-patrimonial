// src/components/modals/NuevoFuncionarioModal.jsx
import React, { useState } from 'react';
import { formatearMiles } from '../../utils/helpers';

export default function NuevoFuncionarioModal({ isOpen, onClose, onSave, dependenciaActual, ubicaciones = [], STYLES }) {
    const [ciAviso, setCiAviso] = useState('');
    if (!isOpen) return null;

    const validarCI = (valor) => {
        const digitos = String(valor || '').replace(/\D/g, '');
        if (!digitos) { setCiAviso(''); return true; }
        const ok = digitos.length >= 6 && digitos.length <= 8;
        setCiAviso(ok ? '' : 'La CI paraguaya suele tener 6 a 8 dígitos.');
        return ok;
    };

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
                <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                            <i className="fa-solid fa-user-plus text-base"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Nuevo Funcionario</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Registro manual en el padrón de {dependenciaActual}</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><i className="fa-solid fa-xmark text-base"></i></button>
                </div>

                <form onSubmit={onSave} className="flex flex-col">
                    <div className={STYLES.modalBody}>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cédula de Identidad</label>
                                <div className="relative">
                                    <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="cedula" required inputMode="numeric" onInput={(e) => { e.target.value = formatearMiles(e.target.value); validarCI(e.target.value); }} onBlur={(e) => validarCI(e.target.value)} className={`${STYLES.input} pl-11 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. 1.234.567" />
                                </div>
                                {ciAviso && (
                                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>{ciAviso}
                                  </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Nombre Completo</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="nombre" required className={`${STYLES.input} pl-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. Juan Pérez" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cargo Institucional</label>
                                <div className="relative">
                                    <i className="fa-solid fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="cargo" className={`${STYLES.input} pl-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. Administrador" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Ubicación asignada</label>
                                <div className="relative">
                                    <i className="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <select name="ubicacion" className={`${STYLES.input} pl-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer`} defaultValue="">
                                        <option value="">Sin ubicación asignada</option>
                                        {ubicaciones.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"><i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Funcionario</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
