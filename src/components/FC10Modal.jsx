import React, { useState, useEffect, useRef, useMemo } from 'react';
import { normalizeStr } from '../utils/helpers';
import { useDraft, serializarForm } from '../hooks/useDraft';
import CampoCatalogo from './CampoCatalogo';
import SelectorPersona from './SelectorPersona';
import { FC10_ORGANOS, FC10_UNIDADES, opcionesCatalogoFC10, organoDeUnidad } from '../constants/fc10Catalogo';

export default function FC10Modal({ setIsFC10ModalOpen, fc10TargetBien, fc10Editing, saveFC10, STYLES, formatCurrency, funcionariosConDatos, dependenciaActual, estructurasDB }) {
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
    // Lectura defensiva: un JSON corrupto en localStorage rompía el render del
    // modal entero (ErrorBoundary) y se re-parseaba en cada render.
    const savedOrg = (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('unp_last_org_data') || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch {
            return {};
        }
    })();
    const safeFuncionarios = funcionariosConDatos || [];

    // ---- Paso 1: estructura organizacional (en cascada) --------------------
    // Unidad jerárquica (órgano) → Repartición → Dependencia → Área. Cada nivel
    // sugiere solo lo que cuelga de lo elegido arriba; el código patrimonial se
    // completa al elegir del catálogo y se puede corregir a mano.
    const memoriaOrg = useMemo(() => estructurasDB || [], [estructurasDB]);

    // "Rectorado" no figura textual en el organigrama (que dice
    // "Rectorado / Despacho del Rector"), así que también se acepta el prefijo.
    const organoDesdeNombre = (nombre) => {
        if (!nombre) return '';
        const exacto = organoDeUnidad(nombre);
        if (exacto) return exacto;
        const q = normalizeStr(nombre);
        const hit = FC10_ORGANOS.find(o => normalizeStr(o.nombre).startsWith(q));
        return hit ? hit.nombre : '';
    };

    // Dependencia de trabajo "Rectorado" → la Unidad Jerárquica del FC-10 va
    // siempre como "Rectorado" con código 03 (Res. C.S.U. N° 76/2024).
    // Ojo: normalizeStr devuelve MAYÚSCULAS y sin tildes.
    const UNIDAD_RECTORADO = 'Rectorado';
    const UNIDAD_RECTORADO_N = normalizeStr(UNIDAD_RECTORADO);
    const COD_RECTORADO = '03';
    const esRectorado = normalizeStr(dependenciaActual || '').includes('RECTOR');

    // Valores escritos de verdad (borrador en curso o registro en edición). El
