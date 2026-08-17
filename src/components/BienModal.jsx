import React from 'react';

export default function BienModal({
    setIsBienModalOpen,
    bienEditing,
    setBienEditing,
    bienFormRef,
    saveBien,
    isSaving,
    formatCurrency,
    ESTADOS_CONSERVACION,
    funcionariosConDatos,
    ubicacionesUnicas,
    STYLES
}) {
    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-4xl"}>
            <div className={STYLES.modalHeader}>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                {bienEditing ? 'Editar Bien Patrimonial' : 'Registrar Nuevo Bien'}
              </h2>
              <button onClick={() => setIsBienModalOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-zinc-200 transition-colors cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <form ref={bienFormRef} onSubmit={(e) => saveBien(e, false)} className="flex flex-col h-full overflow-hidden">
              <div className={STYLES.modalBody}>
                
                <div>
                  <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-calculator text-zinc-400 mr-2"></i> Imputación Contable</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div><label className={STYLES.label}>Cuenta Mayor</label><input list="lista-cuentas" name="cuenta" defaultValue={bienEditing?.cuenta} className={STYLES.input} placeholder="Ej. 2.6.1.01" /></div>
                    <div><label className={STYLES.label}>Sub-Cuenta</label><input list="lista-subcuentas" name="subcuenta" defaultValue={bienEditing?.subcuenta} className={STYLES.input} placeholder="Opcional" /></div>
                    <div><label className={STYLES.label}>Analítico 1</label><input list="lista-analiticos1" name="analitico1" defaultValue={bienEditing?.analitico1} className={STYLES.input} placeholder="Opcional" /></div>
                    <div><label className={STYLES.label}>Analítico 2</label><input list="lista-analiticos2" name="analitico2" defaultValue={bienEditing?.analitico2} className={STYLES.input} placeholder="Opcional" /></div>
                  </div>
                </div>
                
                <div>
                  <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-laptop text-zinc-400 mr-2"></i> Especificaciones Técnicas</h3>
                  <div className="space-y-5">
                    <div><label className={STYLES.label}>Descripción General</label><input list="lista-descripciones" required name="descripcion" defaultValue={bienEditing?.descripcion} className={STYLES.input} placeholder="Ej. Computadora de Escritorio HP Intel Core i5..." /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                      <div><label className={STYLES.label}>Nº Rótulo</label><input required name="rotulo" defaultValue={bienEditing?.rotulo} className={`${STYLES.input} font-semibold`} placeholder="Ej. 10255" /></div>
                      <div>
                        <label className={STYLES.label}>Adquisición</label>
                        <input type="date" required name="fechaAdquisicion" defaultValue={bienEditing?.fechaAdquisicion ? String(bienEditing?.fechaAdquisicion).split('T')[0] : ''} className={STYLES.input} />
                      </div>
                      <div>
                        <label className={STYLES.label}>Vida Útil</label>
                        <div className="relative">
                          <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={STYLES.input} placeholder="Años" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-zinc-400 text-sm">Años</span></div>
                        </div>
                      </div>
                      <div>
                        <label className={STYLES.label}>Valor (Gs.)</label>
                        <input 
                            required 
                            name="valorUnitario" 
                            defaultValue={bienEditing?.valorUnitario ? formatCurrency(bienEditing.valorUnitario) : ''} 
                            onChange={(e)=>{e.target.value=formatCurrency(e.target.value.replace(/\D/g, ''))}} 
                            className={`${STYLES.input} text-right font-semibold`} 
                            placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={STYLES.label}>Condición</label>
                        <select required name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || "Muy bueno"} className={STYLES.input}>
                            {ESTADOS_CONSERVACION.map(e=><option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-5 border-b border-zinc-100 dark:border-darkbg-border pb-3">
                      <h3 className={STYLES.sectionTitle + " border-none mb-0 pb-0"}><i className="fa-solid fa-location-dot text-zinc-400 mr-2"></i> Localización Base</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary" />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Etiqueta Impresa</span>
                      </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={STYLES.label}>Custodio Designado</label>
                        <input list="lista-funcionarios-modal-bien" name="funcionario" defaultValue={bienEditing?.funcionario} className={STYLES.input} placeholder="Nombre completo..." />
                        <datalist id="lista-funcionarios-modal-bien">
                            {funcionariosConDatos.map(f => <option key={f.nombre} value={f.nombre} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className={STYLES.label}>Ubicación Operativa</label>
                        <input list="lista-ubicaciones-modal-bien" name="ubicacion" defaultValue={bienEditing?.ubicacion} className={STYLES.input} placeholder="Oficina / Laboratorio..." />
                        <datalist id="lista-ubicaciones-modal-bien">
                            {ubicacionesUnicas.map(u => <option key={u} value={u} />)}
                        </datalist>
                    </div>
                  </div>
                </div>

              </div>

              <div className={STYLES.modalFooter}>
                <button type="button" onClick={() => setIsBienModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                {!bienEditing && (
                    <button type="button" disabled={isSaving} onClick={(e) => saveBien(e, true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-300 dark:hover:bg-darkbg-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus"></i>} Guardar y Añadir Otro
                    </button>
                )}
                <button type="submit" disabled={isSaving} className={`${STYLES.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
}