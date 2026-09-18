// src/components/modals/FuncionarioModal.jsx
import React from 'react';
import { formatCI } from '../../utils/helpers';

export default function FuncionarioModal({ isOpen, onClose, funcionarioToEdit, saveFuncionarioEdit, STYLES }) {
    if (!isOpen || !funcionarioToEdit) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>
                
                <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent border border-brand-primary/20 shadow-sm">
                            <i className="fa-solid fa-user-pen text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Editar Funcionario</h2>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Modifique los datos del padrón</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form onSubmit={saveFuncionarioEdit}>
                    <div className="p-8 space-y-5 bg-white dark:bg-zinc-900">
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Cédula de Identidad</label>
                            <input 
                                type="text" 
                                disabled 
                                value={formatCI(funcionarioToEdit.cedula)} 
                                className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-500 cursor-not-allowed shadow-inner" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Nombre y Apellido</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                defaultValue={funcionarioToEdit.nombre} 
                                required 
                                className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Cargo Institucional</label>
                            <input 
                                type="text" 
                                name="cargo" 
                                defaultValue={funcionarioToEdit.cargo || ''} 
                                placeholder="Ej: Asistente Administrativo" 
                                className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner" 
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 rounded-b-[32px]">
                        <button type="button" onClick={onClose} className="py-3.5 px-6 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all cursor-pointer">Cancelar</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-2xl text-sm font-black text-white bg-brand-primary hover:bg-brand-hover shadow-lg shadow-brand-primary/25 transition-all cursor-pointer">
                            <i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}