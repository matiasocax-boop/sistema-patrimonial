// src/components/modals/FuncionarioModal.jsx
import React from 'react';
import { formatCI } from '../../utils/helpers';

export default function FuncionarioModal({ isOpen, onClose, funcionarioToEdit, saveFuncionarioEdit, STYLES }) {
    if (!isOpen || !funcionarioToEdit) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
                <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                            <i className="fa-solid fa-user-pen text-base"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Editar Funcionario</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Modifique los datos del padrón</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>

                <form onSubmit={saveFuncionarioEdit}>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cédula de Identidad</label>
                            <input
                                type="text"
                                disabled
                                value={formatCI(funcionarioToEdit.cedula)}
                                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-4 py-3 text-sm font-bold tabular-nums text-zinc-500 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre y Apellido</label>
                            <input
                                type="text"
                                name="nombre"
                                defaultValue={funcionarioToEdit.nombre}
                                required
                                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cargo Institucional</label>
                            <input
                                type="text"
                                name="cargo"
                                defaultValue={funcionarioToEdit.cargo || ''}
                                placeholder="Ej: Asistente Administrativo"
                                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50">
                            <i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
