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
          <div className={STYLES.modalContent + " max-w-5xl"}>
            <div className={STYLES.modalHeader}>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-box-open text-[#1e3a8a]"></i> {bienEditing ? 'Editar Bien Patrimonial' : 'Registrar Nuevo Bien'}
              </h2>
              <button onClick={() => setIsBienModalOpen(false)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 transition-colors cursor-pointer"><span className="sr-only">Cerrar</span><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <form ref={bienFormRef} onSubmit={(e) => saveBien(e, false)} className="flex flex-col h-full overflow-hidden">
              <div className={STYLES.modalBody}>
                
                <div className="bg-white shadow-sm border border-zinc-100 rounded-[32px] p-8">
                  <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-calculator text-[#1e3a8a] mr-1"></i> 1. Imputación Contable (Opcional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                    <div><label className={STYLES.label}>Cuenta Mayor</label><input list="lista-cuentas" name="cuenta" defaultValue={bienEditing?.cuenta} className={STYLES.input} placeholder="Ej. 2.6.1.01" /></div>
                    <div><label className={STYLES.label}>Sub-Cuenta</label><input list="lista-subcuentas" name="subcuenta" defaultValue={bienEditing?.subcuenta} className={STYLES.input} placeholder="..." /></div>
                    <div><label className={STYLES.label}>Analítico 1</label><input list="lista-analiticos1" name="analitico1" defaultValue={bienEditing?.analitico1} className={STYLES.input} placeholder="..." /></div>
                    <div><label className={STYLES.label}>Analítico 2</label><input list="lista-analiticos2" name="analitico2" defaultValue={bienEditing?.analitico2} className={STYLES.input} placeholder="..." /></div>
                  </div>
                </div>
                
                <div className="bg-white shadow-sm border border-zinc-100 rounded-[32px] p-8">
                  <h3 className={STYLES.sectionTitle}><i className="fa-solid fa-laptop-code text-[#1e3a8a] mr-1"></i> 2. Especificaciones Técnicas</h3>
                  <div className="space-y-6 mt-2">
                    <div><label className={STYLES.label}>Descripción General</label><input list="lista-descripciones" required name="descripcion" defaultValue={bienEditing?.descripcion} className={STYLES.input} placeholder="Ej. Computadora de Escritorio HP Intel Core i5..." /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                      <div><label className={STYLES.label}>Nº Rótulo</label><input required name="rotulo" defaultValue={bienEditing?.rotulo} className={`${STYLES.input} font-bold text-[#1e3a8a]`} placeholder="Ej. 10255" /></div>
                      <div>
                        <label className={STYLES.label}>Ingreso</label>
                        <input type="date" required name="fechaAdquisicion" defaultValue={bienEditing?.fechaAdquisicion ? String(bienEditing?.fechaAdquisicion).split('T')[0] : ''} className={STYLES.input} />
                      </div>
                      <div>
                        <label className={STYLES.label}>Vida Útil</label>
                        <div className="relative">
                          <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={STYLES.input} />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"><span className="text-zinc-400 text-xs font-bold">Años</span></div>
                        </div>
                      </div>
                      <div><label className={STYLES.label}>Valor (Gs.)</label><input required name="valorUnitario" defaultValue={formatCurrency(bienEditing?.valorUnitario)} onChange={(e)=>{e.target.value=formatCurrency(e.target.value.replace(/\D/g, ''))}} className={`${STYLES.input} text-right font-bold text-zinc-900`} /></div>
                      <div>
                        <label className={STYLES.label}>Condición</label>
                        <select required name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || "Bueno"} className={STYLES.input}>
                            {ESTADOS_CONSERVACION.map(e=><option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow-sm border border-zinc-100 rounded-[32px] p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-5 mb-6">
                      <h3 className={STYLES.sectionTitle + " !mb-0"}><i className="fa-solid fa-map-location-dot text-[#1e3a8a] mr-1"></i> 3. Localización (Opcional)</h3>
                      <div className="relative flex items-center bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-200">
                          <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer" />
                          <div className="ml-3 text-sm leading-6 mt-0.5">
                            <label className="font-bold text-zinc-900 cursor-pointer select-none">Declarar Etiqueta QR Impresa</label>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={STYLES.label}>Custodio Designado</label><input list="lista-funcionarios-modal-bien" name="funcionario" defaultValue={bienEditing?.funcionario} className={STYLES.input} placeholder="Nombre completo..." /><datalist id="lista-funcionarios-modal-bien">{funcionariosConDatos.map(f => <option key={f.nombre} value={f.nombre} />)}</datalist></div>
                    <div><label className={STYLES.label}>Ubicación Operativa</label><input list="lista-ubicaciones-modal-bien" name="ubicacion" defaultValue={bienEditing?.ubicacion} className={STYLES.input} placeholder="Oficina / Laboratorio..." /><datalist id="lista-ubicaciones-modal-bien">{ubicacionesUnicas.map(u => <option key={u} value={u} />)}</datalist></div>
                  </div>
                </div>

              </div>

              <div className={STYLES.modalFooter}>
                <button type="button" onClick={() => setIsBienModalOpen(false)} className={STYLES.btnSecondary}>Cancelar</button>
                {!bienEditing && (
                    <button type="button" disabled={isSaving} onClick={(e) => saveBien(e, true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-light border border-brand-primary/20 px-5 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/20 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus-minus"></i>} Guardar y Añadir Otro
                    </button>
                )}
                <button type="submit" disabled={isSaving} className={`${STYLES.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>} Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
    );
}