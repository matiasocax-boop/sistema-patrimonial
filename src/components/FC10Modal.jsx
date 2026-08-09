import React from 'react';

export default function FC10Modal({
    setIsFC10ModalOpen,
    fc10Editing,
    saveFC10,
    fc10Month,
    fc10Year,
    funcionariosConDatos,
    fc10Items,
    handleAddFC10Item,
    handleRemoveFC10Item,
    handleFC10ItemChange,
    bienes,
    formatCurrency,
    STYLES
}) {
    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-5xl"}>
            <div className={STYLES.modalHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent font-black">
                  <i className="fa-solid fa-file-signature text-base"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                    {fc10Editing ? 'Editar Expediente FC-10' : 'Nueva Asignación FC-10'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">Asignación de responsabilidad sobre los bienes</p>
                </div>
              </div>
              <button onClick={() => setIsFC10ModalOpen(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><span className="sr-only">Cerrar</span><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <form onSubmit={saveFC10} className="flex flex-col h-full overflow-hidden">
              <div className={STYLES.modalBody}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                  <div>
                    <label className={STYLES.label}>Mes</label>
                    <select name="mes" required defaultValue={fc10Editing?.mes || fc10Month} className={STYLES.input}>
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={STYLES.label}>Año</label>
                    <select name="anio" required defaultValue={fc10Editing?.anio || fc10Year} className={STYLES.input}>
                      {Array.from({length: 10}, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={STYLES.label}>Funcionario Responsable</label>
                    <input list="lista-funcionarios-fc10" name="funcionario" required defaultValue={fc10Editing?.funcionario} className={STYLES.input} placeholder="Buscar funcionario..." />
                    <datalist id="lista-funcionarios-fc10">
                      {funcionariosConDatos.map(f => <option key={f.nombre} value={f.nombre} />)}
                    </datalist>
                  </div>
                </div>

                <div className="bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-darkbg-border">
                    <h3 className={STYLES.sectionTitle + " !mb-0"}>Bienes a Asignar</h3>
                    <button type="button" onClick={handleAddFC10Item} className={STYLES.btnSecondary + " !py-1.5 !px-3 !text-xs"}>
                      <i className="fa-solid fa-plus text-brand-primary"></i> Fila
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto custom-scrollbar border border-zinc-200/80 dark:border-darkbg-border rounded-xl">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-zinc-50 dark:bg-darkbg-main border-b border-zinc-200 dark:border-darkbg-border text-[10px] font-black text-zinc-400 uppercase">
                        <tr>
                          <th className="p-2.5 w-1/4">Seleccionar Bien (Rótulo)</th>
                          <th className="p-2.5 w-1/4">Descripción</th>
                          <th className="p-2.5 w-32">Valor (Gs.)</th>
                          <th className="p-2.5 w-32">Estado</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                        {fc10Items.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-zinc-400 text-xs font-medium italic">Añade filas para buscar y asignar bienes.</td>
                          </tr>
                        ) : fc10Items.map(item => (
                          <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover/60 transition-colors">
                            <td className="p-1.5">
                              <input list="lista-bienes-fc10" className={STYLES.input + " !p-2 !text-xs border-brand-primary/30"} required placeholder="Escriba el rótulo..." value={item.rotulo || ''} onChange={e => handleFC10ItemChange(item.id, 'rotulo', e.target.value)} />
                            </td>
                            <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs bg-zinc-50/50"} readOnly value={item.descripcion || ''} tabIndex="-1" /></td>
                            <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs text-right font-bold bg-zinc-50/50"} readOnly value={item.valorUnitario ? formatCurrency(item.valorUnitario) : ''} tabIndex="-1" /></td>
                            <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs bg-zinc-50/50"} readOnly value={item.estadoConservacion || ''} tabIndex="-1" /></td>
                            <td className="p-1.5 text-center">
                              <button type="button" onClick={()=>handleRemoveFC10Item(item.id)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer">
                                <i className="fa-solid fa-trash-can text-xs"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <datalist id="lista-bienes-fc10">
                      {bienes.map(b => (
                        <option key={b.id} value={b.rotulo}>{b.descripcion}</option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
              <div className={STYLES.modalFooter}>
                <button type="button" onClick={() => setIsFC10ModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-floppy-disk"></i> Guardar FC-10</button>
              </div>
            </form>
          </div>
        </div>
    );
}