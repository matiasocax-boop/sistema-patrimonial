import React, { useState, useEffect } from 'react';

export default function FC10Modal({ setIsFC10ModalOpen, fc10TargetBien, fc10Editing, saveFC10, STYLES, formatCurrency, funcionariosConDatos }) {
    const [isReturning, setIsReturning] = useState(false);
    const savedOrg = JSON.parse(localStorage.getItem('unp_last_org_data') || '{}');
    const safeFuncionarios = funcionariosConDatos || [];

    // Esta función repara el error del historial: alinea el checkbox de devolución con la base de datos
    useEffect(() => {
        setIsReturning(!!fc10Editing?.devolucionFecha);
    }, [fc10Editing]);

    if (!fc10TargetBien) return null; 

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl"}>
                <div className={STYLES.modalHeader}>
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                        {fc10Editing ? 'Gestionar FC-10 (Asignación/Devolución)' : 'Nueva Asignación FC-10'}
                    </h2>
                    <button type="button" onClick={() => setIsFC10ModalOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                
                <form onSubmit={saveFC10} className="flex flex-col h-full overflow-hidden">
                    <div className={STYLES.modalBody}>
                        <div className="bg-zinc-50 dark:bg-darkbg-main border border-zinc-200 dark:border-darkbg-border rounded-lg p-4 mb-2 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Bien a asignar</p>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fc10TargetBien.rotulo} - {fc10TargetBien.descripcion}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Valor</p>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Gs. {formatCurrency(fc10TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-sitemap text-zinc-400 mr-2"></i> 1. Dependencia Organizacional</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                            <div><label className={STYLES.label}>Unidad</label><input name="unidad" required defaultValue={fc10Editing?.unidad || savedOrg.unidad} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cod. Unidad</label><input name="unidadCod" required defaultValue={fc10Editing?.unidadCod || savedOrg.unidadCod} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Repartición</label><input name="reparticion" required defaultValue={fc10Editing?.reparticion || savedOrg.reparticion} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cod. Repart.</label><input name="reparticionCod" required defaultValue={fc10Editing?.reparticionCod || savedOrg.reparticionCod} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Dependencia</label><input name="dependenciaOrg" required defaultValue={fc10Editing?.dependenciaOrg || savedOrg.dependenciaOrg} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cod. Depend.</label><input name="dependenciaCod" required defaultValue={fc10Editing?.dependenciaCod || savedOrg.dependenciaCod} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Área</label><input name="area" required defaultValue={fc10Editing?.area || savedOrg.area} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cod. Área</label><input name="areaCod" required defaultValue={fc10Editing?.areaCod || savedOrg.areaCod} className={STYLES.input} /></div>
                        </div>

                        <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-user-tie text-zinc-400 mr-2"></i> 2. Funcionario Responsable</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                            <div><label className={STYLES.label}>Nombre y Apellido</label><input list="funcionarios-list-fc10" name="funcionarioNombre" required defaultValue={fc10Editing?.funcionarioNombre || fc10TargetBien.funcionario} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cédula de Identidad</label><input name="funcionarioDoc" required defaultValue={fc10Editing?.funcionarioDoc} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cargo Funcional</label><input name="funcionarioCargo" required defaultValue={fc10Editing?.funcionarioCargo} className={STYLES.input} /></div>
                        </div>

                        <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-clipboard-check text-zinc-400 mr-2"></i> 3. Detalles de Asignación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className={STYLES.label}>Lugar de Entrega</label><input name="entregadoLugar" required defaultValue={fc10Editing?.entregadoLugar || 'Pilar'} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Fecha Asignación</label><input type="date" name="entregadoFecha" required defaultValue={fc10Editing?.entregadoFecha || new Date().toISOString().split('T')[0]} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Estado del Bien</label><input name="estadoConservacion" required defaultValue={fc10Editing?.estadoConservacion || fc10TargetBien.estadoConservacion} className={STYLES.input} /></div>
                            <div><label className={STYLES.label}>Cantidad</label><input name="cantidad" required defaultValue={fc10Editing?.cantidad || '1'} className={STYLES.input} readOnly /></div>
                            <div className="md:col-span-4"><label className={STYLES.label}>Observaciones Adicionales</label><input name="observaciones" defaultValue={fc10Editing?.observaciones} className={STYLES.input} /></div>
                            <input type="hidden" name="valorTotal" value={fc10TargetBien.valorUnitario} />
                        </div>

                        {fc10Editing && (
                            <div className="mt-6 p-5 border border-zinc-200 dark:border-darkbg-border rounded-xl bg-zinc-50 dark:bg-darkbg-main shadow-sm">
                                <label className="flex items-center gap-3 cursor-pointer mb-5">
                                    <input type="checkbox" checked={isReturning} onChange={(e) => setIsReturning(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer" />
                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Registrar Devolución y Liberar Bien</span>
                                </label>
                                
                                {isReturning && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in border-t border-zinc-200 dark:border-darkbg-border pt-4">
                                        <div><label className={STYLES.label}>Lugar Devolución</label><input name="devolucionLugar" required={isReturning} defaultValue={fc10Editing?.devolucionLugar || 'Pilar'} className={STYLES.input} /></div>
                                        <div><label className={STYLES.label}>Fecha Devolución</label><input type="date" name="devolucionFecha" required={isReturning} defaultValue={fc10Editing?.devolucionFecha || new Date().toISOString().split('T')[0]} className={STYLES.input} /></div>
                                        <div><label className={STYLES.label}>Receptor (Nombre)</label><input name="devolucionReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionReceptor} className={STYLES.input} /></div>
                                        <div><label className={STYLES.label}>Cargo Receptor</label><input name="devolucionCargoReceptor" required={isReturning} defaultValue={fc10Editing?.devolucionCargoReceptor} className={STYLES.input} /></div>
                                    </div>
                                )}
                            </div>
                        )}

                        <datalist id="funcionarios-list-fc10">
                            {safeFuncionarios.map(f => <option key={f.nombre} value={f.nombre} />)}
                        </datalist>
                    </div>
                    
                    <div className={STYLES.modalFooter}>
                        <button type="button" onClick={() => setIsFC10ModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                        <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-floppy-disk"></i> Guardar Expediente FC-10</button>
                    </div>
                </form>
            </div>
        </div>
    );
}