// "último uso" (savedOrg) es solo memoria y no pisa la regla del Rectorado.
const valorOrgExplicito = (campo) => {
        const b = restauradoFC && restauradoFC[campo];
        if (b !== undefined && b !== null && String(b).trim() !== '') return String(b);
        const ed = fc10Editing && fc10Editing[campo];
        if (ed !== undefined && ed !== null && String(ed).trim() !== '') return String(ed);
        return '';
    };

    const unidadInicial = () => {
        const v = valorOrgExplicito('unidad');
        const esOrganoOCentro = normalizeStr(v) === UNIDAD_RECTORADO_N
            || FC10_ORGANOS.some(o => normalizeStr(o.nombre) === normalizeStr(v));
        if (v && esOrganoOCentro) return v;
        if (esRectorado) return UNIDAD_RECTORADO;
        return organoDesdeNombre(valorOrgBase('unidad'));
    };
    const unidadCodInicial = () => {
        const c = valorOrgExplicito('unidadCod');
        if (c) return c;
        if (esRectorado) return COD_RECTORADO;
        return valorOrgBase('unidadCod');
    };

    const valorOrgBase = (campo) => {
        const b = restauradoFC && restauradoFC[campo];
        if (b !== undefined && b !== null && String(b).trim() !== '') return String(b);
        const ed = fc10Editing && fc10Editing[campo];
        if (ed !== undefined && ed !== null && String(ed).trim() !== '') return String(ed);
        const sv = savedOrg && savedOrg[campo];
        if (sv !== undefined && sv !== null && String(sv).trim() !== '') return String(sv);
        return '';
    };

    const [org, setOrg] = useState(unidadInicial);
    const [orgCod, setOrgCod] = useState(unidadCodInicial);
    const [reparticion, setReparticion] = useState(() => valorOrgBase('reparticion'));
    const [reparticionCod, setReparticionCod] = useState(() => valorOrgBase('reparticionCod'));
    const [dependencia, setDependencia] = useState(() => valorOrgBase('dependenciaOrg'));
    const [dependenciaCod, setDependenciaCod] = useState(() => valorOrgBase('dependenciaCod'));
    const [area, setArea] = useState(() => valorOrgBase('area'));
    const [areaCod, setAreaCod] = useState(() => valorOrgBase('areaCod'));

    // Al continuar un borrador se vuelve a leer todo el bloque (los campos del
    // formulario ya no usan defaultValue, son controlados).
    const orgMontadoRef = useRef(false);
    useEffect(() => {
        if (!orgMontadoRef.current) { orgMontadoRef.current = true; return; }
        setOrg(unidadInicial());
        setOrgCod(unidadCodInicial());
        setReparticion(valorOrgBase('reparticion'));
        setReparticionCod(valorOrgBase('reparticionCod'));
        setDependencia(valorOrgBase('dependenciaOrg'));
        setDependenciaCod(valorOrgBase('dependenciaCod'));
        setArea(valorOrgBase('area'));
        setAreaCod(valorOrgBase('areaCod'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formKeyFC]);

    // Al cambiar un nivel se limpian los que cuelgan de él (cascada).
    // nivel: 1 = unidad jerárquica, 2 = repartición, 3 = dependencia.
    const vaciarDebajo = (nivel) => {
        if (nivel <= 1) { setReparticion(''); setReparticionCod(''); }
        if (nivel <= 2) { setDependencia(''); setDependenciaCod(''); }
        if (nivel <= 3) { setArea(''); setAreaCod(''); }
    };

    const cambiaUnidad = (nombre) => {
        if (nombre === org) return;
        setOrg(nombre);
        setOrgCod('');
        vaciarDebajo(1);
    };
    const cambiaReparticion = (nombre) => {
        if (nombre === reparticion) return;
        setReparticion(nombre);
        setReparticionCod('');
        vaciarDebajo(2);
    };
    const cambiaDependencia = (nombre) => {
        if (nombre === dependencia) return;
        setDependencia(nombre);
        setDependenciaCod('');
        vaciarDebajo(3);
    };
    const cambiaArea = (nombre) => {
        if (nombre === area) return;
        setArea(nombre);
        setAreaCod('');
    };

    // Al elegir del catálogo se completa el código y, si el órgano aún no está
    // cargado, se deduce del nivel elegido.
    const conOrgano = (opcion) => {
        if (org) return;
        const o = organoDesdeNombre(opcion.organo);
        if (!o) return;
        setOrg(o);
        setOrgCod(FC10_UNIDADES.find(x => x.nombre === o)?.codigo || '');
    };

    const usarUltimaAsignacion = () => {
        const s = savedOrg || {};
        if (!s.unidad && !s.reparticion) return;
        setOrg(organoDesdeNombre(s.unidad) || (esRectorado ? UNIDAD_RECTORADO : '') || s.unidad);
        setOrgCod(esRectorado && normalizeStr(s.unidad || '') === UNIDAD_RECTORADO_N ? COD_RECTORADO : (s.unidadCod || ''));
        setReparticion(s.reparticion || ''); setReparticionCod(s.reparticionCod || '');
        setDependencia(s.dependenciaOrg || ''); setDependenciaCod(s.dependenciaCod || '');
        setArea(s.area || ''); setAreaCod(s.areaCod || '');
    };

    const opcionesUnidad = useMemo(() => opcionesCatalogoFC10({ nivel: 'unidad', memoria: memoriaOrg }), [memoriaOrg]);
    const opcionesReparticion = useMemo(
        () => opcionesCatalogoFC10({ nivel: 'reparticion', organo: org, memoria: memoriaOrg }),
        [org, memoriaOrg]
    );
    const opcionesDependencia = useMemo(
        () => opcionesCatalogoFC10({ nivel: 'dependencia', organo: org, padre: reparticion, memoria: memoriaOrg }),
        [org, reparticion, memoriaOrg]
    );
    const opcionesArea = useMemo(
        () => opcionesCatalogoFC10({ nivel: 'area', organo: org, padre: dependencia || reparticion, memoria: memoriaOrg }),
        [org, dependencia, reparticion, memoriaOrg]
    );

    // Estado controlado para asegurar el autocompletado y validación
    const [funcData, setFuncData] = useState({
        nombre: fc10Editing?.funcionarioNombre || fc10TargetBien?.funcionario || '',
        doc: fc10Editing?.funcionarioDoc || '',
        cargo: fc10Editing?.funcionarioCargo || ''
    });
    // Segunda firma: el jefe inmediato. Mismo treatment que el funcionario
    // (autocompletado contra el padrón) para no escribirlo a mano.
    const [jefeData, setJefeData] = useState({
        nombre: fc10Editing?.jefeInmediatoNombre || '',
        doc: fc10Editing?.jefeInmediatoDoc || '',
        cargo: fc10Editing?.jefeInmediatoCargo || ''
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
    // Autocompletado del jefe inmediato, con la misma tolerancia del funcionario.
    const handleJefeNameChange = (e) => {
        const val = e.target.value;
        if (!val.trim()) { setJefeData({ nombre: val, doc: '', cargo: '' }); return; }
        const match = resolverFuncionario(val);
        setJefeData({
            nombre: val,
            doc: match?.doc || jefeData.doc,
            cargo: match?.cargo || jefeData.cargo
        });
    };
    const handleJefeNameBlur = (e) => {
        const match = resolverFuncionario(e.target.value);
        if (match && (match.doc || match.cargo)) {
            setJefeData({ nombre: e.target.value.trim(), doc: match.doc || '', cargo: match.cargo || '' });
        }
    };

    const matchPadronActual = resolverFuncionario(funcData.nombre);
    const coincidePadron = !!matchPadronActual;
    const padronConDatos = !!(matchPadronActual?.doc || matchPadronActual?.cargo);
    // Mismo diagnostico para el jefe inmediato, para que se vea de inmediato si
    // el nombre elegido existe en el padron y si tiene CI/cargo.
    const matchJefe = resolverFuncionario(jefeData.nombre);
    const jefeEnPadron = !!matchJefe;
    const jefeConDatos = !!(matchJefe?.doc || matchJefe?.cargo);

    return (
        <div className={STYLES.modalOverlay}>
            <div className={`${STYLES.modalContent} max-w-3xl`}>
                
                <div className="px-5 sm:px-6 py-4 border-b border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card shrink-0 z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                            <i className="fa-solid fa-file-signature text-sm"></i>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                                {fc10Editing ? 'Gestionar FC-10 (Asignación/Devolución)' : 'Nueva Asignación FC-10'}
                            </h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Delegación y custodia legal de bienes institucionales</p>
                        </div>
                    </div>

                    <button type="button" title="Cerrar" aria-label="Cerrar" onClick={() => setIsFC10ModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-sm"></i>
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
                        
                        <nav aria-label="Pasos del alta del FC-10" className="flex items-center gap-2">
                            {[
                                { n: 1, label: 'Dependencia' },
                                { n: 2, label: 'Responsables' },
                                { n: 3, label: 'Entrega' }
                            ].map((s, i, arr) => (
                                <React.Fragment key={s.n}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 ${
                                            step > s.n
                                                ? 'bg-emerald-500 text-white'
                                                : step === s.n
                                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 ring-4 ring-zinc-900/10 dark:ring-white/10'
                                                    : 'bg-zinc-200 dark:bg-darkbg-border text-zinc-400 dark:text-zinc-600'
                                        }`}>
                                            {step > s.n ? <i className="fa-solid fa-check text-[10px]"></i> : s.n}
                                        </span>
                                        <span className={`hidden sm:block text-xs font-bold whitespace-nowrap transition-colors ${
                                            step >= s.n ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
                                        }`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className={`h-px flex-1 min-w-4 transition-colors duration-300 ${step > s.n ? 'bg-emerald-400/60' : 'bg-zinc-200 dark:bg-darkbg-border'}`}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Bien</p>
                                <p className="font-mono text-xs font-bold text-zinc-900 dark:text-white">{fc10TargetBien.rotulo}</p>
                            </div>
                            <p className="min-w-0 flex-[2] text-xs text-zinc-600 dark:text-zinc-300 truncate" title={fc10TargetBien.descripcion}>
                                {fc10TargetBien.descripcion}
                            </p>
                            <div className="text-right shrink-0 ml-auto">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Valor</p>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">Gs. {formatCurrency(fc10TargetBien.valorUnitario)}</p>
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
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_92px] gap-2">
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Entidad</label>
                                            <input name="entidad" value="UNIVERSIDAD NACIONAL DE PILAR" readOnly className={`${STYLES.input} py-2.5 bg-zinc-100 dark:bg-darkbg-main text-zinc-500 cursor-not-allowed`} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cód.</label>
                                            <input name="entidadCod" value="28" readOnly className={`${STYLES.input} py-2.5 text-center font-mono text-[13px] font-bold tabular-nums bg-zinc-100 dark:bg-darkbg-main text-zinc-500 cursor-not-allowed`} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                                            Elegí de arriba hacia abajo: cada lista se filtra según lo anterior.
                                        </p>
                                        {savedOrg && savedOrg.reparticion && (
                                            <button type="button" onClick={usarUltimaAsignacion} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0">
                                                <i className="fa-solid fa-clock-rotate-left text-[10px]"></i>
                                                Reusar última
                                            </button>
                                        )}
                                    </div>

                                    <CampoCatalogo
                                        etiqueta="Unidad jerárquica"
                                        name="unidad"
                                        required
                                        nombre={org}
                                        codigo={orgCod}
                                        codigoName="unidadCod"
                                        etiquetaCodigo="Código de la unidad jerárquica"
                                        onEscribirNombre={cambiaUnidad}
                                        onCambiarCodigo={setOrgCod}
                                        opciones={opcionesUnidad}
                                        placeholder="Órgano o Rectorado"
                                        STYLES={STYLES}
                                    />

                                    <CampoCatalogo
                                        etiqueta="Repartición"
                                        name="reparticion"
                                        required
                                        nombre={reparticion}
                                        codigo={reparticionCod}
                                        codigoName="reparticionCod"
                                        etiquetaCodigo="Código de la repartición"
                                        onEscribirNombre={cambiaReparticion}
                                        onCambiarCodigo={setReparticionCod}
                                        onElegirOpcion={conOrgano}
                                        opciones={opcionesReparticion}
                                        placeholder={org ? 'Nombre o código' : 'Elegí la unidad jerárquica primero'}
                                        STYLES={STYLES}
                                    />

                                    <CampoCatalogo
                                        etiqueta="Dependencia organizacional"
                                        name="dependenciaOrg"
                                        required
                                        nombre={dependencia}
                                        codigo={dependenciaCod}
                                        codigoName="dependenciaCod"
                                        etiquetaCodigo="Código de la dependencia"
                                        onEscribirNombre={cambiaDependencia}
                                        onCambiarCodigo={setDependenciaCod}
                                        onElegirOpcion={conOrgano}
                                        opciones={opcionesDependencia}
                                        placeholder={reparticion ? 'Nombre o código' : 'Elegí la repartición primero'}
                                        STYLES={STYLES}
                                    />

                                    <CampoCatalogo
                                        etiqueta="Área"
                                        name="area"
                                        required
                                        nombre={area}
                                        codigo={areaCod}
                                        codigoName="areaCod"
                                        etiquetaCodigo="Código del área"
                                        onEscribirNombre={cambiaArea}
                                        onCambiarCodigo={setAreaCod}
                                        onElegirOpcion={conOrgano}
                                        opciones={opcionesArea}
                                        placeholder={dependencia || reparticion ? 'Nombre o código' : 'Elegí la dependencia primero'}
                                        STYLES={STYLES}
                                    />
                                </div>
                            </div>
                        </div>

<div id="step-2" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-white/10">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Responsables de la firma</h3>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        El acta cierra con dos firmas, en este orden. Buscá en el padrón: se completan CI y cargo solos.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-white/10">
                                    {/* Firma 1: funcionario responsable */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black">1</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Funcionario responsable</p>
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Recibe el bien y firma primero</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Nombre y Apellido</label>
                                                <SelectorPersona
                                                    valor={funcData.nombre}
                                                    funcionarios={safeFuncionarios}
                                                    onElegir={(f) => setFuncData({ nombre: f.nombre, doc: f.doc || '', cargo: f.cargo || '' })}
                                                    placeholder="Buscar en el padron..."
                                                />
                                                {funcData.nombre.trim() !== '' && (
                                                    <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold ${padronConDatos ? 'text-emerald-600 dark:text-emerald-400' : coincidePadron ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                        <i className={`fa-solid ${padronConDatos ? 'fa-circle-check' : coincidePadron ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-[9px]`}></i>
                                                        {padronConDatos ? 'Datos del padron aplicados' : coincidePadron ? 'En el padron sin CI/cargo' : 'No esta en el padron'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cédula</label>
                                                    <input
                                                        name="funcionarioDoc"
                                                        value={funcData.doc}
                                                        onChange={(e) => setFuncData({...funcData, doc: e.target.value})}
                                                        className={STYLES.input}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cargo</label>
                                                    <input
                                                        name="funcionarioCargo"
                                                        value={funcData.cargo}
                                                        onChange={(e) => setFuncData({...funcData, cargo: e.target.value})}
                                                        className={STYLES.input}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flecha del flujo: solo en mobile, donde van apilados */}
                                    <div className="md:hidden flex items-center gap-2 px-5 py-2 bg-zinc-50 dark:bg-white/[0.02] border-y border-zinc-100 dark:border-white/10">
                                        <i className="fa-solid fa-arrow-down text-[10px] text-zinc-300 dark:text-zinc-600"></i>
                                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">despues firma el jefe inmediato</span>
                                    </div>

                                    {/* Firma 2: jefe inmediato */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black">2</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Jefe inmediato</p>
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Firma despues del funcionario</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Nombre y Apellido</label>
                                                <SelectorPersona
                                                    valor={jefeData.nombre}
                                                    funcionarios={safeFuncionarios}
                                                    onElegir={(f) => setJefeData({ nombre: f.nombre, doc: f.doc || '', cargo: f.cargo || '' })}
                                                    placeholder="Buscar en el padron..."
                                                />
                                                {jefeData.nombre.trim() !== '' && (
                                                    <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold ${jefeConDatos ? 'text-emerald-600 dark:text-emerald-400' : jefeEnPadron ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                        <i className={`fa-solid ${jefeConDatos ? 'fa-circle-check' : jefeEnPadron ? 'fa-triangle-exclamation' : 'fa-circle-info'} text-[9px]`}></i>
                                                        {jefeConDatos ? 'Datos del padron aplicados' : jefeEnPadron ? 'En el padron sin CI/cargo' : 'No esta en el padron'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cédula</label>
                                                    <input
                                                        name="jefeInmediatoDoc"
                                                        value={jefeData.doc}
                                                        onChange={(e) => setJefeData({...jefeData, doc: e.target.value})}
                                                        className={STYLES.input}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cargo</label>
                                                    <input
                                                        name="jefeInmediatoCargo"
                                                        value={jefeData.cargo}
                                                        onChange={(e) => setJefeData({...jefeData, cargo: e.target.value})}
                                                        className={STYLES.input}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Que va a pasar al guardar: conviene que quede claro
                                    antes de confirmar, no despues. */}
                                <div className="px-5 py-3 border-t border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] flex items-start gap-2.5">
                                    <i className="fa-solid fa-circle-info text-zinc-400 text-[11px] mt-0.5 shrink-0"></i>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Al guardar, el acta queda <strong className="font-bold text-zinc-700 dark:text-zinc-300">esperando la firma del funcionario</strong>.
                                        El bien solo se marca con FC-10 cuando ambos firmaron.
                                    </p>
                                </div>
                            </div>
                        </div>
<div id="step-3" className={step === 3 ? "block animate-fade-in" : "hidden"} space-y-4>
                            {/* Datos de la entrega */}
                            <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-white/10">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Datos de la entrega</h3>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Cuándo y dónde se entrega el bien al funcionario responsable.
                                    </p>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Lugar de entrega</label>
                                        <input name="entregadoLugar" required defaultValue={defectoFC('entregadoLugar', (fc10Editing?.entregadoLugar || 'Pilar'))} className={STYLES.input} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Fecha de asignación</label>
                                        <input type="date" name="entregadoFecha" required defaultValue={defectoFC('entregadoFecha', (fc10Editing?.entregadoFecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} tabular-nums`} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Cantidad</label>
                                        <input name="cantidad" required defaultValue={defectoFC('cantidad', (fc10Editing?.cantidad || '1'))} readOnly className={`${STYLES.input} text-zinc-400 dark:text-zinc-500`} />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Estado del bien al entregar</label>
                                        <input name="estadoConservacion" required defaultValue={defectoFC('estadoConservacion', (fc10Editing?.estadoConservacion || fc10TargetBien.estadoConservacion))} className={STYLES.input} />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Observaciones</label>
                                        <input name="observaciones" placeholder="Opcional" defaultValue={defectoFC('observaciones', (fc10Editing?.observaciones))} className={STYLES.input} />
                                    </div>
                                    <input type="hidden" name="valorTotal" value={fc10TargetBien.valorUnitario} />
                                </div>
                            </div>

                            {/* Devolución: solo al editar un acta ya existente. Va
                                aparte y apagada hasta que se marque, porque es una
                                acción mayor (libera el bien) y no debe quedar a
                                la vista como si fuera parte del alta. */}
                            {fc10Editing && (
                                <div className={`rounded-2xl border overflow-hidden transition-colors ${
                                    isReturning
                                        ? 'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/10'
                                        : 'border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card'
                                }`}>
                                    <label className="flex items-center gap-3 px-5 py-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isReturning}
                                            onChange={(e) => setIsReturning(e.target.checked)}
                                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-rose-600 focus:ring-rose-500 focus-visible:outline-none cursor-pointer shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-bold ${isReturning ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                                                Registrar devolución y liberar el bien
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                El funcionario devuelve el bien y queda sin asignar. El acta no se cierra.
                                            </p>
                                        </div>
                                    </label>

                                    {isReturning && (
                                        <div className="px-5 pb-5 pt-4 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500/70 mb-1.5">Lugar</label>
                                                <input name="devolucionLugar" required defaultValue={defectoFC('devolucionLugar', (fc10Editing?.devolucionLugar || 'Pilar'))} className={STYLES.input} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500/70 mb-1.5">Fecha</label>
                                                <input type="date" name="devolucionFecha" required defaultValue={defectoFC('devolucionFecha', (fc10Editing?.devolucionFecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} tabular-nums`} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500/70 mb-1.5">Cargo del receptor</label>
                                                <input name="devolucionCargoReceptor" defaultValue={defectoFC('devolucionCargoReceptor', (fc10Editing?.devolucionCargoReceptor))} className={STYLES.input} />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500/70 mb-1.5">Nombre de quien recibe</label>
                                                <input name="devolucionReceptor" defaultValue={defectoFC('devolucionReceptor', (fc10Editing?.devolucionReceptor))} className={STYLES.input} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <input type="hidden" name="funcionarioNombre" value={funcData.nombre} readOnly />
                        <input type="hidden" name="jefeInmediatoNombre" value={jefeData.nombre} readOnly />
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card shrink-0 z-10">
                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hidden sm:block">Paso {step} de 3</span>
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
