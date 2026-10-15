import React, { useState, useEffect, useMemo, useRef } from 'react';
import { normalizeStr } from '../../utils/helpers';

// Gestor de dependencias v3: maestro-detalle con búsqueda unificada.
// Mejoras v3:
// - Los selects nativos se reemplazan por un combo con buscador (el nativo
//   con 215 opciones era lento, se recorría a ojo y encima ocultaba gente
//   con un slice(0, 100) silencioso).
// - La lista izquierda muestra el nombre completo (antes se truncaba con
//   ellipsis: "Facultad de Ciencias Agropecua...").
// - Los filtros pesados se memoizan para no recalcular en cada tecla.
export default function DependenciasModal({
  isOpen, onClose, dependencias, detectadas, conteos,
  onSave, onDelete, onFusionar, isSaving,
  dependenciaActual, onVerPadron,
  ubicacionesList, conteosUbicacion, funcionarios,
  onGuardarUbicacion, onEliminarUbicacion, onAsignarFuncionario,
  STYLES
}) {
  const [busqueda, setBusqueda] = useState('');
  const [selId, setSelId] = useState(null);
  const [selDetectada, setSelDetectada] = useState(null);
  const [editDepNombre, setEditDepNombre] = useState('');
  const [editandoDep, setEditandoDep] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const [nuevaUbic, setNuevaUbicacion] = useState('');
  const [editUbicId, setEditUbicId] = useState(null);
  const [editUbicNombre, setEditUbicNombre] = useState('');
  const [buscaFunc, setBuscaFunc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setEditandoDep(false);
      setNuevo('');
      setNuevaUbicacion('');
      setEditUbicId(null);
      setBuscaFunc('');
      const actual = dependencias.find(d => d.nombre === dependenciaActual);
      setSelId(actual ? actual.id : (dependencias[0]?.id || null));
      setSelDetectada(null);
    }
  }, [isOpen]);

  const q = useMemo(() => normalizeStr(busqueda), [busqueda]);
  const qfBusca = useMemo(() => normalizeStr(buscaFunc), [buscaFunc]);

  const depsFiltradas = useMemo(
    () => dependencias.filter(d => !q || normalizeStr(d.nombre).includes(q)),
    [dependencias, q]
  );
  const detFiltradas = useMemo(
    () => detectadas.filter(d => !q || normalizeStr(d.nombre).includes(q)),
    [detectadas, q]
  );
  const depSel = useMemo(
    () => dependencias.find(d => d.id === selId) || null,
    [dependencias, selId]
  );
  const detSel = useMemo(
    () => (selDetectada ? detectadas.find(d => d.nombre === selDetectada) : null),
    [detectadas, selDetectada]
  );

  const normDepSel = depSel ? normalizeStr(depSel.nombre) : '';

  // Mapa ubicacion -> funcionarios de la dependencia seleccionada (un solo
  // recorrido en vez de un filter por cada tarjeta de departamento).
  const funcsPorUbic = useMemo(() => {
    const mapa = new Map();
    if (!depSel) return mapa;
    for (const f of funcionarios) {
      if (normalizeStr(f.dependencia || '') !== normDepSel) continue;
      const key = normalizeStr(f.ubicacion || '');
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key).push(f);
    }
    return mapa;
  }, [funcionarios, depSel, normDepSel]);

  const funcsDeSel = useMemo(() => {
    if (!depSel) return [];
    return funcionarios.filter(f => normalizeStr(f.dependencia || '') === normDepSel);
  }, [funcionarios, depSel, normDepSel]);

  const ubicsDeSel = useMemo(() => {
    if (!depSel) return [];
    return ubicacionesList.filter(u => normalizeStr(u.dependencia || '') === normDepSel);
  }, [ubicacionesList, depSel, normDepSel]);

  const ubicsFiltradas = useMemo(() => {
    if (!depSel) return [];
    return ubicsDeSel.filter(u => {
      if (!q) return true;
      if (normalizeStr(u.nombre).includes(q)) return true;
      const enUbic = funcsPorUbic.get(normalizeStr(u.nombre)) || [];
      return enUbic.some(f => normalizeStr(`${f.nombre || ''} ${f.cedula || ''}`).includes(q));
    });
  }, [ubicsDeSel, funcsPorUbic, depSel, q]);

  const funcsFiltrados = useMemo(
    () => funcsDeSel.filter(f =>
      !qfBusca || normalizeStr(`${f.nombre || ''} ${f.cedula || ''} ${f.ubicacion || ''}`).includes(qfBusca)
    ),
    [funcsDeSel, qfBusca]
  );

  if (!isOpen) return null;

  const ItemDep = ({ d, detectada }) => {
    const activo = !detectada && selId === d.id && !selDetectada;
    const activoDet = detectada && selDetectada === d.nombre;
    return (
      <button
        onClick={() => {
          if (detectada) { setSelDetectada(d.nombre); setSelId(null); }
          else { setSelId(d.id); setSelDetectada(null); }
        }}
        title={d.nombre}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          activo || activoDet
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
        }`}
      >
        <span className={`flex h-2 w-2 shrink-0 rounded-full ${detectada ? 'bg-amber-500' : (activo || activoDet ? 'bg-emerald-400' : 'bg-zinc-300 dark:bg-zinc-600')}`}></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold leading-snug text-balance">{d.nombre}</span>
          <span className={`block text-[10px] tabular-nums mt-0.5 ${(activo || activoDet) ? 'opacity-80' : 'text-zinc-400'}`}>
            {detectada ? `${d.bienes + d.funcionarios} registros por fusionar` : `${(conteos[d.nombre]?.bienes || 0)} bienes · ${(conteos[d.nombre]?.funcionarios || 0)} func.`}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + " max-w-4xl !max-h-[88dvh]"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
              <i className="fa-solid fa-building-columns text-base"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">Dependencias y departamentos</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 hidden sm:block">Elige a la izquierda · gestiona a la derecha</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative hidden md:block">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
              <input
                type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar dependencia, departamento o funcionario..."
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 h-10 pl-10 pr-3 text-[13px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 w-64"
              />
            </div>
            <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        <div className="md:hidden px-6 pt-4 shrink-0">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
            <input
              type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 h-10 pl-10 pr-3 text-[13px] font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/80 p-3 space-y-1 overflow-y-auto custom-scrollbar max-h-48 md:max-h-none">
            {depsFiltradas.map(d => <ItemDep key={d.id} d={d} />)}
            {detFiltradas.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">Por fusionar ({detFiltradas.length})</p>
                {detFiltradas.map(d => <ItemDep key={'det-' + d.nombre} d={d} detectada />)}
              </>
            )}
            {(depsFiltradas.length + detFiltradas.length) === 0 && (
              <p className="p-4 text-center text-xs font-semibold text-zinc-400">Sin coincidencias.</p>
            )}
            <div className="px-1 pt-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text" value={nuevo} onChange={(e) => setNuevo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
                  placeholder="Nueva dependencia..."
                  className="flex-1 min-w-0 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent px-3 h-9 text-xs font-medium outline-none focus:border-brand-primary"
                />
                <button
                  onClick={() => { if (nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
                  disabled={isSaving || !nuevo.trim()}
                  title="Agregar dependencia"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0 disabled:opacity-40"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-5 sm:p-6">
            {detSel ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 mb-2">Nombre detectado en datos</p>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">{detSel.nombre}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">{detSel.bienes} bienes · {detSel.funcionarios} funcionarios con este nombre (posible error de carga).</p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) onFusionar(detSel.nombre, e.target.value); }}
                    className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer max-w-full"
                  >
                    <option value="">Fusionar en...</option>
                    {dependencias.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
                  </select>
                  <button
                    onClick={() => onSave(null, detSel.nombre)}
                    title="Agregar como dependencia oficial"
                    className="h-10 px-4 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Agregar como oficial
                  </button>
                </div>
              </div>
            ) : depSel ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {editandoDep ? (
                      <span className="flex items-center gap-2">
                        <input
                          type="text" value={editDepNombre} autoFocus
                          onChange={(e) => setEditDepNombre(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editDepNombre.trim()) { onSave(depSel.id, editDepNombre.trim()); setEditandoDep(false); }
                            if (e.key === 'Escape') setEditandoDep(false);
                          }}
                          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 h-9 text-sm font-bold outline-none focus:border-brand-primary min-w-0"
                        />
                        <button onClick={() => { if (editDepNombre.trim()) { onSave(depSel.id, editDepNombre.trim()); setEditandoDep(false); } }} title="Guardar" className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0">
                          <i className="fa-solid fa-check text-xs"></i>
                        </button>
                      </span>
                    ) : (
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight text-balance" title={depSel.nombre}>{depSel.nombre}</h3>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">
                      {(conteos[depSel.nombre]?.bienes || 0)} bienes · {(conteos[depSel.nombre]?.funcionarios || 0)} funcionarios · {ubicsDeSel.length} departamentos
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => onVerPadron(depSel.nombre)} title="Ver padrón y bienes" className="flex h-9 px-3.5 items-center gap-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer">
                      <i className="fa-solid fa-users"></i><span className="hidden sm:inline">Padrón</span>
                    </button>
                    <button onClick={() => { setEditandoDep(true); setEditDepNombre(depSel.nombre); }} title="Renombrar (actualiza todo)" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer">
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onClick={() => onDelete(depSel.id, depSel.nombre)} title="Eliminar (solo si está vacía)" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Departamentos ({ubicsFiltradas.length})</p>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <input
                      type="text" value={nuevaUbic} onChange={(e) => setNuevaUbicacion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), depSel.nombre); setNuevaUbicacion(''); } }}
                      placeholder={`Nuevo departamento en ${depSel.nombre}...`}
                      className="flex-1 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent px-3 h-10 text-[13px] font-medium outline-none focus:border-brand-primary placeholder:text-zinc-400"
                    />
                    <button
                      onClick={() => { if (nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), depSel.nombre); setNuevaUbicacion(''); } }}
                      disabled={isSaving || !nuevaUbic.trim()}
                      title="Agregar departamento"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ubicsFiltradas.map(u => (
                      <TarjetaDepartamento
                        key={u.id}
                        u={u}
                        asignados={funcsPorUbic.get(normalizeStr(u.nombre)) || []}
                        candidatos={funcsDeSel}
                        onAsignarFuncionario={onAsignarFuncionario}
                        onGuardarUbicacion={onGuardarUbicacion}
                        onEliminarUbicacion={onEliminarUbicacion}
                        depNombre={depSel.nombre}
                        editando={editUbicId === u.id}
                        editNombre={editUbicNombre}
                        onEditNombre={setEditUbicNombre}
                        onEmpezarEditar={() => { setEditUbicId(u.id); setEditUbicNombre(u.nombre); }}
                        onTerminarEditar={() => setEditUbicId(null)}
                      />
                    ))}
                    {ubicsFiltradas.length === 0 && (
                      <p className="text-xs text-zinc-400 font-medium text-center py-3">Sin departamentos aquí. Agrega el primero arriba.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-2.5">
                    Funcionarios ({funcsDeSel.length})
                  </p>
                  <div className="relative mb-2.5">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                    <input
                      type="text" value={buscaFunc} onChange={(e) => setBuscaFunc(e.target.value)}
                      placeholder="Buscar funcionario por nombre o cédula..."
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 h-10 pl-10 pr-3 text-[13px] font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
                    {funcsFiltrados.slice(0, 60).map(f => (
                      <div key={f.id} className="flex items-center gap-2.5 px-3.5 py-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-xs">
                          {(f.nombre || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={f.nombre}>{f.nombre}</span>
                          <span className="block text-[11px] text-zinc-400 truncate tabular-nums">CI {f.cedula || 'S/C'}{f.ubicacion ? ` · ${f.ubicacion}` : ' · Sin ubicación'}</span>
                        </span>
                        <ComboUbicacion
                          valor={f.ubicacion || ''}
                          ubicaciones={ubicsDeSel}
                          onElegir={(nombreUbic) => onAsignarFuncionario(f.id, nombreUbic)}
                          titulo="Cambiar departamento"
                          compacto
                        />
                      </div>
                    ))}
                    {funcsFiltrados.length > 60 && (
                      <p className="px-3.5 py-2 text-[11px] font-semibold text-zinc-400 text-center">
                        Mostrando 60 de {funcsFiltrados.length}. Afina la búsqueda para ver más.
                      </p>
                    )}
                    {funcsFiltrados.length === 0 && (
                      <p className="px-3.5 py-4 text-xs font-semibold text-zinc-400 text-center">Sin coincidencias.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                <i className="fa-solid fa-building-columns text-3xl text-zinc-200 dark:text-zinc-700 mb-3"></i>
                <p className="text-sm font-bold text-zinc-500">Elige una dependencia a la izquierda</p>
                <p className="text-xs text-zinc-400 mt-1">Verás sus departamentos y funcionarios para gestionarlos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// Tarjeta de departamento memoizada: solo se re-renderiza si cambian sus
// propios datos, no cuando se escribe en otro buscador.
const TarjetaDepartamento = React.memo(function TarjetaDepartamento({
  u, asignados, candidatos, onAsignarFuncionario,
  onGuardarUbicacion, onEliminarUbicacion, depNombre,
  editando, editNombre, onEditNombre, onEmpezarEditar, onTerminarEditar
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/10 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        {editando ? (
          <>
            <input
              type="text" value={editNombre} autoFocus
              onChange={(e) => onEditNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editNombre.trim()) { onGuardarUbicacion(u.id, editNombre.trim(), depNombre); onTerminarEditar(); }
                if (e.key === 'Escape') onTerminarEditar();
              }}
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 h-8 text-xs font-medium outline-none focus:border-brand-primary"
            />
            <button onClick={() => { if (editNombre.trim()) { onGuardarUbicacion(u.id, editNombre.trim(), depNombre); onTerminarEditar(); } }} title="Guardar" className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer shrink-0">
              <i className="fa-solid fa-check text-[10px]"></i>
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 min-w-0 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 leading-snug text-balance" title={u.nombre}>{u.nombre}</span>
            <span className="text-[10px] tabular-nums text-zinc-400 shrink-0">{asignados.length} func.</span>
            <button onClick={onEmpezarEditar} title="Renombrar" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/70 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer shrink-0">
              <i className="fa-solid fa-pen text-[10px]"></i>
            </button>
            <button onClick={() => onEliminarUbicacion(u.id, u.nombre)} title="Eliminar" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer shrink-0">
              <i className="fa-solid fa-trash-can text-[10px]"></i>
            </button>
          </>
        )}
      </div>
      {asignados.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {asignados.map(f => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-white/10 border border-zinc-200/70 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300" title={`${f.nombre} · CI ${f.cedula || 'S/C'}`}>
              <span className="max-w-[180px] truncate">{f.nombre}</span>
              <button onClick={() => onAsignarFuncionario(f.id, '')} title={`Quitar a ${f.nombre} de ${u.nombre}`} className="text-zinc-400 hover:text-rose-500 cursor-pointer shrink-0">
                <i className="fa-solid fa-xmark text-[9px]"></i>
              </button>
            </span>
          ))}
        </div>
      )}
      <ComboFuncionarios
        candidatos={candidatos}
        excluirUbicacion={u.nombre}
        onElegir={(id) => onAsignarFuncionario(id, u.nombre)}
        titulo={`Asignar funcionario a ${u.nombre}`}
      />
    </div>
  );
});

// Combo con buscador para asignar funcionarios: reemplaza al select nativo.
// Filtra por nombre o cédula (sin tildes) y muestra ubicación actual.
function ComboFuncionarios({ candidatos, excluirUbicacion, onElegir, titulo }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const normExcluir = normalizeStr(excluirUbicacion || '');
  const q = normalizeStr(texto);
  const lista = useMemo(() => {
    const base = candidatos.filter(f => normalizeStr(f.ubicacion || '') !== normExcluir);
    if (!q) return base;
    return base.filter(f => normalizeStr(`${f.nombre || ''} ${f.cedula || ''}`).includes(q));
  }, [candidatos, normExcluir, q]);

  return (
    <div ref={cajaRef} className="mt-1.5">
      {!abierto ? (
        <button
          onClick={() => { setTexto(''); setAbierto(true); }}
          title={titulo}
          className="w-full h-8 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:border-zinc-400 text-left outline-none cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <i className="fa-solid fa-plus mr-1.5 text-[9px]"></i>
          Asignar funcionario ({candidatos.filter(f => normalizeStr(f.ubicacion || '') !== normExcluir).length} disponibles)...
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] pointer-events-none"></i>
            <input
              autoFocus
              type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAbierto(false);
                if (e.key === 'Enter' && lista.length > 0) { onElegir(lista[0].id); setAbierto(false); }
              }}
              placeholder="Escribe para buscar por nombre o cédula..."
              className="w-full h-8 pl-8 pr-2 text-[11px] font-semibold outline-none bg-transparent text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>
          <div className="max-h-44 overflow-y-auto custom-scrollbar border-t border-zinc-100 dark:border-white/10">
            {lista.slice(0, 50).map(f => (
              <button
                key={f.id}
                onClick={() => { onElegir(f.id); setAbierto(false); }}
                title={`${f.nombre} · CI ${f.cedula || 'S/C'}`}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors cursor-pointer"
              >
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-700 dark:text-zinc-200">{f.nombre}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-zinc-400">CI {f.cedula || 'S/C'}</span>
              </button>
            ))}
            {lista.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] font-semibold text-zinc-400">Sin coincidencias.</p>
            )}
            {lista.length > 50 && (
              <p className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 border-t border-zinc-100 dark:border-white/10">
                {lista.length - 50} más… afina la búsqueda.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Combo con buscador para cambiar el departamento de un funcionario.
function ComboUbicacion({ valor, ubicaciones, onElegir, titulo, compacto }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const q = normalizeStr(texto);
  const lista = useMemo(() => {
    if (!q) return ubicaciones;
    return ubicaciones.filter(u => normalizeStr(u.nombre).includes(q));
  }, [ubicaciones, q]);
  const actual = ubicaciones.find(u => u.nombre === valor);

  return (
    <div ref={cajaRef} className={`relative shrink-0 ${compacto ? 'w-[170px]' : 'w-full'}`}>
      <button
        onClick={() => { setTexto(''); setAbierto(v => !v); }}
        title={titulo}
        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer flex items-center gap-1.5 hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <span className="flex-1 min-w-0 truncate text-left">{actual ? actual.nombre : 'Sin ubicación'}</span>
        <i className="fa-solid fa-chevron-down text-[9px] text-zinc-400 shrink-0"></i>
      </button>
      {abierto && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
          <input
            autoFocus
            type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setAbierto(false); }}
            placeholder="Buscar departamento..."
            className="w-full h-8 px-2.5 text-[11px] font-semibold outline-none bg-transparent text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 placeholder:font-normal"
          />
          <div className="max-h-44 overflow-y-auto custom-scrollbar border-t border-zinc-100 dark:border-white/10">
            <button
              onClick={() => { onElegir(''); setAbierto(false); }}
              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer"
            >
              Sin ubicación
            </button>
            {lista.map(u => (
              <button
                key={u.id}
                onClick={() => { onElegir(u.nombre); setAbierto(false); }}
                title={u.nombre}
                className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold truncate cursor-pointer hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 ${u.nombre === valor ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-700 dark:text-zinc-200'}`}
              >
                {u.nombre}
              </button>
            ))}
            {lista.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] font-semibold text-zinc-400">Sin coincidencias.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
