// src/components/modals/NuevoFuncionarioModal.jsx
import React from 'react';

export default function NuevoFuncionarioModal({ isOpen, onClose, onSave, dependenciaActual, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-darkbg-border animate-slide-up"}>
                <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-black">
                            <i className="fa-solid fa-user-plus text-base"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Nuevo Funcionario</h2>
                            <p className="text-xs text-zinc-400 font-medium">Registro manual en el padrón de {dependenciaActual}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                
                <form onSubmit={onSave} className="flex flex-col">
                    <div className={STYLES.modalBody}>
                        <div className="space-y-5">
                            <div>
                                <label className={STYLES.label}>Cédula de Identidad</label>
                                <div className="relative">
                                    <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="cedula" required className={`${STYLES.input} pl-11`} placeholder="Ej. 1.234.567" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Nombre Completo</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="nombre" required className={`${STYLES.input} pl-11`} placeholder="Ej. Juan Pérez" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Cargo Institucional</label>
                                <div className="relative">
                                    <i className="fa-solid fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                    <input type="text" name="cargo" className={`${STYLES.input} pl-11`} placeholder="Ej. Administrador" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={STYLES.modalFooter}>
                        <button type="button" onClick={onClose} className={STYLES.btnSecondary}>Cancelar</button>
                        <button type="submit" className={`${STYLES.btnPrimary} !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-600/20`}><i className="fa-solid fa-floppy-disk"></i> Guardar Funcionario</button>
                    </div>
                </form>
            </div>
        </div>
    );
}