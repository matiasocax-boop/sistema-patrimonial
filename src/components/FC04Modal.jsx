import React from 'react';

export default function FC04Modal({ setIsFC04ModalOpen, fc04Editing, saveFC04, fc10Month, fc10Year, ORIGENES_FC04, fc04SinMovimiento, setFc04SinMovimiento, handleAddFC04Item, fc04Items, handleFC04ItemChange, handleRemoveFC04Item, STYLES }) {
    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-5xl"}>
                <div className={STYLES.modalHeader}>
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                        {fc04Editing ? 'Editar Registro FC-04' : 'Nuevo Registro FC-04'}
                    </h2>
                    <button type="button" onClick={() => setIsFC04ModalOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                
                <form onSubmit={saveFC04} className="flex flex-col h-full overflow-hidden">
                    <div className={STYLES.modalBody}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                            <div><label className={STYLES.label}>Mes</label><select name="mes" required defaultValue={fc04Editing?.mes || fc10Month} className={STYLES.input}>{Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                            <div><label className={STYLES.label}>Año</label><select name="anio" required defaultValue={fc04Editing?.anio || fc10Year} className={STYLES.input}>{Array.from({length: 10}, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                            <div><label className={STYLES.label}>Origen del Movimiento</label><select name="origenMovimiento" required defaultValue={fc04Editing?.origenMovimiento} className={STYLES.input}>{ORIGENES_FC04.map(o => <option key={o.id} value={o.id}>{o.id} - {o.nombre}</option>)}</select></div>
                        </div>

                        <div className="flex items-center gap-2 mb-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-darkbg-main dark:border-darkbg-border">
                            <input type="checkbox" id="sinMovimiento" checked={fc04SinMovimiento} onChange={(e) => setFc04SinMovimiento(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer" />
                            <label htmlFor="sinMovimiento" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Declarar "Sin Movimiento" para este periodo</label>
                        </div>

                        {!fc04SinMovimiento && (
                            <div className="border border-zinc-200 dark:border-darkbg-border rounded-xl overflow-hidden shadow-sm">
                                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-darkbg-main border-b border-zinc-200 dark:border-darkbg-border">
                                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Bienes Involucrados</h3>
                                    <button type="button" onClick={handleAddFC04Item} className={STYLES.btnSecondary + " !py-1.5 !px-3 !text-xs"}>
                                        <i className="fa-solid fa-plus text-brand-primary"></i> Agregar Fila
                                    </button>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left min-w-[900px]">
                                        <thead className="bg-white dark:bg-darkbg-card border-b border-zinc-200 dark:border-darkbg-border text-[11px] font-semibold text-zinc-500 uppercase">
                                            <tr>
                                                <th className="p-3 w-28">Cta. Mayor</th>
                                                <th className="p-3 w-24">Subcta.</th>
                                                <th className="p-3 w-32">Rótulo</th>
                                                <th className="p-3">Descripción</th>
                                                <th className="p-3 w-36 text-right">Valor (Gs.)</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-darkbg-border bg-white dark:bg-darkbg-card">
                                            {fc04Items.length === 0 ? (
                                                <tr><td colSpan="6" className="p-8 text-center text-sm font-medium text-zinc-400">Presiona "Agregar Fila" para comenzar a listar bienes.</td></tr>
                                            ) : fc04Items.map(item => (
                                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-darkbg-hover/50">
                                                    <td className="p-1.5"><input required className={STYLES.input + " !py-2 !text-xs"} value={item.cuenta || ''} onChange={e => handleFC04ItemChange(item.id, 'cuenta', e.target.value)} /></td>
                                                    <td className="p-1.5"><input className={STYLES.input + " !py-2 !text-xs"} value={item.subcuenta || ''} onChange={e => handleFC04ItemChange(item.id, 'subcuenta', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + " !py-2 !text-xs"} value={item.rotulo || ''} onChange={e => handleFC04ItemChange(item.id, 'rotulo', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + " !py-2 !text-xs"} value={item.descripcion || ''} onChange={e => handleFC04ItemChange(item.id, 'descripcion', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + " !py-2 !text-xs text-right font-mono font-bold"} value={item.valorUnitario || ''} onChange={e => handleFC04ItemChange(item.id, 'valorUnitario', e.target.value)} /></td>
                                                    <td className="p-1.5 text-center"><button type="button" onClick={()=>handleRemoveFC04Item(item.id)} className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"><i className="fa-solid fa-trash-can"></i></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={STYLES.modalFooter}>
                        <button type="button" onClick={() => setIsFC04ModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                        <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-floppy-disk"></i> Guardar Expediente FC-04</button>
                    </div>
                </form>
            </div>
        </div>
    );
}