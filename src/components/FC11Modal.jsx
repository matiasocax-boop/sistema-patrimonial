import React, { useState } from 'react';

export default function FC11Modal({
    setIsFC11ModalOpen,
    fc11TargetBien,
    fc11Editing,
    saveFC11,
    todasDependencias,
    dependenciaActual,
    formatCurrency,
    STYLES
}) {
    const [step, setStep] = useState(1);

    if (!fc11TargetBien) return null;

    // Función para validar el paso actual antes de avanzar
    const nextStep = () => {
        const currentSection = document.getElementById(`step-${step}-fc11`);
        if (currentSection) {
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            for (let input of inputs) {
                if (!input.value) {
                    input.reportValidity();
                    return; 
                }
            }
        }
        setStep(prev => Math.min(prev + 1, 2));
    };

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-darkbg-border shadow-2xl"}>
                
                {/* CABECERA */}
                <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 flex justify-between items-center group overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-gradient-to-bl from-amber-500/20 to-orange-500/20 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10">
                            <i className="fa-solid fa-truck-fast text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {fc11Editing ? 'Editar Traslado FC-11' : 'Nuevo Traslado FC-11'}
                            </h2>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Movilidad interna institucional de bienes entre dependencias</p>
                        </div>
                    </div>

                    <button type="button" onClick={() => setIsFC11ModalOpen(false)} className="relative z-10 rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-darkbg-border shadow-sm hover:shadow-md">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <form onSubmit={saveFC11} className="flex flex-col h-full overflow-hidden bg-zinc-50/30 dark:bg-darkbg-main/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        {/* BARRA DE PROGRESO WIZARD */}
                        <div className="flex gap-2">
                            {[1, 2].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-darkbg-border'}`}></div>
                            ))}
                        </div>

                        {/* RESUMEN DEL BIEN (Visible siempre) */}
                        <div className="bg-white dark:bg-darkbg-card border border-zinc-200/60 dark:border-darkbg-border rounded-[20px] p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                            <div className="pl-3">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Bien a trasladar</p>
                                <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm">
                                    {fc11TargetBien.rotulo} <span className="font-medium text-zinc-500 dark:text-zinc-400 ml-1">- {fc11TargetBien.descripcion}</span>
                                </p>
                            </div>
                            <div className="sm:text-right pl-3 sm:pl-0">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Valor Patrimonial</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">Gs. {formatCurrency(fc11TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        {/* PASO 1: ORIGEN Y DESTINO */}
                        <div id="step-1-fc11" className={step === 1 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-route"></i></div>
                                    Paso 1: Ruta del Traslado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 pb-5 border-b border-zinc-100 dark:border-darkbg-border">
                                    <div className="group relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Nº Formulario (Opcional)</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <input name="numeroFormulario" defaultValue={fc11Editing?.numeroFormulario} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Ej. 001-2026" />
                                    </div>
                                    <div className="group relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Fecha de Traslado</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <input type="date" name="fecha" required defaultValue={fc11Editing?.fecha || new Date().toISOString().split('T')[0]} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="group relative">
                                        <label className={STYLES.label}>Dependencia Remitente</label>
                                        <input value={dependenciaActual} disabled className={`${STYLES.input} !rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-500 cursor-not-allowed`} />
                                    </div>
                                    <div className="group relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Área Remitente</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <input name="areaRemitente" required defaultValue={fc11Editing?.areaRemitente} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Área o Dpto. de origen" />
                                    </div>
                                    <div className="group relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Dependencia Destinataria</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <select name="dependenciaDestinataria" required defaultValue={fc11Editing?.dependenciaDestinataria || ''} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`}>
                                            <option value="" disabled>Seleccione destino...</option>
                                            {todasDependencias.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="group relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Área Destinataria</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <input name="areaDestinataria" required defaultValue={fc11Editing?.areaDestinataria} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Área o Dpto. de destino" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 2: DETALLES ADICIONALES */}
                        <div id="step-2-fc11" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-clipboard-check"></i></div>
                                    Paso 2: Condiciones del Traslado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="group relative focus-within:ring-2 focus-within:ring-emerald-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Motivo del Traslado</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <select name="motivo" required defaultValue={fc11Editing?.motivo || 'Traspaso'} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`}>
                                            <option value="Traspaso">Traspaso</option>
                                            <option value="Préstamo">Préstamo</option>
                                            <option value="Inservible">Inservible</option>
                                            <option value="Faltante">Faltante</option>
                                        </select>
                                    </div>
                                    <div className="group relative focus-within:ring-2 focus-within:ring-emerald-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Estado de Conservación Actual</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <select name="estadoConservacion" required defaultValue={fc11Editing?.estadoConservacion || fc11TargetBien.estadoConservacion || 'Bueno'} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`}>
                                            <option value="Muy bueno">Muy bueno</option>
                                            <option value="Bueno">Bueno</option>
                                            <option value="Regular">Regular</option>
                                            <option value="Malo">Malo</option>
                                            <option value="Inutilizable">Inutilizable</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 group relative focus-within:ring-2 focus-within:ring-emerald-500/50 rounded-2xl">
                                        <label className={STYLES.label}>Observaciones</label>
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                        <input name="observaciones" defaultValue={fc11Editing?.observaciones} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Anotaciones adicionales..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 rounded-b-[32px]">
                        {step === 1 ? (
                            <button type="button" onClick={() => setIsFC11ModalOpen(false)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Cancelar</button>
                        ) : (
                            <button type="button" onClick={() => setStep(step - 1)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Anterior</button>
                        )}
                        
                        {step < 2 ? (
                            <button type="button" onClick={nextStep} className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 !bg-amber-600 hover:!bg-amber-700 shadow-lg shadow-amber-600/20`}>
                                Siguiente Paso <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
                            </button>
                        ) : (
                            <button type="submit" className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 !bg-amber-600 hover:!bg-amber-700 shadow-lg shadow-amber-600/20`}>
                                <i className="fa-solid fa-paper-plane text-xs mr-1"></i> Confirmar Traslado
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}