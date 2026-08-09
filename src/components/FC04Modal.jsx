import React from 'react';

export default function FC04Modal({
    setIsFC04ModalOpen,
    fc04Editing,
    saveFC04,
    fc10Month,
    fc10Year,
    ORIGENES_FC04,
    fc04SinMovimiento,
    setFc04SinMovimiento,
    handleAddFC04Item,
    fc04Items,
    handleFC04ItemChange,
    formatCurrency,
    handleRemoveFC04Item,
    STYLES
}) {
    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-5xl"}>
            <div className={STYLES.modalHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent font-black">
                  <i className="fa-solid fa-file-circle-plus text-base"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                    {fc04Editing ? 'Editar Expediente FC-04' : 'Nuevo Movimiento FC-04'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">Registro oficial de altas y bajas patrimoniales</p>
                </div>
              </div>
              <button onClick={() => setIsFC04ModalOpen(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><span className="sr-only">Cerrar</span><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <form onSubmit={saveFC04} className="flex flex-col h-full overflow-hidden">
              <div className={STYLES.modalBody}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                  <div>
                    <label className={STYLES.label}>Mes</label>
                    <select name="mes" required defaultValue={fc04Editing?.mes || fc10Month} className={STYLES.input}>
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={STYLES.label}>Año</label>
                    <select name="anio" required defaultValue={fc04Editing?.anio || fc10Year} className={STYLES.input}>
                      {Array.from({length: 10}, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={STYLES.label}>Origen de Movimiento</label>
                    <select name="origenMovimiento" required defaultValue={fc04Editing?.origenMovimiento || "A"} className={STYLES.input}>
                      {ORIGENES_FC04.map(o => <option key={o.id} value={o.id}>{o.id} - {o.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-darkbg-border">
                    <h3 className={STYLES.sectionTitle + " !mb-0"}>Detalle de Bienes</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        <input type="checkbox" checked={fc04SinMovimiento} onChange={(e) => setFc04SinMovimiento(e.target.checked)} className="rounded-md border-zinc-300 text-brand-primary focus:ring-brand-primary" /> Sin Movimiento
                      </label>
                      {!fc04SinMovimiento && (
                        <button type="button" onClick={handleAddFC04Item} className={STYLES.btnSecondary + " !py-1.5 !px-3 !text-xs"}>
                          <i className="fa-solid fa-plus text-brand-primary"></i> Fila
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!fc04SinMovimiento && (
                    <div className="overflow-x-auto custom-scrollbar border border-zinc-200/80 dark:border-darkbg-border rounded-xl">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-zinc-50 dark:bg-darkbg-main border-b border-zinc-200 dark:border-darkbg-border text-[10px] font-black text-zinc-400 uppercase">
                          <tr>
                            <th className="p-2.5 w-20">Cta</th><th className="p-2.5 w-16">Sub</th><th className="p-2.5 w-16">An1</th><th className="p-2.5 w-16">An2</th>
                            <th className="p-2.5 min-w-[160px]">Descripción</th><th className="p-2.5 w-28">Rótulo</th><th className="p-2.5 w-28">Valor</th>
                            <th className="p-2.5 w-32">Adquisición</th><th className="p-2.5 w-16">Vida</th><th className="p-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                          {fc04Items.length === 0 ? (
                            <tr>
                              <td colSpan="10" className="p-8 text-center text-zinc-400 text-xs font-medium italic">Añade filas para registrar los bienes del formulario.</td>
                            </tr>
                          ) : fc04Items.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover/60 transition-colors">
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs"} value={item.cuenta} onChange={e=>handleFC04ItemChange(item.id, 'cuenta', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs"} value={item.subcuenta} onChange={e=>handleFC04ItemChange(item.id, 'subcuenta', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-1.5 !text-xs"} value={item.analitico1} onChange={e=>handleFC04ItemChange(item.id, 'analitico1', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-1.5 !text-xs"} value={item.analitico2} onChange={e=>handleFC04ItemChange(item.id, 'analitico2', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs"} required value={item.descripcion} onChange={e=>handleFC04ItemChange(item.id, 'descripcion', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs font-mono font-bold"} required value={item.rotulo} onChange={e=>handleFC04ItemChange(item.id, 'rotulo', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs text-right font-bold"} required value={formatCurrency(item.valorUnitario)} onChange={e=>handleFC04ItemChange(item.id, 'valorUnitario', e.target.value.replace(/\D/g, ''))} /></td>
                              <td className="p-1.5"><input type="date" className={STYLES.input + " !p-2 !text-xs"} required value={item.fechaAdquisicion} onChange={e=>handleFC04ItemChange(item.id, 'fechaAdquisicion', e.target.value)} /></td>
                              <td className="p-1.5"><input className={STYLES.input + " !p-2 !text-xs"} value={item.vidaUtil} onChange={e=>handleFC04ItemChange(item.id, 'vidaUtil', e.target.value)} /></td>
                              <td className="p-1.5 text-center">
                                <button type="button" onClick={()=>handleRemoveFC04Item(item.id)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer">
                                  <i className="fa-solid fa-trash-can text-xs"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              <div className={STYLES.modalFooter}>
                <button type="button" onClick={() => setIsFC04ModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                <button type="submit" className={STYLES.btnPrimary}><i className="fa-solid fa-floppy-disk"></i> Guardar FC-04</button>
              </div>
            </form>
          </div>
        </div>
    );
}