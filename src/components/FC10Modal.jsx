import React, { useState, useEffect } from 'react';

export default function FC10Modal({ setIsFC10ModalOpen, fc10TargetBien, fc10Editing, saveFC10, STYLES, formatCurrency, funcionariosConDatos }) {
    const [isReturning, setIsReturning] = useState(false);
    const [step, setStep] = useState(1); 
    const savedOrg = JSON.parse(localStorage.getItem('unp_last_org_data') || '{}');
    const safeFuncionarios = funcionariosConDatos || [];

    // Estado controlado para asegurar el autocompletado y validación
    const [funcData, setFuncData] = useState({
        nombre: fc10Editing?.funcionarioNombre || fc10TargetBien?.funcionario || '',
        doc: fc10Editing?.funcionarioDoc || '',
        cargo: fc10Editing?.funcionarioCargo || ''
    });

    useEffect(() => {
        setIsReturning(!!fc10Editing?.devolucionFecha);
    }, [fc10Editing]);

    if (!fc10TargetBien) return null; 

    const nextStep = () => {
        const currentSection = document.getElementById(`step-${step}`);
        if (currentSection) {
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            for (let input of inputs) {
                if (!input.value) {
                    input.reportValidity(); 
                    return; 
                }
            }
        }
        setStep(prev => Math.min(prev + 1, 3));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step < 3) nextStep();
        }
    };

    // Función que lee el padrón en tiempo real
    const handleNameChange = (e) => {
        const val = e.target.value;
        let newDoc = funcData.doc;
        let newCargo = funcData.cargo;

        const match = safeFuncionarios.find(f => f.nombre.toLowerCase() === val.toLowerCase());
        if (match) {
            newDoc = match.doc || '';
            newCargo = match.cargo || '';
        }

        setFuncData({ nombre: val, doc: newDoc, cargo: newCargo });
    };

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-darkbg-border shadow-2xl"}>
                
                <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 flex justify-between items-center group overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-gradient-to-bl from-brand-primary/20 to-sky-500/20 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover text-white shadow-lg shadow-brand-primary/20 ring-4 ring-brand-primary/10">
                            <i className="fa-solid fa-file-signature text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {fc10Editing ? 'Gestionar FC-10 (Asignación/Devolución)' : 'Nueva Asignación FC-10'}
                            </h2>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Delegación y custodia legal de bienes institucionales</p>
                        </div>
                    </div>

                    <button type="button" onClick={() => setIsFC10ModalOpen(false)} className="relative z-10 rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-darkbg-border shadow-sm hover:shadow-md">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <form onSubmit={saveFC10} onKeyDown={handleKeyDown} className="flex flex-col h-full overflow-hidden bg-zinc-50/30 dark:bg-darkbg-main/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-brand-primary' : 'bg-zinc-200 dark:bg-darkbg-border'}`}></div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-darkbg-card border border-zinc-200/60 dark:border-darkbg-border rounded-[20px] p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary"></div>
                            <div className="pl-3">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Bien a asignar</p>
                                <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm">
                                    {fc10TargetBien.rotulo} <span className="font-medium text-zinc-500 dark:text-zinc-400 ml-1">- {fc10TargetBien.descripcion}</span>
                                </p>
                            </div>
                            <div className="sm:text-right pl-3 sm:pl-0">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Valor Patrimonial</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">Gs. {formatCurrency(fc10TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        {/* PASO 1 */}
                        <div id="step-1" className={step === 1 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-sitemap"></i></div>
                                    Paso 1: Dependencia Organizacional
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div>
                                        <label className={STYLES.label}>Unidad</label>
                                        <input name="unidad" required defaultValue={fc10Editing?.unidad || savedOrg.unidad} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cod. Unidad</label>
                                        <input name="unidadCod" required defaultValue={fc10Editing?.unidadCod || savedOrg.unidadCod} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Repartición</label>
                                        <input name="reparticion" required defaultValue={fc10Editing?.reparticion || savedOrg.reparticion} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cod. Repart.</label>
                                        <input name="reparticionCod" required defaultValue={fc10Editing?.reparticionCod || savedOrg.reparticionCod} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Dependencia</label>
                                        <input name="dependenciaOrg" required defaultValue={fc10Editing?.dependenciaOrg || savedOrg.dependenciaOrg} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cod. Depend.</label>
                                        <input name="dependenciaCod" required defaultValue={fc10Editing?.dependenciaCod || savedOrg.dependenciaCod} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Área</label>
                                        <input name="area" required defaultValue={fc10Editing?.area || savedOrg.area} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cod. Área</label>
                                        <input name="areaCod" required defaultValue={fc10Editing?.areaCod || savedOrg.areaCod} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 2 */}
                        <div id="step-2" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-user-tie"></i></div>
                                    Paso 2: Funcionario Responsable
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={STYLES.label}>Nombre y Apellido</label>
                                        <input 
                                            list="funcionarios-list-fc10" 
                                            name="funcionarioNombre" 
                                            required 
                                            value={funcData.nombre}
                                            onChange={handleNameChange}
                                            className={`${STYLES.input} !rounded-2xl`}
                                        />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cédula de Identidad</label>
                                        <input 
                                            name="funcionarioDoc" 
                                            required 
                                            value={funcData.doc}
                                            onChange={(e) => setFuncData({...funcData, doc: e.target.value})}
                                            className={`${STYLES.input} !rounded-2xl`} 
                                        />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cargo Funcional</label>
                                        <input 
                                            name="funcionarioCargo" 
                                            required 
                                            value={funcData.cargo}
                                            onChange={(e) => setFuncData({...funcData, cargo: e.target.value})}
                                            className={`${STYLES.input} !rounded-2xl`} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 3 */}
                        <div id="step-3" className={step === 3 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800"><i className="fa-solid fa-clipboard-check"></i></div>
                                    Paso 3: Detalles de Asignación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div>
                                        <label className={STYLES.label}>Lugar de Entrega</label>
                                        <input name="entregadoLugar" required defaultValue={fc10Editing?.entregadoLugar || 'Pilar'} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Fecha Asignación</label>
                                        <input type="date" name="entregadoFecha" required defaultValue={fc10Editing?.entregadoFecha || new Date().toISOString().split('T')[0]} className={`${STYLES.input} !rounded-2xl cursor-pointer`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Estado del Bien</label>
                                        <input name="estadoConservacion" required defaultValue={fc10Editing?.estadoConservacion || fc10TargetBien.estadoConservacion} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <div>
                                        <label className={STYLES.label}>Cantidad</label>
                                        <input name="cantidad" required defaultValue={fc10Editing?.cantidad || '1'} className={`${STYLES.input} !rounded-2xl text-zinc-500`} readOnly />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className={STYLES.label}>Observaciones Adicionales</label>
                                        <input name="observaciones" defaultValue={fc10Editing?.observaciones} className={`${STYLES.input} !rounded-2xl`} />
                                    </div>
                                    <input type="hidden" name="valorTotal" value={fc10TargetBien.valorUnitario} />
                                </div>
                            </div>

                            {/* DEVOLUCIÓN */}
                            {fc10Editing && (
                                <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section mt-8">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-[24px]"></div>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer group/check w-fit">
                                        <input type="checkbox" checked={isReturning} onChange={(e) => setIsReturning(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-transform group-hover/check:scale-110" />
                                        <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Registrar Devolución y Liberar Bien</span>
                                    </label>
                                    
                                    {isReturning && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in mt-6 pt-6 border-t border-zinc-100 dark:border-darkbg-border">
                                            <div>
                                                <label className={STYLES.label}>Lugar Devolución</label>
                                                <input name="devolucionLugar" required={isReturning} defaultValue={fc10Editing?.devolucionLugar || 'Pilar'} className={`${STYLES.input} !rounded-2xl`} />
                                            </div>
                                            <div>
                                                <label className={STYLES.label}>Fecha Devolución</label>
                                                <input type="date" name="devolucionFecha" required={isReturning} defaultValue={fc10Editing?.devolucionFecha || new Date().toISOString().split('T')[0]} className={`${STYLES.input} !rounded-2xl cursor-pointer`} />
                                            </div>
                                            <div>
                                                <label className={STYLES.label}>Receptor (Nombre)</label>
                                                <input name="devolucionReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionReceptor} className={`${STYLES.input} !rounded-2xl`} />
                                            </div>
                                            <div>
                                                <label className={STYLES.label}>Cargo Receptor</label>
                                                <input name="devolucionCargoReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionCargoReceptor} className={`${STYLES.input} !rounded-2xl`} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <datalist id="funcionarios-list-fc10">
                            {safeFuncionarios.map(f => <option key={f.nombre} value={f.nombre} />)}
                        </datalist>
                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 rounded-b-[32px]">
                        {step === 1 ? (
                            <button type="button" onClick={() => setIsFC10ModalOpen(false)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Cancelar</button>
                        ) : (
                            <button type="button" onClick={() => setStep(step - 1)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Anterior</button>
                        )}
                        
                        {step < 3 ? (
                            <button type="button" onClick={nextStep} className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 shadow-lg shadow-brand-primary/20`}>
                                Siguiente Paso <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
                            </button>
                        ) : (
                            <button type="submit" className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 shadow-lg shadow-brand-primary/20`}>
                                <i className="fa-solid fa-floppy-disk text-xs mr-1"></i> Confirmar y Guardar
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}