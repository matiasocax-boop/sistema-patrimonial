import React from 'react';

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
    if (!fc11TargetBien) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl"}>
                <div className={STYLES.modalHeader}>
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                        {fc11Editing ? 'Editar Traslado FC-11' : 'Nuevo Traslado FC-11'}
                    </h2>
                    <button type="button" onClick={() => setIsFC11ModalOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                
                <form onSubmit={saveFC11} className="flex flex-col h-full overflow-hidden">
                    <div className={STYLES.modalBody}>
                        <div className="bg-zinc-50 dark:bg-darkbg-main border border-zinc-200 dark:border-darkbg-border rounded-lg p-4 mb-2 flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Bien a trasladar</p>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fc11TargetBien.rotulo} - {fc11TargetBien.descripcion}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Valor</p>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Gs. {formatCurrency(fc11TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                            <div><label className={STYLES.label}>Nº Formulario (Opcional)</label><input name="numeroFormulario" defaultValue={fc11Editing?.numeroFormulario} className={STYLES.input} placeholder="Ej. 001-2026" /></div>
                            <div><label className={STYLES.label}>Fecha de Traslado</label><input type="date" name="fecha" required defaultValue={fc11Editing?.fecha || new Date().toISOString().split('T')[0]} className={STYLES.input} /></div>
                        </div>

                        <h3 className={STYLES.sectionTitle + " mt-4"}><i className="fa-solid fa-arrow-right-arrow-left text-zinc-400 mr-2"></i> Origen y Destino</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                            <div>
                                <label className={STYLES.label}>Dependencia Remitente (Actual)</label>
                                <input value={dependenciaActual} disabled className={STYLES.input + " bg-zinc-100 dark:bg-darkbg-main text-zinc-500 cursor-not-allowed"} />
                            </div>
                            <div>
                                <label className={STYLES.label}>Área Remitente</label>
                                <input name="areaRemitente" required defaultValue={fc11Editing?.areaRemitente} className={STYLES.input} placeholder="Área o Dpto. de origen" />
                            </div>
                            
                            <div>
                                <label className={STYLES.label}>Dependencia Destinataria</label>
                                <select name="dependenciaDestinataria" required defaultValue={fc11Editing?.dependenciaDestinataria || ''} className={STYLES.input}>
                                    <option value="" disabled>Seleccione destino...</option>
                                    {todasDependencias.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={STYLES.label}>Área Destinataria</label>
                                <input name="areaDestinataria" required defaultValue={fc11Editing?.areaDestinataria} className={STYLES.input} placeholder="Área o Dpto. de destino" />
                            </div>
                        </div>

                        <h3 className={STYLES.sectionTitle + " mt-4"}><i className="fa-solid fa-clipboard-check text-zinc-400 mr-2"></i> Detalles Adicionales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={STYLES.label}>Motivo del Traslado</label>
                                <select name="motivo" required defaultValue={fc11Editing?.motivo || 'Traspaso'} className={STYLES.input}>
                                    <option value="Traspaso">Traspaso</option>
                                    <option value="Préstamo">Préstamo</option>
                                    <option value="Inservible">Inservible</option>
                                    <option value="Faltante">Faltante</option>
                                </select>
                            </div>
                            <div>
                                <label className={STYLES.label}>Estado de Conservación Actual</label>
                                <select name="estadoConservacion" required defaultValue={fc11Editing?.estadoConservacion || fc11TargetBien.estadoConservacion || 'Bueno'} className={STYLES.input}>
                                    <option value="Muy bueno">Muy bueno</option>
                                    <option value="Bueno">Bueno</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Malo">Malo</option>
                                    <option value="Inutilizable">Inutilizable</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={STYLES.label}>Observaciones</label>
                                <input name="observaciones" defaultValue={fc11Editing?.observaciones} className={STYLES.input} placeholder="Anotaciones adicionales..." />
                            </div>
                        </div>
                    </div>
                    
                    <div className={STYLES.modalFooter}>
                        <button type="button" onClick={() => setIsFC11ModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                        <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-paper-plane"></i> Confirmar Traslado</button>
                    </div>
                </form>
            </div>
        </div>
    );
}