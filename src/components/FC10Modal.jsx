import React, { useState, useEffect } from 'react';

export default function FC10Modal({ setIsFC10ModalOpen, fc10TargetBien, fc10Editing, saveFC10, STYLES, formatCurrency, funcionariosConDatos }) {
    const [isReturning, setIsReturning] = useState(false);
    const savedOrg = JSON.parse(localStorage.getItem('unp_last_org_data') || '{}');
    const safeFuncionarios = funcionariosConDatos || [];

    useEffect(() => {
        setIsReturning(!!fc10Editing?.devolucionFecha);
    }, [fc10Editing]);

    if (!fc10TargetBien) return null; 

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-darkbg-border shadow-2xl"}>
                
                {/* CABECERA REDISEÑADA CON GLOW Y DEGRADADOS */}
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
                
                <form onSubmit={saveFC10} className="flex flex-col h-full overflow-hidden bg-zinc-50/30 dark:bg-darkbg-main/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        {/* RESUMEN DEL BIEN A ASIGNAR */}
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

                        {/* 1. DEPENDENCIA ORGANIZACIONAL */}
                        <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                            <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-sitemap"></i></div>
                                1. Dependencia Organizacional
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                <div className="group relative">
                                    <label className={STYLES.label}>Unidad</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="unidad" required defaultValue={fc10Editing?.unidad || savedOrg.unidad} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cod. Unidad</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="unidadCod" required defaultValue={fc10Editing?.unidadCod || savedOrg.unidadCod} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Repartición</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="reparticion" required defaultValue={fc10Editing?.reparticion || savedOrg.reparticion} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cod. Repart.</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="reparticionCod" required defaultValue={fc10Editing?.reparticionCod || savedOrg.reparticionCod} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Dependencia</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="dependenciaOrg" required defaultValue={fc10Editing?.dependenciaOrg || savedOrg.dependenciaOrg} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cod. Depend.</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="dependenciaCod" required defaultValue={fc10Editing?.dependenciaCod || savedOrg.dependenciaCod} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Área</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="area" required defaultValue={fc10Editing?.area || savedOrg.area} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cod. Área</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="areaCod" required defaultValue={fc10Editing?.areaCod || savedOrg.areaCod} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                            </div>
                        </div>

                        {/* 2. FUNCIONARIO RESPONSABLE */}
                        <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                            <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-user-tie"></i></div>
                                2. Funcionario Responsable
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="group relative">
                                    <label className={STYLES.label}>Nombre y Apellido</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input 
                                        list="funcionarios-list-fc10" 
                                        name="funcionarioNombre" 
                                        required 
                                        defaultValue={fc10Editing?.funcionarioNombre || fc10TargetBien.funcionario} 
                                        className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`}
                                        onChange={(e) => {
                                            const match = safeFuncionarios.find(f => f.nombre.toLowerCase() === e.target.value.toLowerCase());
                                            if (match) {
                                                const form = e.target.form;
                                                if (form) {
                                                    if (match.doc && form.elements['funcionarioDoc']) form.elements['funcionarioDoc'].value = match.doc;
                                                    if (match.cargo && form.elements['funcionarioCargo']) form.elements['funcionarioCargo'].value = match.cargo;
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cédula de Identidad</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="funcionarioDoc" required defaultValue={fc10Editing?.funcionarioDoc} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cargo Funcional</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="funcionarioCargo" required defaultValue={fc10Editing?.funcionarioCargo} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                            </div>
                        </div>

                        {/* 3. DETALLES DE ASIGNACIÓN */}
                        <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-[24px]"></div>
                            <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800"><i className="fa-solid fa-clipboard-check"></i></div>
                                3. Detalles de Asignación
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div className="group relative">
                                    <label className={STYLES.label}>Lugar de Entrega</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="entregadoLugar" required defaultValue={fc10Editing?.entregadoLugar || 'Pilar'} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Fecha Asignación</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input type="date" name="entregadoFecha" required defaultValue={fc10Editing?.entregadoFecha || new Date().toISOString().split('T')[0]} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Estado del Bien</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="estadoConservacion" required defaultValue={fc10Editing?.estadoConservacion || fc10TargetBien.estadoConservacion} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <div className="group relative">
                                    <label className={STYLES.label}>Cantidad</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="cantidad" required defaultValue={fc10Editing?.cantidad || '1'} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} readOnly />
                                </div>
                                <div className="md:col-span-4 group relative">
                                    <label className={STYLES.label}>Observaciones Adicionales</label>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                    <input name="observaciones" defaultValue={fc10Editing?.observaciones} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                </div>
                                <input type="hidden" name="valorTotal" value={fc10TargetBien.valorUnitario} />
                            </div>
                        </div>

                        {/* DEVOLUCIÓN */}
                        {fc10Editing && (
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-[24px]"></div>
                                
                                <label className="flex items-center gap-3 cursor-pointer group/check w-fit">
                                    <input type="checkbox" checked={isReturning} onChange={(e) => setIsReturning(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-transform group-hover/check:scale-110" />
                                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Registrar Devolución y Liberar Bien</span>
                                </label>
                                
                                {isReturning && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in mt-6 pt-6 border-t border-zinc-100 dark:border-darkbg-border">
                                        <div className="group relative">
                                            <label className={STYLES.label}>Lugar Devolución</label>
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                            <input name="devolucionLugar" required={isReturning} defaultValue={fc10Editing?.devolucionLugar || 'Pilar'} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                        </div>
                                        <div className="group relative">
                                            <label className={STYLES.label}>Fecha Devolución</label>
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                            <input type="date" name="devolucionFecha" required={isReturning} defaultValue={fc10Editing?.devolucionFecha || new Date().toISOString().split('T')[0]} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`} />
                                        </div>
                                        <div className="group relative">
                                            <label className={STYLES.label}>Receptor (Nombre)</label>
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                            <input name="devolucionReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionReceptor} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                        </div>
                                        <div className="group relative">
                                            <label className={STYLES.label}>Cargo Receptor</label>
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                                            <input name="devolucionCargoReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionCargoReceptor} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <datalist id="funcionarios-list-fc10">
                            {safeFuncionarios.map(f => <option key={f.nombre} value={f.nombre} />)}
                        </datalist>
                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 rounded-b-[32px]">
                        <button type="button" onClick={() => setIsFC10ModalOpen(false)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Cancelar</button>
                        <button type="submit" className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 shadow-lg shadow-brand-primary/20`}>
                            <i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Expediente FC-10
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}