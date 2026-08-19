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
          {/* Se amplía el borde redondeado del contenedor principal y se añade overflow-hidden para los efectos de fondo */}
          <div className={STYLES.modalContent + " max-w-4xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-darkbg-border shadow-2xl"}>
            
            {/* CABECERA REDISEÑADA CON GLOW Y DEGRADADOS */}
            <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 flex justify-between items-center group overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-gradient-to-bl from-brand-primary/20 to-sky-500/20 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover text-white shadow-lg shadow-brand-primary/20 ring-4 ring-brand-primary/10">
                   <i className={`fa-solid ${bienEditing ? 'fa-pen-to-square' : 'fa-plus'} text-xl`}></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {bienEditing ? 'Editar Bien Patrimonial' : 'Registrar Nuevo Bien'}
                  </h2>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Complete la información requerida para el inventario</p>
                </div>
              </div>

              <button onClick={() => setIsBienModalOpen(false)} className="relative z-10 rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-darkbg-border shadow-sm hover:shadow-md">
                 <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form ref={bienFormRef} onSubmit={(e) => saveBien(e, false)} className="flex flex-col h-full overflow-hidden bg-zinc-50/30 dark:bg-darkbg-main/50">
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                
                {/* 1. IMPUTACIÓN CONTABLE */}
                <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                  <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                     <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-calculator"></i></div>
                     Imputación Contable
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="group relative">
                        <label className={STYLES.label}>Cuenta Mayor</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-cuentas" name="cuenta" defaultValue={bienEditing?.cuenta} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Ej. 2.6.1.01" />
                    </div>
                    <div className="group relative">
                        <label className={STYLES.label}>Sub-Cuenta</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-subcuentas" name="subcuenta" defaultValue={bienEditing?.subcuenta} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Opcional" />
                    </div>
                    <div className="group relative">
                        <label className={STYLES.label}>Analítico 1</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-analiticos1" name="analitico1" defaultValue={bienEditing?.analitico1} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Opcional" />
                    </div>
                    <div className="group relative">
                        <label className={STYLES.label}>Analítico 2</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-analiticos2" name="analitico2" defaultValue={bienEditing?.analitico2} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Opcional" />
                    </div>
                  </div>
                </div>
                
                {/* 2. ESPECIFICACIONES TÉCNICAS */}
                <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary rounded-l-[24px]"></div>
                  <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                     <div className="h-8 w-8 rounded-xl bg-brand-light text-brand-primary dark:bg-brand-primary/20 flex items-center justify-center border border-brand-primary/20"><i className="fa-solid fa-laptop"></i></div>
                     Especificaciones Técnicas
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="group relative">
                        <label className={STYLES.label}>Descripción General</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-descripciones" required name="descripcion" defaultValue={bienEditing?.descripcion} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Ej. Computadora de Escritorio HP Intel Core i5..." />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                      <div className="group relative">
                          <label className={STYLES.label}>Nº Rótulo</label>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                          <input required name="rotulo" defaultValue={bienEditing?.rotulo} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 font-black shadow-inner`} placeholder="Ej. 10255" />
                      </div>
                      <div className="group relative">
                        <label className={STYLES.label}>Adquisición</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input type="date" required name="fechaAdquisicion" defaultValue={bienEditing?.fechaAdquisicion ? String(bienEditing?.fechaAdquisicion).split('T')[0] : ''} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`} />
                      </div>
                      <div className="group relative">
                        <label className={STYLES.label}>Vida Útil</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <div className="relative">
                          <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Años" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"><span className="text-zinc-400 text-xs font-bold uppercase">Años</span></div>
                        </div>
                      </div>
                      <div className="group relative">
                        <label className={STYLES.label}>Valor (Gs.)</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input 
                            required 
                            name="valorUnitario" 
                            defaultValue={bienEditing?.valorUnitario ? formatCurrency(bienEditing.valorUnitario) : ''} 
                            onChange={(e)=>{e.target.value=formatCurrency(e.target.value.replace(/\D/g, ''))}} 
                            className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 text-right font-black shadow-inner text-emerald-600 dark:text-emerald-400`} 
                            placeholder="0"
                        />
                      </div>
                      <div className="group relative">
                        <label className={STYLES.label}>Condición</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <select required name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || "Muy bueno"} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner cursor-pointer`}>
                            {ESTADOS_CONSERVACION.map(e=><option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3. LOCALIZACIÓN BASE */}
                <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                  
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 uppercase tracking-wider mb-0 border-none pb-0">
                         <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-location-dot"></i></div>
                         Localización Base
                      </h3>
                      
                      <label className="flex items-center gap-2.5 cursor-pointer bg-zinc-50 dark:bg-darkbg-main px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-darkbg-border shadow-sm hover:border-brand-primary transition-all group/check">
                          <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-transform group-hover/check:scale-110" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Etiqueta Impresa</span>
                      </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group relative">
                        <label className={STYLES.label}>Custodio Designado</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-funcionarios-modal-bien" name="funcionario" defaultValue={bienEditing?.funcionario} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Nombre completo..." />
                        <datalist id="lista-funcionarios-modal-bien">
                            {funcionariosConDatos.map(f => <option key={f.nombre} value={f.nombre} />)}
                        </datalist>
                    </div>
                    <div className="group relative">
                        <label className={STYLES.label}>Ubicación Operativa</label>
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <input list="lista-ubicaciones-modal-bien" name="ubicacion" defaultValue={bienEditing?.ubicacion} className={`${STYLES.input} relative !rounded-2xl bg-zinc-50/80 shadow-inner`} placeholder="Oficina / Laboratorio..." />
                        <datalist id="lista-ubicaciones-modal-bien">
                            {ubicacionesUnicas.map(u => <option key={u} value={u} />)}
                        </datalist>
                    </div>
                  </div>
                </div>

              </div>

              {/* PIE DE PÁGINA (BOTONES) */}
              <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 rounded-b-[32px]">
                <button type="button" onClick={() => setIsBienModalOpen(false)} className={STYLES.btnSecondary + " !rounded-2xl !py-3 !px-6"}>Cancelar</button>
                {!bienEditing && (
                    <button type="button" disabled={isSaving} onClick={(e) => saveBien(e, true)} className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-zinc-100 border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-300 dark:hover:bg-darkbg-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus text-xs"></i>} Guardar y Añadir Otro
                    </button>
                )}
                <button type="submit" disabled={isSaving} className={`${STYLES.btnPrimary} !rounded-2xl !py-3 !px-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20`}>
                    {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Registro</>}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
}