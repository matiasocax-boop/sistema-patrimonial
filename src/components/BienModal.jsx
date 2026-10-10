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
    funcionariosPadron = [],
    STYLES
}) {
    const normalizeStr = (str) => String(str || '').trim().toUpperCase().replace(/\s+/g, ' ');

    const handleCustodioChange = (e) => {
        const valorInput = e.target.value;
        if (!bienFormRef.current) return;
        
        const match = funcionariosPadron.find(f => 
            normalizeStr(f.nombre) === normalizeStr(valorInput) || 
            String(f.cedula).trim() === String(valorInput).trim()
        );

        const inputCargo = bienFormRef.current.elements['funcionarioCargo'];
        const inputDoc = bienFormRef.current.elements['funcionarioDoc'];

        if (match) {
            if (inputCargo) inputCargo.value = match.cargo || '';
            if (inputDoc) inputDoc.value = match.cedula || '';
        } else {
            if (inputCargo) inputCargo.value = '';
            if (inputDoc) inputDoc.value = '';
        }
    };

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-4xl !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950"}>
            
            {/* Header */}
            <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0 z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-white/5">
                   <i className={`fa-solid ${bienEditing ? 'fa-pen-to-square' : 'fa-plus'} text-lg`}></i>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {bienEditing ? 'Editar Bien Patrimonial' : 'Registrar Nuevo Bien'}
                  </h2>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Complete la información requerida para el inventario</p>
                </div>
              </div>

              <button 
                onClick={() => setIsBienModalOpen(false)} 
                className="rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                 <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <form ref={bienFormRef} onSubmit={(e) => saveBien(e, false)} className="flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* 1. IMPUTACIÓN CONTABLE */}
                <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-[24px] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/50 dark:border-white/5 text-xs">
                       <i className="fa-solid fa-calculator"></i>
                     </div>
                     <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                       Imputación Contable
                     </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className={STYLES.label}>Cuenta Mayor</label>
                        <input list="lista-cuentas" name="cuenta" defaultValue={bienEditing?.cuenta} className={STYLES.input} placeholder="Ej. 2.6.1.01" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Sub-Cuenta</label>
                        <input list="lista-subcuentas" name="subcuenta" defaultValue={bienEditing?.subcuenta} className={STYLES.input} placeholder="Opcional" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Analítico 1</label>
                        <input list="lista-analiticos1" name="analitico1" defaultValue={bienEditing?.analitico1} className={STYLES.input} placeholder="Opcional" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Analítico 2</label>
                        <input list="lista-analiticos2" name="analitico2" defaultValue={bienEditing?.analitico2} className={STYLES.input} placeholder="Opcional" />
                    </div>
                  </div>
                </div>
                
                {/* 2. ESPECIFICACIONES TÉCNICAS */}
                <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-[24px] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                  <div className="flex items-center gap-3 mb-5">
                     <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/50 dark:border-white/5 text-xs">
                       <i className="fa-solid fa-laptop"></i>
                     </div>
                     <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                       Especificaciones Técnicas
                     </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                        <label className={STYLES.label}>Descripción General</label>
                        <input list="lista-descripciones" required name="descripcion" defaultValue={bienEditing?.descripcion} className={STYLES.input} placeholder="Ej. Computadora de Escritorio HP Intel Core i5..." />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                          <label className={STYLES.label}>Nº Rótulo</label>
                          <input required name="rotulo" defaultValue={bienEditing?.rotulo} className={`${STYLES.input} font-semibold`} placeholder="Ej. 10255" />
                      </div>
                      <div>
                        <label className={STYLES.label}>Adquisición</label>
                        <input type="date" required name="fechaAdquisicion" defaultValue={bienEditing?.fechaAdquisicion ? String(bienEditing?.fechaAdquisicion).split('T')[0] : ''} className={`${STYLES.input} cursor-pointer`} />
                      </div>
                      <div>
                        <label className={STYLES.label}>Vida Útil</label>
                        <div className="relative">
                          <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={STYLES.input} placeholder="Años" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"><span className="text-zinc-400 text-xs font-semibold uppercase">Años</span></div>
                        </div>
                      </div>
                      <div>
                        <label className={STYLES.label}>Valor (Gs.)</label>
                        <input 
                            required 
                            name="valorUnitario" 
                            defaultValue={bienEditing?.valorUnitario ? formatCurrency(bienEditing.valorUnitario) : ''} 
                            onChange={(e)=>{e.target.value=formatCurrency(e.target.value.replace(/\D/g, ''))}} 
                            className={`${STYLES.input} text-right font-semibold text-emerald-600 dark:text-emerald-400`} 
                            placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={STYLES.label}>Condición</label>
                        <select required name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || "Muy bueno"} className={`${STYLES.input} cursor-pointer`}>
                            {ESTADOS_CONSERVACION.map(e=><option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3. LOCALIZACIÓN BASE Y CUSTODIO */}
                <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-[24px] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                  <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/50 dark:border-white/5 text-xs">
                           <i className="fa-solid fa-location-dot"></i>
                         </div>
                         <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                           Localización Base
                         </h3>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer bg-zinc-100 dark:bg-white/5 px-3.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                          <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-4 w-4 rounded accent-zinc-900 dark:accent-white cursor-pointer" />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Etiqueta Impresa</span>
                      </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className={STYLES.label}>C.I. Custodio</label>
                        <input name="funcionarioDoc" defaultValue={bienEditing?.funcionarioDoc} readOnly className={`${STYLES.input} bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 cursor-not-allowed`} placeholder="Auto-completado" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={STYLES.label}>Custodio Designado (Nombre)</label>
                        <input list="lista-funcionarios-modal-bien" name="funcionario" defaultValue={bienEditing?.funcionario} onChange={handleCustodioChange} className={STYLES.input} placeholder="Escribe o selecciona..." />
                        <datalist id="lista-funcionarios-modal-bien">
                            {funcionariosPadron.map(f => <option key={f.id || f.cedula} value={f.nombre} />)}
                        </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={STYLES.label}>Cargo Funcional</label>
                        <input name="funcionarioCargo" defaultValue={bienEditing?.funcionarioCargo} readOnly className={`${STYLES.input} bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 cursor-not-allowed`} placeholder="Auto-completado" />
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

              {/* Footer Buttons */}
              <div className="flex justify-end items-center gap-3 px-8 py-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0 z-10">
                <button type="button" onClick={() => setIsBienModalOpen(false)} className={STYLES.btnSecondary}>
                  Cancelar
                </button>
                {!bienEditing && (
                    <button 
                      type="button" 
                      disabled={isSaving} 
                      onClick={(e) => saveBien(e, true)} 
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/5 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus text-xs"></i>} Guardar y Añadir Otro
                    </button>
                )}
                <button type="submit" disabled={isSaving} className={STYLES.btnPrimary}>
                    {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check text-xs"></i> Guardar Registro</>}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
}
