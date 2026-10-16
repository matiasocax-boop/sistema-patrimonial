import React, { useState, useEffect, useRef } from 'react';
import { normalizeStr } from '../utils/helpers';
import { useDraft, serializarForm } from '../hooks/useDraft';

export default function FC10Modal({ setIsFC10ModalOpen, fc10TargetBien, fc10Editing, saveFC10, STYLES, formatCurrency, funcionariosConDatos }) {
    const esNuevoFC = !fc10Editing;
    const { borrador: borradorFC, hayBorrador: hayBorradorFC, guardarBorrador: guardarBorradorFC, limpiarBorrador: limpiarBorradorFC } = useDraft('borrador_fc10_nuevo', esNuevoFC);
    const [restauradoFC, setRestauradoFC] = useState(null);
    const [formKeyFC, setFormKeyFC] = useState(0);
    const defectoFC = (campo, fb) => (restauradoFC && restauradoFC[campo] !== undefined && restauradoFC[campo] !== null ? restauradoFC[campo] : fb);
    const continuarBorradorFC = () => {
        if (!borradorFC) return;
        setRestauradoFC(borradorFC);
        setFuncData({
          nombre: borradorFC.nombre || borradorFC.funcionarioNombre || '',
          doc: borradorFC.doc || borradorFC.funcionarioDoc || '',
          cargo: borradorFC.cargo || borradorFC.funcionarioCargo || ''
        });
        setFormKeyFC(k => k + 1);
    };
    const [isReturning, setIsReturning] = useState(false);
    const [step, setStep] = useState(1); 
    const savedOrg = JSON.parse(localStorage.getItem('unp_last_org_data') || '{}');
    const safeFuncionarios = funcionariosConDatos || [];

    // Estado controlado para asegurar el autocompletado y validación
    const [funcData, setFuncData] = useState({
        nombre: fc10Editing?.funcionarioNombre || fc10TargetBien?.funcionario || '',
        doc: fc10Editing?.funcionarioDoc || '',
        cargo: fc10Editing?.funcionarioCargo || ''
    });
    // Guardia anti-doble-clic: los botones Siguiente/Confirmar ocupan el mismo
    // lugar; sin esto un doble clic salta del paso 2 al guardado sin ver el 3.
    // bloqueoRef es síncrono (el state tarda un render en aplicarse y no frena
    // el 2do clic del doble-clic). El submit se bloquea si pasó <1s del cambio.
    const [puedeGuardar, setPuedeGuardar] = useState(false);
    const enviandoRef = useRef(false);
    const bloqueoRef = useRef(0);
    const irPaso = (n) => { bloqueoRef.current = Date.now(); setStep(n); };
    useEffect(() => {
        if (step !== 3) {
            setPuedeGuardar(false);
            return;
        }
        bloqueoRef.current = Date.now();
        const t = setTimeout(() => setPuedeGuardar(true), 800);
        return () => clearTimeout(t);
    }, [step]);

    useEffect(() => {
        setIsReturning(!!fc10Editing?.devolucionFecha);
    }, [fc10Editing]);

    // Al abrir (bien con custodio pero sin CI/cargo) resuelve una vez sola.
    // Va antes del early return: los hooks nunca son condicionales.
    useEffect(() => {
        if (!funcData.nombre || (funcData.doc && funcData.cargo)) return;
        const q = normalizeStr(funcData.nombre);
        const exacto = safeFuncionarios.find(f => normalizeStr(f.nombre || '') === q);
        const match = exacto || safeFuncionarios.find(f => {
            const n = normalizeStr(f.nombre || '');
            return n.includes(q) || q.includes(n);
        });
        if (match && (match.doc || match.cargo)) {
            setFuncData({ nombre: funcData.nombre, doc: match.doc || '', cargo: match.cargo || '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fc10TargetBien) return null; 

    const nextStep = () => {
        const currentSection = document.getElementById(`step-${step}`);
        if (currentSection) {
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            for (let input of inputs) {
                if (!input.value) {
                    input.reportValidity(); 
                    return; 
                }
            }
        }
        bloqueoRef.current = Date.now();
        setStep(prev => Math.min(prev + 1, 3));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step < 3) nextStep();
        }
    };

    // Resolución tolerante contra el padrón (tildes, mayúsculas, espacios).
    // Prioriza coincidencia exacta y, entre fuzzy, la que tenga CI/cargo.
    // Antes el primer fuzzy (a veces una fila vacía/duplicada) ganaba y
    // dejaba CI/cargo vacíos aunque el dato existía en el padrón.
    const resolverFuncionario = (valor) => {
        const q = normalizeStr(valor || '');
        if (!q) return null;
        const exacto = safeFuncionarios.find(f => normalizeStr(f.nombre || '') === q);
        if (exacto) return exacto;
        const cands = safeFuncionarios.filter(f => {
            const n = normalizeStr(f.nombre || '');
            return n.includes(q) || q.includes(n);
        });
        if (!cands.length) return null;
        cands.sort((a, b) => ((b.doc ? 1 : 0) + (b.cargo ? 1 : 0)) - ((a.doc ? 1 : 0) + (a.cargo ? 1 : 0)));
        return cands[0];
    };

    // Función que lee el padrón en tiempo real (rellena sin borrar lo manual)
    const handleNameChange = (e) => {
        const val = e.target.value;
        if (!val.trim()) {
            setFuncData({ nombre: val, doc: '', cargo: '' });
            return;
        }
        const match = resolverFuncionario(val);
        setFuncData({
            nombre: val,
            doc: match?.doc || funcData.doc,
            cargo: match?.cargo || funcData.cargo
        });
    };

    // Red de seguridad: el autocompletado del navegador a veces no dispara
    // onChange; al salir del campo se resuelve con el valor real del input.
    const handleNameBlur = (e) => {
        const match = resolverFuncionario(e.target.value);
        if (match && (match.doc || match.cargo)) {
            setFuncData({ nombre: e.target.value.trim(), doc: match.doc || '', cargo: match.cargo || '' });
        }
    };
    const matchPadronActual = resolverFuncionario(funcData.nombre);
    const coincidePadron = !!matchPadronActual;
    const padronConDatos = !!(matchPadronActual?.doc || matchPadronActual?.cargo);

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl"}>
                
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white shrink-0">
                            <i className="fa-solid fa-file-signature text-lg"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                                {fc10Editing ? 'Gestionar FC-10 (Asignación/Devolución)' : 'Nueva Asignación FC-10'}
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Delegación y custodia legal de bienes institucionales</p>
                        </div>
                    </div>

                    <button type="button" title="Cerrar" aria-label="Cerrar" onClick={() => setIsFC10ModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>
                
{esNuevoFC && hayBorradorFC && !restauradoFC && (
                  <div className="mx-8 mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 animate-fade-in">
                    <i className="fa-solid fa-history text-amber-600 dark:text-amber-400 text-sm"></i>
                    <p className="flex-1 min-w-[200px] text-xs font-bold text-amber-700 dark:text-amber-300">Tienes un borrador sin guardar.</p>
                    <button type="button" onClick={continuarBorradorFC} className="h-8 px-3.5 rounded-xl text-[11px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer">Continuar</button>
                    <button type="button" onClick={limpiarBorradorFC} className="h-8 px-3.5 rounded-xl text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">Descartar</button>
                  </div>
                )}<form key={formKeyFC} onSubmit={async (e) => { e.preventDefault(); if (step !== 3) return; if (Date.now() - bloqueoRef.current < 1000) return; if (enviandoRef.current) return; if (!puedeGuardar) return; enviandoRef.current = true; try { const ok = await saveFC10(e); if (ok) limpiarBorradorFC(); } finally { enviandoRef.current = false; } }} onChange={(e) => guardarBorradorFC(serializarForm(e.currentTarget))} onKeyDown={handleKeyDown} className="flex flex-col h-full overflow-hidden bg-zinc-50/30 dark:bg-darkbg-main/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-darkbg-border'}`}></div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-darkbg-card border border-zinc-200/60 dark:border-darkbg-border rounded-[20px] p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary"></div>
                            <div className="pl-3">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Bien a asignar</p>
                                <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm">
                                    {fc10TargetBien.rotulo} <span className="font-medium text-zinc-500 dark:text-zinc-400 ml-1">- {fc10TargetBien.descripcion}</span>
                                </p>
                            </div>
                            <div className="sm:text-right pl-3 sm:pl-0">
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5">Valor Patrimonial</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">Gs. {formatCurrency(fc10TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        {/* PASO 1 */}
                        <div id="step-1" className={step === 1 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-sitemap"></i></div>
                                    Paso 1: Dependencia Organizacional
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Unidad</label>
                                        <input name="unidad" required defaultValue={defectoFC('unidad', (fc10Editing?.unidad || savedOrg.unidad))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cod. Unidad</label>
                                        <input name="unidadCod" required defaultValue={defectoFC('unidadCod', (fc10Editing?.unidadCod || savedOrg.unidadCod))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Repartición</label>
                                        <input name="reparticion" required defaultValue={defectoFC('reparticion', (fc10Editing?.reparticion || savedOrg.reparticion))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cod. Repart.</label>
                                        <input name="reparticionCod" required defaultValue={defectoFC('reparticionCod', (fc10Editing?.reparticionCod || savedOrg.reparticionCod))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Dependencia</label>
                                        <input name="dependenciaOrg" required defaultValue={defectoFC('dependenciaOrg', (fc10Editing?.dependenciaOrg || savedOrg.dependenciaOrg))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cod. Depend.</label>
                                        <input name="dependenciaCod" required defaultValue={defectoFC('dependenciaCod', (fc10Editing?.dependenciaCod || savedOrg.dependenciaCod))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Área</label>
                                        <input name="area" required defaultValue={defectoFC('area', (fc10Editing?.area || savedOrg.area))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cod. Área</label>
                                        <input name="areaCod" required defaultValue={defectoFC('areaCod', (fc10Editing?.areaCod || savedOrg.areaCod))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 2 */}
                        <div id="step-2" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-user-tie"></i></div>
                                    Paso 2: Funcionario Responsable
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Nombre y Apellido</label>
                                        <input 
                                            list="funcionarios-list-fc10" 
                                            name="funcionarioNombre" 
                                            required 
                                            value={funcData.nombre}
                                            onChange={handleNameChange}
                                            onBlur={handleNameBlur}
                                            className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`}
                                        />
                                        {funcData.nombre.trim() !== '' && (
                                            <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-bold ${padronConDatos ? 'text-emerald-600 dark:text-emerald-400' : coincidePadron ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                <i className={`fa-solid ${padronConDatos ? 'fa-circle-check' : coincidePadron ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-[10px]`}></i>
                                                {padronConDatos ? 'Datos del padrón aplicados' : coincidePadron ? 'En el padrón pero sin CI/cargo — completalos a mano' : 'Nombre libre (no está en el padrón)'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cédula de Identidad</label>
                                        <input 
                                            name="funcionarioDoc" 
                                            required 
                                            value={funcData.doc}
                                            onChange={(e) => setFuncData({...funcData, doc: e.target.value})}
                                            className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cargo Funcional</label>
                                        <input 
                                            name="funcionarioCargo" 
                                            required 
                                            value={funcData.cargo}
                                            onChange={(e) => setFuncData({...funcData, cargo: e.target.value})}
                                            className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 3 */}
                        <div id="step-3" className={step === 3 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800"><i className="fa-solid fa-clipboard-check"></i></div>
                                    Paso 3: Detalles de Asignación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Lugar de Entrega</label>
                                        <input name="entregadoLugar" required defaultValue={defectoFC('entregadoLugar', (fc10Editing?.entregadoLugar || 'Pilar'))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Fecha Asignación</label>
                                        <input type="date" name="entregadoFecha" required defaultValue={defectoFC('entregadoFecha', (fc10Editing?.entregadoFecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer tabular-nums`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Estado del Bien</label>
                                        <input name="estadoConservacion" required defaultValue={defectoFC('estadoConservacion', (fc10Editing?.estadoConservacion || fc10TargetBien.estadoConservacion))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cantidad</label>
                                        <input name="cantidad" required defaultValue={defectoFC('cantidad', (fc10Editing?.cantidad || '1'))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-zinc-500`} readOnly />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Observaciones Adicionales</label>
                                        <input name="observaciones" defaultValue={defectoFC('observaciones', (fc10Editing?.observaciones))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                    </div>
                                    <input type="hidden" name="valorTotal" value={fc10TargetBien.valorUnitario} />
                                </div>
                            </div>

                            {/* DEVOLUCIÓN */}
                            {fc10Editing && (
                                <div className="bg-white dark:bg-darkbg-card p-7 rounded-[24px] border border-zinc-200/60 dark:border-darkbg-border shadow-sm relative group/section mt-8">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-[24px]"></div>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer group/check w-fit">
                                        <input type="checkbox" checked={isReturning} onChange={(e) => setIsReturning(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer transition-transform group-hover/check:scale-110" />
                                        <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Registrar Devolución y Liberar Bien</span>
                                    </label>
                                    
                                    {isReturning && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in mt-6 pt-6 border-t border-zinc-100 dark:border-darkbg-border">
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Lugar Devolución</label>
                                                <input name="devolucionLugar" required={isReturning} defaultValue={defectoFC('devolucionLugar', (fc10Editing?.devolucionLugar || 'Pilar'))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Fecha Devolución</label>
                                                <input type="date" name="devolucionFecha" required={isReturning} defaultValue={defectoFC('devolucionFecha', (fc10Editing?.devolucionFecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer tabular-nums`} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Receptor (Nombre)</label>
                                                <input name="devolucionReceptor" required={isReturning} defaultValue={defectoFC('devolucionReceptor', (fc10Editing?.devolucionReceptor))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Cargo Receptor</label>
                                                <input name="devolucionCargoReceptor" required={isReturning} defaultValue={defectoFC('devolucionCargoReceptor', (fc10Editing?.devolucionCargoReceptor))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <datalist id="funcionarios-list-fc10">
                            {safeFuncionarios.map((f, i) => <option key={`${f.nombre}-${i}`} value={f.nombre} />)}
                        </datalist>
                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10">
                        {step === 1 ? (
                            <button type="button" onClick={() => setIsFC10ModalOpen(false)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer">Cancelar</button>
                        ) : (
                            <button type="button" onClick={() => irPaso(step - 1)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer">Anterior</button>
                        )}
                        
                        {step < 3 ? (
                            <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] h-10 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer">
                                Siguiente Paso <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
                            </button>
                        ) : (
                            <button type="submit" disabled={!puedeGuardar} title={puedeGuardar ? 'Confirmar y guardar' : 'Espere...'} className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] h-10 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                <i className="fa-solid fa-floppy-disk text-xs mr-1"></i> Confirmar y Guardar
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}