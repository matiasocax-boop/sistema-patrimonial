import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toInputDateFormat, formatearMiles } from '../utils/helpers';

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
    ubicaciones = [],
    sugerenciasBienes = [],
    STYLES
}) {
    const normalizeStr = (str) => String(str || '').trim().toUpperCase().replace(/\s+/g, ' ');

    // Estado para custodio
    const [custodioTexto, setCustodioTexto] = useState(bienEditing?.funcionario || '');
    const [showCustodioDropdown, setShowCustodioDropdown] = useState(false);
    const custodioDropdownRef = useRef(null);

    // Estado para ubicación operativa
    const [ubicacionTexto, setUbicacionTexto] = useState(bienEditing?.ubicacion || '');
    const [showUbicacionDropdown, setShowUbicacionDropdown] = useState(false);
    const ubicacionDropdownRef = useRef(null);

    // Estado para autocompletado de descripción (aprende de bienes existentes)
    const [descTexto, setDescTexto] = useState(bienEditing?.descripcion || '');
    const [showDescDropdown, setShowDescDropdown] = useState(false);
    const descDropdownRef = useRef(null);
    const sugerenciasDesc = useMemo(() => {
        const q = normalizeStr(descTexto);
        if (q.length < 3) return [];
        const tokens = q.split(' ').filter(Boolean);
        const seen = new Set();
        const out = [];
        for (const b of sugerenciasBienes) {
            const d = String(b.descripcion || '').trim();
            if (!d) continue;
            const key = normalizeStr(d);
            if (seen.has(key)) continue;
            if (tokens.every(t => key.includes(t))) {
                seen.add(key);
                out.push(b);
                if (out.length >= 6) break;
            }
        }
        return out;
    }, [descTexto, sugerenciasBienes]);
    const handleSelectDescripcion = (b) => {
        setDescTexto(b.descripcion || '');
        setShowDescDropdown(false);
        if (bienFormRef.current) {
            const set = (name, val) => {
                const el = bienFormRef.current.elements[name];
                if (el && val !== undefined && val !== null && String(val) !== '') el.value = val;
            };
            set('descripcion', b.descripcion);
            set('cuenta', b.cuenta);
            set('subcuenta', b.subcuenta);
            set('analitico1', b.analitico1);
            set('analitico2', b.analitico2);
            set('valorUnitario', b.valorUnitario ? formatearMiles(b.valorUnitario) : '');
            set('vidaUtil', b.vidaUtil);
        }
    };

    // Cerrar dropdowns si se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (custodioDropdownRef.current && !custodioDropdownRef.current.contains(event.target)) {
                setShowCustodioDropdown(false);
            }
            if (ubicacionDropdownRef.current && !ubicacionDropdownRef.current.contains(event.target)) {
                setShowUbicacionDropdown(false);
            }
            if (descDropdownRef.current && !descDropdownRef.current.contains(event.target)) {
                setShowDescDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Catálogo oficial de ubicaciones (con respaldo a las detectadas en datos)
    const catalogoUbicaciones = ubicaciones.length > 0 ? ubicaciones : (ubicacionesUnicas || []);
    // Ubicación actualmente escrita: si coincide con el catálogo, priorizar sus funcionarios
    const ubicacionCatalogada = catalogoUbicaciones.find(u => normalizeStr(u) === normalizeStr(ubicacionTexto));

    const filteredCustodios = (() => {
        const lista = funcionariosPadron.filter(f => {
            if (!custodioTexto) return true;
            const query = normalizeStr(custodioTexto);
            return normalizeStr(f.nombre).includes(query) || String(f.cedula || '').includes(query);
        });
        // Fusionar homónimos (misma persona, filas repetidas con distinto cargo/CI)
        const vistos = new Map();
        lista.forEach(f => {
            const key = normalizeStr(f.nombre || '');
            if (!key) return;
            if (!vistos.has(key)) {
                vistos.set(key, f);
            } else {
                const actual = vistos.get(key);
                vistos.set(key, {
                    ...actual,
                    cargo: actual.cargo || f.cargo,
                    cedula: actual.cedula || f.cedula,
                    ubicacion: actual.ubicacion || f.ubicacion,
                    duplicado: true
                });
            }
        });
        return [...vistos.values()];
    })().sort((a, b) => {
        if (!ubicacionCatalogada) return 0;
        const am = normalizeStr(a.ubicacion || '') === normalizeStr(ubicacionCatalogada) ? 0 : 1;
        const bm = normalizeStr(b.ubicacion || '') === normalizeStr(ubicacionCatalogada) ? 0 : 1;
        return am - bm;
    }).slice(0, 10);

    const filteredUbicaciones = catalogoUbicaciones.filter(u => {
        if (!ubicacionTexto) return true;
        return normalizeStr(u).includes(normalizeStr(ubicacionTexto));
    }).slice(0, 10);

    const autocompletarDesdeFuncionario = (f) => {
        if (!bienFormRef.current || !f) return;
        const inputFunc = bienFormRef.current.elements['funcionario'];
        const inputCargo = bienFormRef.current.elements['funcionarioCargo'];
        const inputDoc = bienFormRef.current.elements['funcionarioDoc'];
        const inputUb = bienFormRef.current.elements['ubicacion'];
        if (inputFunc) inputFunc.value = f.nombre;
        if (inputCargo) inputCargo.value = f.cargo || '';
        if (inputDoc) inputDoc.value = f.cedula || '';
        // Ubicación del funcionario: se autocompleta pero queda editable sin tocar el padrón
        if (inputUb && f.ubicacion) {
            inputUb.value = f.ubicacion;
            setUbicacionTexto(f.ubicacion);
        }
    };

    const handleSelectCustodio = (f) => {
        setCustodioTexto(f.nombre);
        setShowCustodioDropdown(false);
        autocompletarDesdeFuncionario(f);
    };

    const handleSelectUbicacion = (ub) => {
        setUbicacionTexto(ub);
        setShowUbicacionDropdown(false);
        if (bienFormRef.current) {
            const inputUb = bienFormRef.current.elements['ubicacion'];
            if (inputUb) inputUb.value = ub;
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
            autocompletarDesdeFuncionario(match);
        } else {
            if (inputCargo) inputCargo.value = '';
            if (inputDoc) inputDoc.value = '';
        }
    };

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-4xl overflow-hidden"}>
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                   <i className={`fa-solid ${bienEditing ? 'fa-pen-to-square' : 'fa-plus'} text-base`}></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    {bienEditing ? 'Editar Bien Patrimonial' : 'Registrar Nuevo Bien'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Complete la información requerida para el inventario</p>
                </div>
              </div>

              <button
                onClick={() => setIsBienModalOpen(false)}
                title="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                 <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>
            
            <form ref={bienFormRef} onSubmit={(e) => saveBien(e, false)} className="flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* 1. IMPUTACIÓN CONTABLE Y RÓTULO */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">1</span>
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Imputación y Código Patrimonial</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cuenta</label>
                        <input name="cuenta" defaultValue={bienEditing?.cuenta} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 11" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Subcuenta</label>
                        <input name="subcuenta" defaultValue={bienEditing?.subcuenta} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 01" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Analítico 1</label>
                        <input name="analitico1" defaultValue={bienEditing?.analitico1} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 001" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Analítico 2</label>
                        <input name="analitico2" defaultValue={bienEditing?.analitico2} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Rótulo / Código de Barra *</label>
                    <input name="rotulo" required defaultValue={bienEditing?.rotulo} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 104523" />
                  </div>
                </div>

                {/* 2. IDENTIFICACIÓN FÍSICA Y ESTADO */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white text-xs font-bold">2</span>
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">Especificaciones del Activo</h3>
                  </div>

                  <div className="mb-4 relative" ref={descDropdownRef}>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Descripción General del Bien *</label>
                    <textarea
                      name="descripcion"
                      required
                      rows="3"
                      defaultValue={bienEditing?.descripcion}
                      onChange={(e) => { setDescTexto(e.target.value); setShowDescDropdown(true); }}
                      onFocus={() => { if (normalizeStr(descTexto).length >= 3) setShowDescDropdown(true); }}
                      className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
                      placeholder="Escribe y elige una descripción similar para autocompletar cuenta y valores..."
                    ></textarea>
                    {showDescDropdown && sugerenciasDesc.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl py-1 custom-scrollbar">
                        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Coincidencias — clic para autocompletar</p>
                        {sugerenciasDesc.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectDescripcion(b)}
                            className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{b.descripcion}</span>
                            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                              {[b.cuenta, b.subcuenta, b.analitico1, b.analitico2].filter(Boolean).join(' · ')}{b.valorUnitario ? ` · Gs. ${b.valorUnitario}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Estado de Conservación</label>
                    <select name="estadoConservacion" defaultValue={bienEditing?.estadoConservacion || 'Bueno'} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}>
                        {ESTADOS_CONSERVACION.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
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
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Valor de Adquisición (Gs.)</label>
                        <input type="text" inputMode="numeric" name="valorUnitario" defaultValue={bienEditing?.valorUnitario ? formatearMiles(bienEditing.valorUnitario) : ''} onInput={(e) => { e.target.value = formatearMiles(e.target.value); }} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 1.500.000" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Fecha de Adquisición</label>
                        <input type="date" name="fechaAdquisicion" defaultValue={toInputDateFormat(bienEditing?.fechaAdquisicion)} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Vida Útil (Años)</label>
                        <input type="number" name="vidaUtil" defaultValue={bienEditing?.vidaUtil} className={`${STYLES.input} tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej: 5 o 10" />
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
                        <input type="checkbox" name="hasQR" defaultChecked={bienEditing?.hasQR} className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" />
                        <span>Etiqueta QR Impresa</span>
                      </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">C.I. Custodio</label>
                        <input name="funcionarioDoc" defaultValue={bienEditing?.funcionarioDoc} readOnly className={`${STYLES.input} tabular-nums bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Auto-completado" />
                    </div>
                    <div className="md:col-span-2 relative" ref={custodioDropdownRef}>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Custodio Designado (Nombre)</label>
                        <input 
                            name="funcionario" 
                            value={custodioTexto} 
                            onChange={handleCustodioChange} 
                            onFocus={() => setShowCustodioDropdown(true)}
                            className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} 
                            placeholder="Escribe o selecciona custodio..." 
                            autoComplete="off"
                        />
                        
                        {/* Custom Dropdown Custodios */}
                        {showCustodioDropdown && filteredCustodios.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {filteredCustodios.map((f) => (
                                    <button
                                        type="button"
                                        key={f.id || f.cedula}
                                        onClick={() => handleSelectCustodio(f)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary dark:group-hover:text-blue-400 truncate">
                                                {f.nombre}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                {f.cargo || 'Funcionario'}{f.ubicacion ? ` · ${f.ubicacion}` : ''}
                                            </p>
                                        </div>
                                        {f.cedula && (
                                            <span className="shrink-0 text-[10px] font-mono tabular-nums bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
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
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cargo Funcional</label>
                        <input name="funcionarioCargo" defaultValue={bienEditing?.funcionarioCargo} readOnly className={`${STYLES.input} bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Auto-completado" />
                    </div>
                    <div className="relative" ref={ubicacionDropdownRef}>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Ubicación Operativa</label>
                        <input 
                            name="ubicacion" 
                            value={ubicacionTexto} 
                            onChange={(e) => {
                                setUbicacionTexto(e.target.value);
                                setShowUbicacionDropdown(true);
                            }}
                            onFocus={() => setShowUbicacionDropdown(true)}
                            className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} 
                            placeholder="Oficina / Laboratorio..." 
                            autoComplete="off"
                        />

                        {/* Custom Dropdown Ubicaciones */}
                        {showUbicacionDropdown && filteredUbicaciones.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {filteredUbicaciones.map((ub) => (
                                    <button
                                        type="button"
                                        key={ub}
                                        onClick={() => handleSelectUbicacion(ub)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                                    >
                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary dark:group-hover:text-blue-400 truncate">
                                            {ub}
                                        </p>
                                        <i className="fa-solid fa-location-dot text-[10px] text-zinc-400 group-hover:text-brand-primary"></i>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsBienModalOpen(false)} 
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Cancelar
                </button>

                {!bienEditing && (
                    <button 
                      type="button" 
                      disabled={isSaving}
                      onClick={(e) => saveBien(e, true)} 
                      className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
                    >
                      + Guardar y Añadir Otro
                    </button>
                )}

                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : (bienEditing ? 'Actualizar Bien' : '+ Guardar Registro')}
                </button>
              </div>

            </form>
          </div>
        </div>
    );
}
