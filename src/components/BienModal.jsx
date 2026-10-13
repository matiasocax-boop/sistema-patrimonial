import React, { useState, useRef, useEffect } from 'react';
import { toInputDateFormat } from '../utils/helpers';

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

    const [custodioTexto, setCustodioTexto] = useState(bienEditing?.funcionario || '');
    const [showCustodioDropdown, setShowCustodioDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar dropdown si se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCustodioDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustodios = funcionariosPadron.filter(f => {
        if (!custodioTexto) return true;
        const query = normalizeStr(custodioTexto);
        return normalizeStr(f.nombre).includes(query) || String(f.cedula || '').includes(query);
    }).slice(0, 10);

    const handleSelectCustodio = (f) => {
        setCustodioTexto(f.nombre);
        setShowCustodioDropdown(false);
        if (bienFormRef.current) {
            const inputFunc = bienFormRef.current.elements['funcionario'];
            const inputCargo = bienFormRef.current.elements['funcionarioCargo'];
            const inputDoc = bienFormRef.current.elements['funcionarioDoc'];
            if (inputFunc) inputFunc.value = f.nombre;
            if (inputCargo) inputCargo.value = f.cargo || '';
            if (inputDoc) inputDoc.value = f.cedula || '';
        }
    };

    const handleCustodioChange = (e) => {
        const valorInput = e.target.value;
        setCustodioTexto(valorInput);
        setShowCustodioDropdown(true);

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
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">1</span>
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Imputación y Código Patrimonial</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className={STYLES.label}>Cuenta</label>
                        <input name="cuenta" defaultValue={bienEditing?.cuenta} className={STYLES.input} placeholder="Ej: 11" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Subcuenta</label>
                        <input name="subcuenta" defaultValue={bienEditing?.subcuenta} className={STYLES.input} placeholder="Ej: 01" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Analítico 1</label>
                        <input name="analitico1" defaultValue={bienEditing?.analitico1} className={STYLES.input} placeholder="Ej: 001" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Analítico 2</label>
                        <input name="analitico2" defaultValue={bienEditing?.analitico2} className={STYLES.input} placeholder="Ej: 000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className={STYLES.label}>Rótulo / Código de Barra *</label>
                        <input name="rotulo" required defaultValue={bienEditing?.rotulo} className={STYLES.input} placeholder="Ej: 104523" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Nº Catálogo</label>
                        <input name="catalogo" defaultValue={bienEditing?.catalogo} className={STYLES.input} placeholder="Opcional" />
                    </div>
                  </div>
                </div>

                {/* 2. IDENTIFICACIÓN FÍSICA Y DETALLES */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">2</span>
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Especificaciones del Activo</h3>
                  </div>

                  <div className="mb-4">
                    <label className={STYLES.label}>Descripción General del Bien *</label>
                    <textarea name="descripcion" required rows="3" defaultValue={bienEditing?.descripcion} className={STYLES.input} placeholder="Detalles de marca, modelo, dimensiones, material..."></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className={STYLES.label}>Nº de Serie</label>
                        <input name="serie" defaultValue={bienEditing?.serie} className={STYLES.input} placeholder="S/N o chasis" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Marca</label>
                        <input name="marca" defaultValue={bienEditing?.marca} className={STYLES.input} placeholder="Marca del bien" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Modelo</label>
                        <input name="modelo" defaultValue={bienEditing?.modelo} className={STYLES.input} placeholder="Modelo de fábrica" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={STYLES.label}>Color</label>
                        <input name="color" defaultValue={bienEditing?.color} className={STYLES.input} placeholder="Ej: Negro / Gris" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Estado de Conservación</label>
                        <select name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || 'Bueno'} className={STYLES.input}>
                            {ESTADOS_CONSERVACION.map(est => <option key={est} value={est}>{est}</option>)}
                        </select>
                    </div>
                  </div>
                </div>

                {/* 3. VALORIZACIÓN Y CONTABILIDAD */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">3</span>
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Valor y Fecha de Incorporación</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={STYLES.label}>Valor de Adquisición (Gs.)</label>
                        <input type="number" step="any" name="valorUnitario" defaultValue={bienEditing?.valorUnitario} className={STYLES.input} placeholder="Ej: 1500000" />
                    </div>
                    <div>
                        <label className={STYLES.label}>Fecha de Adquisición</label>
                        <input type="date" name="fechaAdquisicion" defaultValue={toInputDateFormat(bienEditing?.fechaAdquisicion)} className={STYLES.input} />
                    </div>
                    <div>
                        <label className={STYLES.label}>Vida Útil (Años)</label>
                        <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={STYLES.input} placeholder="Ej: 5 o 10" />
                    </div>
                  </div>
                </div>

                {/* 4. ASIGNACIÓN, CUSTODIA Y UBICACIÓN */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">4</span>
                         <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Custodio y Ubicación</h3>
                      </div>
                      
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                        <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary/20" />
                        <span>Etiqueta QR Impresa</span>
                      </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className={STYLES.label}>C.I. Custodio</label>
                        <input name="funcionarioDoc" defaultValue={bienEditing?.funcionarioDoc} readOnly className={`${STYLES.input} bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 cursor-not-allowed`} placeholder="Auto-completado" />
                    </div>
                    <div className="md:col-span-2 relative" ref={dropdownRef}>
                        <label className={STYLES.label}>Custodio Designado (Nombre)</label>
                        <input 
                            name="funcionario" 
                            value={custodioTexto} 
                            onChange={handleCustodioChange} 
                            onFocus={() => setShowCustodioDropdown(true)}
                            className={STYLES.input} 
                            placeholder="Escribe o selecciona custodio..." 
                            autoComplete="off"
                        />
                        
                        {/* Custom Dropdown con contraste perfecto */}
                        {showCustodioDropdown && filteredCustodios.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {filteredCustodios.map((f) => (
                                    <button
                                        type="button"
                                        key={f.id || f.cedula}
                                        onClick={() => handleSelectCustodio(f)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between cursor-pointer group"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary dark:group-hover:text-blue-400 truncate">
                                                {f.nombre}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                {f.cargo || 'Funcionario'}
                                            </p>
                                        </div>
                                        {f.cedula && (
                                            <span className="shrink-0 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                                {f.cedula}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
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
                <button 
                  type="button" 
                  onClick={() => setIsBienModalOpen(false)} 
                  className="rounded-xl px-5 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                {!bienEditing && (
                    <button 
                      type="button" 
                      disabled={isSaving}
                      onClick={(e) => saveBien(e, true)} 
                      className="rounded-xl px-5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      + Guardar y Añadir Otro
                    </button>
                )}

                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-xl bg-brand-primary hover:bg-brand-hover px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : (bienEditing ? 'Actualizar Bien' : '+ Guardar Registro')}
                </button>
              </div>

            </form>
          </div>
        </div>
    );
}
