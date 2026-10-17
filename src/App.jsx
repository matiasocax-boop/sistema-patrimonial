import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { lazyConReintento } from './utils/lazyConReintento';
import SkeletonLoader from './components/SkeletonLoader';
import { STYLES, DEPENDENCIAS_UNP, ESTADOS_CONSERVACION, ORIGENES_FC04, INACTIVITY_LIMIT_MS, PENDIENTE_LABELS, FORMATO_PDF } from './constants/appConstants';
import SimpleBar from './components/SimpleBar';
import FiltroCombo from './components/FiltroCombo';
import AnimatedNumber from './components/AnimatedNumber';
import CommandPalette from './components/CommandPalette';
import AtajosModal from './components/modals/AtajosModal';
import TourGuiado from './components/TourGuiado';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
// Modales de apertura bajo demanda: carga diferida para acelerar el arranque
import localforage from 'localforage';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';
// Modales pesados: carga diferida para acelerar el arranque
import { 
    formatCurrency, formatCI, generateId, parseDateInfo, 
    formatDateText, getEstadoAbbr, normalizeStr, matchSearchWords, matchBienSearch, getPlaceholderLogo,
    convertirImagenABase64, getLogoPorDependencia, comprimirImagen, colorPorDependencia 
} from './utils/helpers';
import { useIdioma } from './utils/i18n';
import { generateSimpleQR, generateProfessionalLabelPNG, buildFC10PDFDoc, buildActaAuditoriaPDF } from './utils/pdfGenerators';
import { conSello, debeResyncTotal, fusionarBienes, ahoraISO } from './services/syncBienes';
import { mapearFilasBienes } from './utils/csvBienes';
import { useToasts } from './hooks/useToasts';
import { useAuditoria } from './hooks/useAuditoria';
import { usePdfHandlers } from './hooks/usePdfHandlers';
import { useFuncionarios } from './hooks/useFuncionarios';
import { useAuthSession } from './hooks/useAuthSession';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useFcModals } from './hooks/useFcModals';
import AppModals from './components/AppModals';
import { useInventarioFiltros, ITEMS_POR_PAGINA } from './hooks/useInventarioFiltros';
import { numeroALetras } from './utils/numeroLetras';
import { extraerCodigoQR } from './utils/qr';
import { normalizarBien, tieneValor } from './utils/bienPublico';
import MaintenanceScreen from './components/MaintenanceScreen';
import AyudaView from './views/AyudaView';
import ResumenView from './views/ResumenView';
import UsuariosView from './views/UsuariosView';
import AnunciosView from './views/AnunciosView';
import Fc04View from './views/Fc04View';
import Fc10View from './views/Fc10View';
import Fc11View from './views/Fc11View';
import FuncionariosView from './views/FuncionariosView';
import AprobacionesView from './views/AprobacionesView';
import AuditoriaView from './views/AuditoriaView';
import DashboardView from './views/DashboardView';
import InventarioView from './views/InventarioView';
import { processOfflineQueue, enqueueOfflineAction } from './services/offlineSyncService';
import { registrarAuditoria } from './services/auditService';
// Nota: papaparse y qrcode se importan dinámicamente donde se usan para no
// inflar el bundle inicial (ver executeProcessBienesCSV y pdfGenerators).
// Nota: STYLES y constantes globales viven en constants/appConstants
// (Fase 0 del split de este monolito).

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const publicBienId = urlParams.get('id') || urlParams.get('bienId');
  
  const [publicBienData, setPublicBienData] = useState(null);
  const [publicFotoAmpliada, setPublicFotoAmpliada] = useState(null);
  const [publicDescExpandida, setPublicDescExpandida] = useState(false);
  const { toasts, addToast, quitarToast } = useToasts();
  // Sesión y autenticación: hook extraído (Fase 6). La UI usa los mismos nombres.
  const {
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    isAdmin, esDesarrollador,
    loginUser, setLoginUser, loginPass, setLoginPass,
    showPassword, setShowPassword, loginError, setLoginError,
    isProcessing, setIsProcessing,
    dependenciaActual, setDependenciaActual,
    showLogoutConfirm, setShowLogoutConfirm,
    mantenimiento, setMantenimiento,
    isMantenimientoModalOpen, setIsMantenimientoModalOpen, isSavingMant,
    mostrarLoginDev, setMostrarLoginDev, mantBypass,
    handleLogin, handleLogout, saveMantenimiento
  } = useAuthSession({ notify: addToast });
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('logoOficial'));
  
  
  const [darkMode, setDarkMode] = useState(() => { const saved = localStorage.getItem('theme'); if (saved !== null) return saved === 'dark'; return true; });
  // Persistir el tema en cada cambio (antes solo se guardaba desde el login y se perdía al refrescar)
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  // Arranque limpio: permite un futuro auto-reintento de chunks ante deploys intermedios
  useEffect(() => {
    try { sessionStorage.removeItem('chunk_reintentado'); } catch (e) {}
  }, []);
  // FORMATO_PDF vive en constants/appConstants (se usa en usePdfHandlers).
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  // Modo mantenimiento: aviso global que bloquea el uso para todos
  // Aviso "Sistema Actualizado": una vez por versión, para todo usuario autenticado
  useEffect(() => {
    try {
      const vista = localStorage.getItem('unp_last_version');
      const v = mantenimiento?.ultima_version;
      if (v && v !== vista && isAuthenticated && !mantenimiento?.en_mantenimiento) setShowChangelog(true);
    } catch (e) {}
  }, [mantenimiento, isAuthenticated]);

  const [showDependenciaConfirm, setShowDependenciaConfirm] = useState(false);
  const [pendingDependencia, setPendingDependencia] = useState('');
  const [bienes, setBienes] = useState([]);
 
  // Catálogo de dependencias (tabla; respaldo: lista oficial fija)
  const [dependenciasList, setDependenciasList] = useState([]);
  const [isDependenciasModalOpen, setIsDependenciasModalOpen] = useState(false);
  const [isSavingDep, setIsSavingDep] = useState(false);
  const fetchDependencias = async () => {
    try {
      const { data, error } = await supabase.from('dependencias').select('*').order('nombre');
      if (!error && data) setDependenciasList(data);
    } catch (e) {}
  };
  useEffect(() => { if (isAuthenticated) fetchDependencias(); }, [isAuthenticated]);
  const todasDependencias = useMemo(() => {
    const deTabla = dependenciasList.filter(d => d.activa !== false).map(d => d.nombre);
    return deTabla.length > 0 ? deTabla : DEPENDENCIAS_UNP;
  }, [dependenciasList]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // Ficha 360 del bien: timeline de trazabilidad
  








  const [dbError, setDbError] = useState(false);

  const fileInputFuncionariosRef = useRef(null);

  const [fc10List, setFc10List] = useState([]); 
  const [fc11List, setFc11List] = useState([]); 
  const [fc04List, setFc04List] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]); 
  const [funcionariosPadron, setFuncionariosPadron] = useState([]); 
  const [estructurasDB, setEstructurasDB] = useState([]);
  // Ficha 360: la lee el realtime (H5) y el memo de abajo; vive en App.
  const [fichaBien, setFichaBien] = useState(null);
  const [eventosAuditFicha, setEventosAuditFicha] = useState([]);
  const eventosFicha = useMemo(() => {
    if (!fichaBien) return [];
    const ev = [];
    const fmt = (f) => { try { return formatDateText(f) || f; } catch (e) { return f; } };
    if (fichaBien.fechaAdquisicion) {
      ev.push({ fecha: fichaBien.fechaAdquisicion, fechaFmt: fmt(fichaBien.fechaAdquisicion), tipo: 'alta', titulo: 'Alta en inventario', detalle: `Adquirido el ${fmt(fichaBien.fechaAdquisicion)}` });
    }
    fc10List.filter(fc => fc.bienId === fichaBien.id).forEach(fc => {
      const f = fc.entregadoFecha || fc.fechaGeneracion;
      ev.push({
        fecha: f || '', fechaFmt: f ? fmt(f) : 'Sin fecha', tipo: 'asignacion',
        titulo: `Acta FC-10 · ${fc.funcionarioNombre || 'Sin responsable'}`,
        detalle: fc.devolucionFecha ? `Devuelto el ${fmt(fc.devolucionFecha)}` : `Entregado en ${fc.entregadoLugar || fc.dependencia || ''}`.trim()
      });
    });
    fc11List.filter(fc => fc.bienId === fichaBien.id).forEach(fc => {
      const rem = fc.dependenciaRemitente || fc.remitente || '';
      const dest = fc.dependenciaDestinataria || fc.destinatario || '';
      ev.push({
        fecha: fc.fecha || '', fechaFmt: fc.fecha ? fmt(fc.fecha) : 'Sin fecha', tipo: 'traslado',
        titulo: `Traslado ${rem} → ${dest}`,
        detalle: fc.motivo || fc.tipoRegistro || ''
      });
    });
    eventosAuditFicha.forEach(row => {
      const a = String(row.accion || '').toUpperCase();
      const tipo = a.includes('CREA') || a.includes('ALTA') ? 'alta' : a.includes('BAJA') || a.includes('ELIMINA') ? 'baja' : a.includes('MODIF') ? 'modificacion' : a.includes('FC10') || a.includes('ASIGNA') ? 'asignacion' : a.includes('FC11') || a.includes('TRASLADO') ? 'traslado' : 'otro';
      let detalle = '';
      try {
        const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
        if (m && typeof m === 'object') {
          if (m.cambios && m.cambios.anterior && m.cambios.nuevo) {
            const keys = Object.keys(m.cambios.nuevo).filter(k => JSON.stringify(m.cambios.nuevo[k]) !== JSON.stringify(m.cambios.anterior[k]));
            detalle = keys.length ? `Campos: ${keys.slice(0, 6).join(', ')}${keys.length > 6 ? '…' : ''}` : 'Registro actualizado';
          } else {
            const bits = [];
            if (m.solicitante) bits.push(`Por: ${m.solicitante}`);
            if (m.motivo) bits.push(`Motivo: ${m.motivo}`);
            detalle = bits.join(' · ');
          }
        } else if (m) detalle = String(m);
      } catch (e) { detalle = String(row.mensaje || ''); }
      ev.push({ fecha: row.fecha || '', fechaFmt: row.fecha ? fmt(String(row.fecha).split('T')[0]) : 'Sin fecha', tipo, titulo: row.titulo || row.accion || 'Evento', detalle });
    });
    return ev.sort((x, y) => String(y.fecha || '').localeCompare(String(x.fecha || '')));
  }, [fichaBien, eventosAuditFicha, fc10List, fc11List]);
  // Fotos del bien: galería en ficha (máx. 5, Storage + URLs en el registro)
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const subirFotoBien = async (file) => {
    if (!fichaBien || !file) return;
    if (!file.type.startsWith('image/')) return addToast('El archivo debe ser una imagen.', 'warning');
    setSubiendoFoto(true);
    try {
      const blob = await comprimirImagen(file);
      const nombre = `${fichaBien.id}/${generateId()}.jpg`;
      const { error: upErr } = await supabase.storage.from('fotos-bienes').upload(nombre, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('fotos-bienes').getPublicUrl(nombre);
      const fotos = [...(fichaBien.fotos || []), { url: pub.publicUrl, ruta: nombre, fecha: new Date().toISOString(), usuario: currentUser?.username || 'Usuario' }].slice(-5);
      // Si se supera el tope, borrar la más vieja del storage
      const sobrantes = (fichaBien.fotos || []).filter(f => !fotos.includes(f));
      if (sobrantes.length > 0) {
        try { await supabase.storage.from('fotos-bienes').remove(sobrantes.map(f => f.ruta).filter(Boolean)); } catch (e) {}
      }
      const actualizado = { ...fichaBien, fotos };
      const { error: dbErr } = await supabase.from('bens').update(conSello({ data: actualizado })).eq('id', fichaBien.id);
      if (dbErr) throw dbErr;
      // Releer del servidor como fuente de verdad (la galería muestra exactamente lo guardado)
      let final = actualizado;
      try {
        const { data: releido, error: readErr } = await supabase.from('bens').select('*').eq('id', fichaBien.id).maybeSingle();
        if (!readErr && releido) {
          const d = typeof releido.data === 'string' ? JSON.parse(releido.data) : (releido.data || {});
          final = { id: releido.id, ...d };
        }
      } catch (e) {}
      setBienes(prev => prev.map(b => (b.id === fichaBien.id ? final : b)));
      setFichaBien(final);
      const kb = Math.round(blob.size / 1024);
      addToast(`Foto agregada (${kb} KB).`, 'success');
    } catch (e) {
      addToast('No se pudo subir la foto. Verifica el bucket fotos-bienes en Supabase.', 'error');
    } finally {
      setSubiendoFoto(false);
    }
  };
  const eliminarFotoBien = async (foto) => {
    if (!fichaBien || !foto) return;
    try {
      if (foto.ruta) {
        try { await supabase.storage.from('fotos-bienes').remove([foto.ruta]); } catch (e) {}
      }
      const actualizado = { ...fichaBien, fotos: (fichaBien.fotos || []).filter(f => f.url !== foto.url) };
      const { error } = await supabase.from('bens').update(conSello({ data: actualizado })).eq('id', fichaBien.id);
      if (error) throw error;
      setBienes(prev => prev.map(b => (b.id === fichaBien.id ? actualizado : b)));
      setFichaBien(actualizado);
      addToast('Foto eliminada.', 'success');
    } catch (e) {
      addToast('No se pudo eliminar la foto.', 'error');
    }
  };

  // Filtros/búsqueda/paginación del inventario: hook extraído (Fase 3).
  // La UI usa los mismos nombres vía desestructuración.
  const {
    searchInput, setSearchInput, searchTerm, setSearchTerm, debouncedSearchTerm,
    orden, setOrden, alternarOrden,
    filtroFuncionario, setFiltroFuncionario, filtroUbicacion, setFiltroUbicacion,
    filtroAnio, setFiltroAnio, filtroMes, setFiltroMes,
    filtroSubcuenta, setFiltroSubcuenta, filtroAnalitico1, setFiltroAnalitico1,
    filtroAnalitico2, setFiltroAnalitico2, filtroQR, setFiltroQR,
    filtroFC10, setFiltroFC10, filtroEstado, setFiltroEstado,
    filtroPendiente, setFiltroPendiente, currentPage, setCurrentPage,
    clearAllFilters, hasFilters,
    vistasGuardadas, nombreVista, setNombreVista, mostrarGuardarVista, setMostrarGuardarVista,
    guardarVistaActual, aplicarVista, eliminarVista,
    funcionariosUnicos, ubicacionesUnicas, aniosUnicos,
    subcuentasUnicas, analiticos1Unicos, analiticos2Unicos,
    stats, pendientes, filteredBienes, paginatedBienes, itemsPaginados, totalPages,
    itemsPorPagina, cambiarPaginaTam, seleccionados, toggleSeleccion, limpiarSeleccion,
    vistaInv, cambiarVistaInv
  } = useInventarioFiltros({ bienes, dependenciaActual, fc10List, username: currentUser?.username, notify: addToast });
  // Sugerencias para autocompletado (memoizado: evita refiltrar miles de bienes en cada render)
  const sugerenciasBienesDep = useMemo(
    () => bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual)),
    [bienes, dependenciaActual]
  );
  const padronDep = useMemo(
    () => funcionariosPadron.filter(f => f.dependencia === dependenciaActual),
    [funcionariosPadron, dependenciaActual]
  );
  // Catálogo de ubicaciones por dependencia (del organigrama oficial)
  const [ubicacionesList, setUbicacionesList] = useState([]);
  const [isUbicacionesModalOpen, setIsUbicacionesModalOpen] = useState(false);
  const [isSavingUbicacion, setIsSavingUbicacion] = useState(false);
  const fetchUbicaciones = async () => {
    try {
      const { data, error } = await supabase.from('ubicaciones').select('*').order('nombre');
      if (!error && data) setUbicacionesList(data);
    } catch (e) {}
  };
  useEffect(() => { if (isAuthenticated) fetchUbicaciones(); }, [isAuthenticated]);
  const ubicacionesDep = useMemo(
    () => ubicacionesList.filter(u => u.dependencia === dependenciaActual).map(u => u.nombre),
    [ubicacionesList, dependenciaActual]
  );
  const conteosUbicacion = useMemo(() => {
    const mapa = {};
    ubicacionesDep.forEach(n => { mapa[n] = { bienes: 0, funcionarios: 0 }; });
    bienes.filter(b => b.dependencia === dependenciaActual).forEach(b => {
      const hit = ubicacionesDep.find(n => normalizeStr(n) === normalizeStr(b.ubicacion || ''));
      if (hit) mapa[hit].bienes++;
    });
    funcionariosPadron.filter(f => f.dependencia === dependenciaActual).forEach(f => {
      const hit = ubicacionesDep.find(n => normalizeStr(n) === normalizeStr(f.ubicacion || ''));
      if (hit) mapa[hit].funcionarios++;
    });
    return mapa;
  }, [ubicacionesDep, bienes, funcionariosPadron, dependenciaActual]);
  // Dependencias detectadas en los datos que no están en el catálogo (errores de carga, nombres viejos)
  const dependenciasDetectadas = useMemo(() => {
    const oficiales = new Set(todasDependencias.map(d => normalizeStr(d)));
    const mapa = new Map();
    const contar = (dep, tipo) => {
      const nombre = String(dep || '').trim();
      if (!nombre || oficiales.has(normalizeStr(nombre))) return;
      if (!mapa.has(nombre)) mapa.set(nombre, { nombre, bienes: 0, funcionarios: 0 });
      mapa.get(nombre)[tipo]++;
    };
    bienes.forEach(b => contar(b.dependencia, 'bienes'));
    funcionariosPadron.forEach(f => contar(f.dependencia, 'funcionarios'));
    return [...mapa.values()].sort((a, b) => (b.bienes + b.funcionarios) - (a.bienes + a.funcionarios));
  }, [bienes, funcionariosPadron, todasDependencias]);
  const conteosDependencia = useMemo(() => {
    const mapa = {};
    todasDependencias.forEach(n => { mapa[n] = { bienes: 0, funcionarios: 0, ubicaciones: 0 }; });
    bienes.forEach(b => {
      const hit = todasDependencias.find(n => normalizeStr(n) === normalizeStr(b.dependencia || ''));
      if (hit) mapa[hit].bienes++;
    });
    funcionariosPadron.forEach(f => {
      const hit = todasDependencias.find(n => normalizeStr(n) === normalizeStr(f.dependencia || ''));
      if (hit) mapa[hit].funcionarios++;
    });
    ubicacionesList.forEach(u => {
      if (u.dependencia && mapa[u.dependencia]) mapa[u.dependencia].ubicaciones++;
    });
    return mapa;
  }, [todasDependencias, bienes, funcionariosPadron, ubicacionesList]);
  const guardarUbicacion = async (id, nombre, dependencia = dependenciaActual) => {
    setIsSavingUbicacion(true);
    try {
      if (!id) {
        const row = { id: generateId(), nombre, dependencia };
        const { error } = await supabase.from('ubicaciones').insert([row]);
        if (error) throw error;
        setUbicacionesList(prev => [...prev, row].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))));
        addToast(`Ubicación "${nombre}" agregada.`, 'success');
      } else {
        const anterior = ubicacionesList.find(u => u.id === id);
        if (!anterior || normalizeStr(anterior.nombre) === normalizeStr(nombre)) return;
        const { error } = await supabase.from('ubicaciones').update({ nombre }).eq('id', id);
        if (error) throw error;
        // Cascada: renombrar también en bienes y funcionarios que usaban el nombre anterior
        const bienesAfectados = bienes.filter(b => normalizeStr(b.ubicacion || '') === normalizeStr(anterior.nombre));
        for (let i = 0; i < bienesAfectados.length; i += 10) {
          const chunk = bienesAfectados.slice(i, i + 10);
          await Promise.all(chunk.map(b => supabase.from('bens').update(conSello({ data: { ...b, ubicacion: nombre } })).eq('id', b.id)));
        }
        if (bienesAfectados.length > 0) {
          const ids = new Set(bienesAfectados.map(b => b.id));
          setBienes(prev => prev.map(b => (ids.has(b.id) ? { ...b, ubicacion: nombre } : b)));
        }
        const funcAfectados = funcionariosPadron.filter(f => normalizeStr(f.ubicacion || '') === normalizeStr(anterior.nombre));
        for (const f of funcAfectados) {
          await supabase.from('funcionarios').update({ ubicacion: nombre }).eq('id', f.id);
        }
        if (funcAfectados.length > 0) {
          const ids = new Set(funcAfectados.map(f => f.id));
          setFuncionariosPadron(prev => prev.map(f => (ids.has(f.id) ? { ...f, ubicacion: nombre } : f)));
        }
        setUbicacionesList(prev => prev.map(u => (u.id === id ? { ...u, nombre } : u)).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))));
        addToast(`Ubicación actualizada en ${bienesAfectados.length} bienes y ${funcAfectados.length} funcionarios.`, 'success');
      }
    } catch (e) {
      addToast('No se pudo guardar. Verifica la tabla ubicaciones en Supabase.', 'error');
    } finally {
      setIsSavingUbicacion(false);
    }
  };
  const guardarDependencia = async (id, nombre, activa = true) => {
    setIsSavingDep(true);
    try {
      if (!id) {
        const row = { id: generateId(), nombre: nombre.trim(), activa: true };
        const { error } = await supabase.from('dependencias').insert([row]);
        if (error) throw error;
        setDependenciasList(prev => [...prev, row].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))));
        addToast(`Dependencia "${nombre}" agregada.`, 'success');
      } else {
        const anterior = dependenciasList.find(d => d.id === id);
        if (!anterior) return;
        const { error } = await supabase.from('dependencias').update({ nombre: nombre.trim(), activa }).eq('id', id);
        if (error) throw error;
        // Cascada de renombre en todos los registros que usaban el nombre anterior
        if (normalizeStr(anterior.nombre) !== normalizeStr(nombre)) {
          const nuevo = nombre.trim();
          const renombrar = async (lista, tabla, campo, setLista, esJSON) => {
            const afectados = lista.filter(r => normalizeStr(r[campo] || '') === normalizeStr(anterior.nombre));
            for (let i = 0; i < afectados.length; i += 10) {
              const chunk = afectados.slice(i, i + 10);
              await Promise.all(chunk.map(r => {
                const payload = esJSON ? { data: { ...r, [campo]: nuevo } } : { [campo]: nuevo };
                const q = supabase.from(tabla).update(payload);
                return (r.id ? q.eq('id', r.id) : q.eq('username', r.username));
              }));
            }
            if (afectados.length > 0) {
              const ids = new Set(afectados.map(r => r.id || r.username));
              setLista(prev => prev.map(r => ((ids.has(r.id) || ids.has(r.username)) ? { ...r, [campo]: nuevo } : r)));
            }
            return afectados.length;
          };
          const n1 = await renombrar(bienes, 'bens', 'dependencia', setBienes, true);
          const n2 = await renombrar(funcionariosPadron, 'funcionarios', 'dependencia', setFuncionariosPadron, false);
          const n3 = await renombrar(ubicacionesList, 'ubicaciones', 'dependencia', setUbicacionesList, false);
          const n4 = await renombrar(fc10List, 'fc10', 'dependencia', setFc10List, true);
          const n5 = await renombrar(fc11List, 'fc11', 'dependenciaRemitente', setFc11List, true);
          const n6 = await renombrar(fc04List, 'fc04', 'dependencia', setFc04List, true);
          if (normalizeStr(dependenciaActual) === normalizeStr(anterior.nombre)) {
            setDependenciaActual(nuevo);
            clearAllFilters();
          }
          addToast(`Dependencia actualizada (${n1 + n2 + n3 + n4 + n5 + n6} registros migrados).`, 'success');
        }
        setDependenciasList(prev => prev.map(d => (d.id === id ? { ...d, nombre: nombre.trim(), activa } : d)).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))));
      }
    } catch (e) {
      addToast('No se pudo guardar. Verifica la tabla dependencias en Supabase.', 'error');
    } finally {
      setIsSavingDep(false);
    }
  };
  const fusionarDependencia = async (origenNombre, destinoNombre) => {
    // Mueve todos los registros del nombre detectado al oficial (igual cascada que renombrar)
    setIsSavingDep(true);
    try {
      const mover = async (lista, tabla, campo, setLista, esJSON) => {
        const afectados = lista.filter(r => normalizeStr(r[campo] || '') === normalizeStr(origenNombre));
        for (let i = 0; i < afectados.length; i += 10) {
          const chunk = afectados.slice(i, i + 10);
          await Promise.all(chunk.map(r => {
            const payload = esJSON ? { data: { ...r, [campo]: destinoNombre } } : { [campo]: destinoNombre };
            const q = supabase.from(tabla).update(payload);
            return (r.id ? q.eq('id', r.id) : q.eq('username', r.username));
          }));
        }
        if (afectados.length > 0) {
          const ids = new Set(afectados.map(r => r.id || r.username));
          setLista(prev => prev.map(r => ((ids.has(r.id) || ids.has(r.username)) ? { ...r, [campo]: destinoNombre } : r)));
        }
        return afectados.length;
      };
      const total = (await mover(bienes, 'bens', 'dependencia', setBienes, true))
        + (await mover(funcionariosPadron, 'funcionarios', 'dependencia', setFuncionariosPadron, false))
        + (await mover(ubicacionesList, 'ubicaciones', 'dependencia', setUbicacionesList, false))
        + (await mover(fc10List, 'fc10', 'dependencia', setFc10List, true))
        + (await mover(fc11List, 'fc11', 'dependenciaRemitente', setFc11List, true))
        + (await mover(fc04List, 'fc04', 'dependencia', setFc04List, true));
      if (normalizeStr(dependenciaActual) === normalizeStr(origenNombre)) {
        setDependenciaActual(destinoNombre);
        clearAllFilters();
      }
      addToast(`"${origenNombre}" fusionada en "${destinoNombre}" (${total} registros).`, 'success');
    } catch (e) {
      addToast('No se pudo fusionar.', 'error');
    } finally {
      setIsSavingDep(false);
    }
  };
  const eliminarDependencia = async (id, nombre) => {
    const hay = [bienes, funcionariosPadron, ubicacionesList, fc10List, fc11List, fc04List].some(lista =>
      lista.some(r => normalizeStr(r.dependencia || r.dependenciaRemitente || '') === normalizeStr(nombre))
    );
    if (hay) {
      addToast('Tiene registros asociados. Fusiona o reasigna antes de eliminar.', 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('dependencias').delete().eq('id', id);
      if (error) throw error;
      setDependenciasList(prev => prev.filter(d => d.id !== id));
      addToast('Dependencia eliminada.', 'success');
    } catch (e) {
      addToast('No se pudo eliminar.', 'error');
    }
  };
  const verPadronDependencia = (nombre) => {
    setDependenciaActual(nombre);
    clearAllFilters();
    setIsDependenciasModalOpen(false);
    setActiveTab('funcionarios');
    addToast(`Entorno cambiado a ${nombre}`, 'success');
  };
  const asignarFuncionarioAUbicacion = async (funcId, ubicacionNombre) => {
    if (!funcId) return;
    try {
      const func = funcionariosPadron.find(f => f.id === funcId);
      const { error } = await supabase.from('funcionarios').update({ ubicacion: ubicacionNombre || '' }).eq('id', funcId);
      if (error) throw error;
      setFuncionariosPadron(prev => prev.map(f => (f.id === funcId ? { ...f, ubicacion: ubicacionNombre || '' } : f)));
      // Cascada: los bienes a cargo del funcionario siguen su departamento.
      // Sin esto el padrón decía "Contratos y Garantías" pero el bien quedaba
      // con la ubicación vieja ("Seguimiento de Contratos").
      let movidos = 0;
      if (ubicacionNombre && func) {
        const cedFunc = String(func.cedula || '').replace(/\D/g, '');
        const nomFunc = normalizeStr(func.nombre || '');
        const afectados = bienes.filter(b => {
          if (b.dependencia !== dependenciaActual) return false;
          if (normalizeStr(b.ubicacion || '') === normalizeStr(ubicacionNombre)) return false;
          const cedBien = String(b.funcionarioDoc || '').replace(/\D/g, '');
          if (cedFunc && cedBien && cedFunc === cedBien) return true;
          return nomFunc && normalizeStr(b.funcionario || '') === nomFunc;
        });
        for (const b of afectados) {
          const actualizado = { ...b, ubicacion: ubicacionNombre };
          const { error: eBien } = await supabase.from('bens').update(conSello({ data: actualizado })).eq('id', b.id);
          if (!eBien) movidos++;
        }
        if (movidos > 0) {
          const ids = new Set(afectados.map(b => b.id));
          setBienes(prev => prev.map(b => (ids.has(b.id) ? { ...b, ubicacion: ubicacionNombre } : b)));
        }
      }
      addToast(ubicacionNombre ? (movidos > 0 ? `Funcionario asignado. ${movidos} bien(es) actualizados.` : 'Funcionario asignado a la ubicación.') : 'Funcionario sin ubicación.', 'success');
    } catch (e) {
      addToast('No se pudo asignar.', 'error');
    }
  };
  // Resalta la fila recién creada/editada en el inventario.
  const [lastMutatedBienId, setLastMutatedBienId] = useState(null);
  const marcarBienMutado = (id) => {
    setLastMutatedBienId(id);
    setTimeout(() => setLastMutatedBienId(prev => (prev === id ? null : prev)), 4000);
  };
  // QR en lote de la selección del inventario.
  const qrLoteSeleccion = () => {
    const lista = filteredBienes.filter(b => seleccionados.includes(b.id));
    if (lista.length === 0) return addToast('Selecciona al menos un bien.', 'warning');
    handleBulkLabelPNGZip(lista);
  };
  const bajaMasiva = async (ids) => {
    if (!ids || ids.length === 0) return;
    setIsProcessing({ active: true, text: `Procesando ${ids.length} bienes...` });
    try {
      if (isAdmin) {
        for (const b of bienes.filter(x => ids.includes(x.id))) {
          await supabase.from('bens').update(conSello({ data: { ...b, estadoConservacion: 'De Baja' } })).eq('id', b.id);
        }
        setBienes(prev => prev.map(b => (ids.includes(b.id) ? { ...b, estadoConservacion: 'De Baja' } : b)));
        await registrarAuditoria({
          usuario: currentUser?.username || 'Admin', dependencia: dependenciaActual,
          accion: 'ELIMINACION_O_BAJA', entidad: 'BIEN', entidadId: `${ids.length} bienes`,
          detalles: { cantidad: ids.length, ids }
        });
        addToast(`${ids.length} bienes dados de baja.`, 'success');
      } else {
        const filas = ids.map(id => {
          const b = bienes.find(x => x.id === id);
          const sid = generateId();
          return { id: sid, data: { id: sid, bienId: id, rotulo: b?.rotulo, descripcion: b?.descripcion, ubicacion: b?.ubicacion, funcionario: b?.funcionario, solicitante: currentUser?.username || 'Usuario', dependencia: dependenciaActual, tipo: 'BAJA_BIEN', estado: 'PENDIENTE', motivo: 'Baja masiva desde inventario', created_at: new Date().toISOString() } };
        });
        await supabase.from('notificaciones').insert(filas);
        setNotificaciones(prev => [...filas.map(f => ({ id: f.id, ...f.data })), ...prev]);
        addToast(`${ids.length} solicitudes de baja enviadas.`, 'success');
      }
      limpiarSeleccion();
    } catch (e) {
      addToast('No se pudo completar la baja masiva.', 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const eliminarUbicacion = async (id, nombre) => {
    const enBienes = bienes.filter(b => b.dependencia === dependenciaActual && normalizeStr(b.ubicacion || '') === normalizeStr(nombre)).length;
    const enFunc = funcionariosPadron.filter(f => f.dependencia === dependenciaActual && normalizeStr(f.ubicacion || '') === normalizeStr(nombre)).length;
    if (enBienes > 0 || enFunc > 0) {
      addToast(`En uso: ${enBienes} bienes y ${enFunc} funcionarios. Reasigna primero.`, 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
      if (error) throw error;
      setUbicacionesList(prev => prev.filter(u => u.id !== id));
      addToast('Ubicación eliminada.', 'success');
    } catch (e) {
      addToast('No se pudo eliminar.', 'error');
    }
  };
  // Atajos: "/" buscador · Ctrl/Cmd+K paleta · N nuevo bien · ? lista de atajos
  const searchRef = useRef(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isAtajosOpen, setIsAtajosOpen] = useState(false);
  const ultimaTeclaG = useRef(0);
  useEffect(() => {
    const TABS_ATAJO = {
      d: 'dashboard', r: 'resumen', i: 'inventario', f: 'funcionarios',
      c: 'fc04', a: 'fc10', t: 'fc11', u: 'usuarios', h: 'ayuda', b: 'aprobaciones'
    };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }
      if (e.key === 'Escape') { ultimaTeclaG.current = 0; return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      const escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !escribiendo) {
        if (activeTab !== 'inventario' || cmdOpen) return;
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === '?' && !escribiendo && !cmdOpen) {
        e.preventDefault();
        setIsAtajosOpen(true);
        return;
      }
      if ((e.key.toLowerCase() === 'n') && !escribiendo && !cmdOpen && !isAtajosOpen) {
        if (activeTab !== 'inventario') return;
        if (document.querySelector('.modalOverlay')) return;
        e.preventDefault();
        setBienEditing(null);
        setIsBienModalOpen(true);
        return;
      }
      // Secuencias g+letra para navegar (con ventana de 800ms)
      if (escribiendo || cmdOpen) return;
      const ahora = Date.now();
      if (e.key.toLowerCase() === 'g') { ultimaTeclaG.current = ahora; return; }
      if (ahora - ultimaTeclaG.current < 800 && TABS_ATAJO[e.key.toLowerCase()]) {
        ultimaTeclaG.current = 0;
        e.preventDefault();
        setActiveTab(TABS_ATAJO[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, cmdOpen]);
  const irTabGlobal = (tab, texto) => {
    if (tab === 'funcionarios' && texto) setSearchFuncionarioInput(texto);
    setActiveTab(tab);
  };
  // Tour guiado: pasos según rol, auto-inicio solo la primera vez
  const [tourPaso, setTourPaso] = useState(-1);
  const pasosTour = useMemo(() => {
    const base = [
      { tab: 'dashboard', selector: null, titulo: 'Bienvenido al sistema', texto: 'Recorrido rápido de lo más importante. Puedes omitirlo y retomarlo cuando quieras desde Centro de Ayuda.' },
      { tab: 'dashboard', selector: '[data-tour="dash-stats"]', titulo: 'Métricas accionables', texto: 'Cada tarjeta filtra el inventario al hacer clic: activos, con QR, sin FC-10 y pendientes de QR.' },
      { tab: 'dashboard', selector: '[data-tour="dash-pendientes"]', titulo: 'Atención requerida', texto: 'Tu lista de trabajo: lo que falta por etiquetar, asignar, ubicar o regularizar, con acceso directo.' },
      { tab: 'inventario', selector: '[data-tour="inv-search"]', titulo: 'Búsqueda robusta', texto: 'Ignora tildes y entiende varias palabras. Atajos: "/" enfoca aquí y Ctrl+K abre la búsqueda global.' },
      { tab: 'inventario', selector: '[data-tour="inv-table"]', titulo: 'Acciones por fila', texto: 'Desde cada bien: ficha 360 con trazabilidad, QR, acta FC-10, traslado y edición.' },
      { tab: null, selector: '[data-tour="scan"]', titulo: 'Escáner QR', texto: 'Con la cámara del celular o una lectora USB localizas cualquier bien al instante.' },
    ];
    if (isAdmin) {
      base.push(
        { tab: 'auditoria', selector: '[data-tour="aud-kpis"]', titulo: 'Módulo de Auditoría', texto: 'Solo administradores: libro de eventos, conciliación física, muestreo aleatorio y salud de datos.' },
        { tab: 'ayuda', selector: null, titulo: 'Listo para trabajar', texto: 'Eso fue lo esencial. Encontrarás esta guía y las novedades de cada versión en el Centro de Ayuda.' }
      );
    } else {
      base.push(
        { tab: 'resumen', selector: '[data-tour="nav-resumen"]', titulo: 'Mi Dependencia', texto: 'Tu vista de solo lectura: números, pendientes y últimas asignaciones sin riesgo de romper nada.' },
        { tab: 'ayuda', selector: null, titulo: 'Listo para trabajar', texto: 'Eso fue lo esencial. Encontrarás esta guía y las novedades de cada versión en el Centro de Ayuda.' }
      );
    }
    return base;
  }, [isAdmin]);
  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('tour_visto_v1') !== '1') {
      const t = setTimeout(() => setTourPaso(0), 900);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);
  const cerrarTour = (completado) => {
    setTourPaso(-1);
    try { localStorage.setItem('tour_visto_v1', '1'); } catch (e) {}
  };
  // PENDIENTE_LABELS vive en constants/appConstants (se usa en InventarioView).
  // Dominio de auditoría: hook extraído (Fase 6). La vista recibe los mismos nombres.
  const {
    auditoriaList, isLoadingAud, searchAud, setSearchAud,
    filtroAccionAud, setFiltroAccionAud,
    conteoCodigos, setConteoCodigos, conteoInput, setConteoInput,
    muestraN, setMuestraN, muestraUbicacion, setMuestraUbicacion,
    conteoUbicacion, setConteoUbicacion, muestra, setMuestra,
    verificadosMuestra, setVerificadosMuestra,
    paginaAud, totalAud, alcanceAud, setAlcanceAud, kpisAud, accionesUnicasAud,
    fetchAuditoria, actorAud, detalleAudCorto, tonoAccionAud,
    evolucionValor, maxEvolucion, formatoCortoGs, saludDatos,
    resultadoConteo, agregarCodigoConteo,
    descargarActaConteoPDF, descargarActaMuestreoPDF, exportarConteoCSV,
    guardarActaConteo, generarMuestra, guardarActaMuestreo
  } = useAuditoria({
    bienes, fc10List, fc11List, funcionariosPadron, dependenciaActual,
    currentUser, ubicacionesUnicas, activeTab, isAdmin,
    notify: addToast,
    // resolveLogoImg se define más abajo: wrapper perezoso para no romper TDZ.
    resolveLogoImg: (...a) => resolveLogoImg(...a),
    setIsProcessing
  });
  // currentPage, hasFilters y vistas viven en useInventarioFiltros (Fase 3).
  const [fc10Year, setFc10Year] = useState(new Date().getFullYear().toString()); 
  const [fc10Month, setFc10Month] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchConsolidadoModal, setSearchConsolidadoModal] = useState('');
  const [isConsolidatedFC10ModalOpen, setIsConsolidatedFC10ModalOpen] = useState(false);

  const fc10Map = useMemo(() => {
    const map = new Map();
    fc10List.forEach(fc => {
      if (fc.bienId && !fc.devolucionFecha) map.set(fc.bienId, fc);
    });
    return map;
  }, [fc10List]);

  const requestDependenciaChange = (newDep) => {
    setPendingDependencia(newDep);
    setShowDependenciaConfirm(true);
  };

  const confirmDependenciaChange = () => {
    setDependenciaActual(pendingDependencia);
    setShowDependenciaConfirm(false);
    clearAllFilters();
    addToast(`Entorno cambiado a ${pendingDependencia}`, "success");
  };
  
  // Estado compartido entre dominios (H4 lo consume antes de que exista H8):
  // vive en App para no crear referencia circular por orden de hooks.
  const [itemToDelete, setItemToDelete] = useState(null);
  const [motivoSolicitudBaja, setMotivoSolicitudBaja] = useState('');
  const [pendingCSVImport, setPendingCSVImport] = useState(null);
  // Dominio de funcionarios/padrón: hook extraído (Fase 6). La UI usa los mismos nombres.
  const {
    currentPaginaFuncionarios, setCurrentPaginaFuncionarios,
    isFuncionarioModalOpen, setIsFuncionarioModalOpen,
    funcionarioToEdit, setFuncionarioToEdit,
    isNewFuncionarioModalOpen, setIsNewFuncionarioModalOpen,
    isCSVPreviewOpen, setIsCSVPreviewOpen,
    csvPreviewData, setCsvPreviewData,
    pendingFuncionariosToImport, setPendingFuncionariosToImport,
    searchFuncionarioInput, setSearchFuncionarioInput,
    funcionariosPurosDependencia, totalPagesFuncs, funcionariosPaginados,
    funcionariosConDatos,
    sincronizarBienesConPadron, handleFileUploadFuncionarios,
    executeProcessFuncionariosCSV, handleSaveManualFuncionario,
    confirmCSVImportFuncionarios, handleDeleteFuncionario,
    handleEditFuncionario, saveFuncionarioEdit,
    renderPaginationFuncionarios
  } = useFuncionarios({
    funcionariosPadron, setFuncionariosPadron, dependenciaActual,
    bienes, setBienes, fc10List, currentUser, isAdmin,
    notify: addToast, setIsProcessing, setItemToDelete, fileInputFuncionariosRef,
    setPendingCSVImport
  });

  // 2. Calculamos el total de páginas exactas basándonos solo en los funcionarios puros

  // 3. Cortamos la porción correspondiente a la página actual


// --- CONSULTA PÚBLICA PARA ESCANEO DE QR ROBUSTA CON EXTRACCIÓN DE VALOR ---
// (clearAllFilters vive en useInventarioFiltros, Fase 3)
useEffect(() => {
  if (!publicBienId) return;

  const cargarBienPublico = async () => {
    try {
      const idSanitizado = decodeURIComponent(publicBienId).trim();
      let bienEncontrado = null;

      // 1. Consulta directa a 'bens' (datos completos, incluye valorUnitario).
      //    El RPC público devuelve una proyección sin valor, por eso ya no va primero.
      try {
        const { data: directData } = await supabase
          .from('bens')
          .select('*')
          .or(`id.eq.${idSanitizado},data->>rotulo.eq.${idSanitizado}`)
          .limit(1);
        if (directData && directData.length > 0) {
          bienEncontrado = normalizarBien(directData[0]);
        }
      } catch (e) {}

      // 2. RPC público como respaldo (puede no traer valorUnitario).
      if (!bienEncontrado || !tieneValor(bienEncontrado)) {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_bien_publico', {
            p_id: idSanitizado
          });
          if (!rpcError && rpcData) {
            const rpcBien = normalizarBien(rpcData);
            if (!bienEncontrado) {
              bienEncontrado = rpcBien;
            } else if (!tieneValor(bienEncontrado) && tieneValor(rpcBien)) {
              bienEncontrado = rpcBien;
            }
          }
        } catch (e) {}
      }

      // 3. Fallback en caché IndexedDB local
      if (!bienEncontrado) {
        try {
          const allKeys = await localforage.keys();
          for (const k of allKeys) {
            if (k.startsWith('bienes_cache')) {
              const cache = (await localforage.getItem(k)) || [];
              const found = cache.find(b => b.id === idSanitizado || String(b.rotulo).trim() === idSanitizado);
              if (found) {
                bienEncontrado = normalizarBien(found);
                break;
              }
            }
          }
        } catch (e) {}
      }

      if (bienEncontrado) {
        setPublicBienData(bienEncontrado);
      } else {
        setPublicBienData({
          rotulo: idSanitizado,
          descripcion: 'No se encontraron datos registrados para este activo en la base de datos oficial.'
        });
      }
    } catch (err) {
      console.error("Error al cargar bien público:", err);
      setPublicBienData({
        rotulo: 'Error',
        descripcion: 'Ocurrió un problema al procesar la solicitud del código QR.'
      });
    }
  };

  cargarBienPublico();
}, [publicBienId]);
  // -----------------------------------


  // Listas únicas, stats, pendientes, filtrado y paginación: todo vive en
  // useInventarioFiltros (Fase 3). La UI usa los mismos nombres.


  // Ficha 360: la lee el realtime (H5) anterior a H8, vive en App.
  // Sincronización de datos: hook extraído (Fase 6). La UI usa los mismos nombres.
  const {
    isOnline, colaOffline, notificaciones, setNotificaciones,
    fetchData, cargarNotificaciones, sondearNotificaciones, fusionarNotificacion,
    markAsRead, markAllAsRead, misNotificaciones, unreadCount
  } = useRealtimeSync({
    notify: addToast, currentUser, dependenciaActual, isAuthenticated, isAdmin,
    handleLogout, setBienes, setFc10List, setFc11List, setFc04List,
    setEstructurasDB, setUsuariosList, setFuncionariosPadron,
    setDbError, setIsLoading, setFichaBien
  });
  // Modales de fichas y formularios: hook extraído (Fase 6). La UI usa los mismos nombres.
  const {
    isBulkQR, setIsBulkQR, qrTargetBien, setQrTargetBien,
    isQRModalOpen, setIsQRModalOpen,
    isBienModalOpen, setIsBienModalOpen, bienEditing, setBienEditing, bienFormRef,
    isFC10ModalOpen, setIsFC10ModalOpen, fc10TargetBien, setFc10TargetBien,
    fc10Editing, setFc10Editing,
    isFC11ModalOpen, setIsFC11ModalOpen, fc11TargetBien, setFc11TargetBien,
    fc11Editing, setFc11Editing, fc11FormNumber, setFc11FormNumber,
    isFC04ModalOpen, setIsFC04ModalOpen, fc04Editing, setFc04Editing,
    fc04Items, setFc04Items, fc04SinMovimiento, setFc04SinMovimiento,
    isFC03ModalOpen, setIsFC03ModalOpen, fc03Config, setFc03Config,
    fc03FuncionarioTexto, setFc03FuncionarioTexto,
    showFC03FuncDropdown, setShowFC03FuncDropdown,
    isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioEditing, setUsuarioEditing,
    isSaving,
    confirmBackupModal, setConfirmBackupModal,
    resolucionBaja, setResolucionBaja, motivoResolucion, setMotivoResolucion,
    fileInputRef, showUnsavedChangesModal, setShowUnsavedChangesModal,
    scanParaConteo, setScanParaConteo,
    modoCampo, setModoCampo, ultimoEscaneo, setUltimoEscaneo,
    openFichaBien, openFC03Modal, executeGenerateFC03,
    openResolucionModal, openFC10Modal, openFC11Modal, openFC04Modal,
    handleAddFC04Item, handleRemoveFC04Item, handleFC04ItemChange,
    handleScanSuccess,
    saveBien, saveUsuario, saveFC11, saveFC04, saveFC10,
    submitResolucionBaja, confirmDeleteAction
  } = useFcModals({
    notify: addToast, setIsProcessing, appLogo,
    bienes, setBienes, filteredBienes, fc10List, fc11List, fc04List,
    dependenciaActual, funcionariosConDatos,
    currentUser, isAdmin, esDesarrollador,
    clearAllFilters, setSearchTerm, setSearchInput, setActiveTab, setCurrentPage,
    agregarCodigoConteo, cargarNotificaciones,
    setIsScannerOpen, setDependenciaActual, setNotificaciones, setFc10List,
  setFichaBien, setEventosAuditFicha,
  setFichaBien, setEventosAuditFicha,
    setFc11List, setFc04List, setFuncionariosPadron, setUsuariosList,
    funcionariosPadron, notificaciones, estructurasDB, setEstructurasDB,
    itemToDelete, setItemToDelete, motivoSolicitudBaja, setMotivoSolicitudBaja, setPendingCSVImport,
    resolveLogoImg: (...a) => resolveLogoImg(...a),
    onBienGuardado: marcarBienMutado
  });
  const timeStats = useMemo(() => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const depBienes = bienes.filter(b => b.dependencia === dependenciaActual); const adqCounts = {}; let adqMax = 0; depBienes.forEach(b => { const { year } = parseDateInfo(b.fechaAdquisicion); if (year) { const parsedYear = parseInt(year); if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) { adqCounts[year] = (adqCounts[year] || 0) + 1; } } }); const adqByYear = Object.keys(adqCounts).sort((a, b) => b - a).map(year => { if(adqCounts[year] > adqMax) adqMax = adqCounts[year]; return { year, count: adqCounts[year] }; }).slice(0, 4); let asigCurrentMonth = 0; let asigPreviousMonth = 0; const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1; const yearOfPrevMonth = currentMonth === 0 ? currentYear - 1 : currentYear; const depFC10 = fc10List.filter(fc => fc.dependencia === dependenciaActual); depFC10.forEach(fc => { const fechaAUsar = fc.entregadoFecha || fc.fechaGeneracion; if (fechaAUsar) { const parts = fechaAUsar.split('-'); if (parts.length >= 2) { const year = parseInt(parts[0]); const month = parseInt(parts[1]) - 1; if (year === currentYear && month === currentMonth) { asigCurrentMonth++; } else if (year === yearOfPrevMonth && month === prevMonth) { asigPreviousMonth++; } } } }); const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; return { adqByYear, adqMax: adqMax === 0 ? 1 : adqMax, asigCurrentMonth, asigPreviousMonth, asigMax: Math.max(asigCurrentMonth, asigPreviousMonth) === 0 ? 1 : Math.max(asigCurrentMonth, asigPreviousMonth), currentMonthName: monthNames[currentMonth], prevMonthName: monthNames[prevMonth], asigCurrent: { year: String(currentYear), month: String(currentMonth + 1).padStart(2, '0') }, asigPrev: { year: String(yearOfPrevMonth), month: String(prevMonth + 1).padStart(2, '0') } }; }, [bienes, fc10List, dependenciaActual]);
  
  // filteredBienes, paginatedBienes/itemsPaginados y totalPages: en useInventarioFiltros (Fase 3).
  const filteredFC10 = useMemo(() => { return fc10List.filter(fc => { if (fc.dependencia !== dependenciaActual) return false; const genDate = fc.entregadoFecha || fc.fechaGeneracion || ''; const devDate = fc.devolucionFecha || ''; const [gYear, gMonth] = genDate.split('-'); const matchGen = (gYear === fc10Year && gMonth === fc10Month); let matchDev = false; if (devDate) { const [dYear, dMonth] = devDate.split('-'); matchDev = (dYear === fc10Year && dMonth === fc10Month); } return matchGen || matchDev; }).sort((a, b) => new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()); }, [fc10List, dependenciaActual, fc10Year, fc10Month]);
  // FC-10 vigente por bien (para mostrar la fecha de asignación en el inventario).
  // Si hay varios, gana el vigente (sin devolución); si no, el más reciente.
  const fc10VigentePorBien = useMemo(() => {
    const mapa = new Map();
    for (const fc of fc10List) {
      if (!fc.bienId) continue;
      const actual = mapa.get(fc.bienId);
      if (!actual) { mapa.set(fc.bienId, fc); continue; }
      const actualVigente = !actual.devolucionFecha;
      const nuevoVigente = !fc.devolucionFecha;
      if (nuevoVigente && !actualVigente) { mapa.set(fc.bienId, fc); continue; }
      if (nuevoVigente === actualVigente) {
        const fA = actual.entregadoFecha || actual.fechaGeneracion || '';
        const fN = fc.entregadoFecha || fc.fechaGeneracion || '';
        if (fN > fA) mapa.set(fc.bienId, fc);
      }
    }
    return mapa;
  }, [fc10List]);
  const filteredFC11 = useMemo(() => { return fc11List.filter(fc => { const rem = fc.dependenciaRemitente || fc.remitente || ''; const dest = fc.dependenciaDestinataria || fc.destinatario || ''; if (rem !== dependenciaActual && dest !== dependenciaActual) return false; const [year, month] = String(fc.fecha || '').split('-'); return year === fc10Year && month === fc10Month; }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); }, [fc11List, dependenciaActual, fc10Year, fc10Month]);
  const filteredFC04 = useMemo(() => { return fc04List.filter(fc => { return fc.dependencia === dependenciaActual && fc.anio === fc10Year && fc.mes === fc10Month; }).sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()); }, [fc04List, dependenciaActual, fc10Year, fc10Month]);
  const solicitudesBaja = useMemo(() => { 
      return notificaciones.filter(n => {
          if ((n.tipo !== 'BAJA_BIEN' && n.tipo !== 'BAJA_FUNCIONARIO') || n.estado !== 'PENDIENTE') return false;
          if (isAdmin) return true;
          if (!n.dependencia || !dependenciaActual) return true;
          return normalizeStr(n.dependencia) === normalizeStr(dependenciaActual);
      });
  }, [notificaciones, dependenciaActual, isAdmin]);
  // Resolver solicitud de eliminación del padrón (solo admin, desde Aprobaciones)
  const resolverSolicitudFuncionario = async (notif, aprobar) => {
      try {
          setIsProcessing({ active: true, text: aprobar ? 'Aprobando eliminación...' : 'Rechazando solicitud...' });
          const estadoNuevo = aprobar ? 'APROBADO' : 'RECHAZADO';
          const notifActualizada = { ...notif, estado: estadoNuevo, resueltoPor: currentUser?.username || 'Admin', resueltoFecha: new Date().toISOString() };
          setNotificaciones(prev => prev.map(n => n.id === notif.id ? notifActualizada : n));
          await supabase.from('notificaciones').update({ data: notifActualizada }).eq('id', notif.id);
          if (aprobar && notif.funcionarioId) {
              await supabase.from('funcionarios').delete().eq('id', notif.funcionarioId);
              setFuncionariosPadron(prev => prev.filter(f => f.id !== notif.funcionarioId));
          }
          const solicitanteUsername = notif.solicitante || 'Usuario';
          const notifId = generateId();
          const notifUsuario = {
              id: notifId, tipoRegistro: 'NOTIFICACION', usuarioDestino: solicitanteUsername,
              titulo: aprobar ? `Eliminación aprobada: ${notif.nombre || ''}` : `Eliminación rechazada: ${notif.nombre || ''}`,
              mensaje: aprobar
                  ? `Tu solicitud de eliminar a "${notif.nombre || ''}" del padrón fue APROBADA.`
                  : `Tu solicitud de eliminar a "${notif.nombre || ''}" del padrón fue RECHAZADA.`,
              leido: false, fecha: new Date().toISOString()
          };
          setNotificaciones(prev => [notifUsuario, ...prev]);
          await supabase.from('notificaciones').insert([{ id: notifId, data: notifUsuario }]);
          await registrarAuditoria({
              usuario: currentUser?.username || 'Admin', dependencia: dependenciaActual,
              accion: aprobar ? 'APROBAR_BAJA_FUNCIONARIO' : 'RECHAZAR_BAJA_FUNCIONARIO',
              entidad: 'FUNCIONARIO', entidadId: notif.funcionarioId || null,
              detalles: { nombre: notif.nombre, cedula: notif.cedula, motivo: notif.motivo, solicitante: solicitanteUsername }
          });
          addToast(aprobar ? 'Funcionario eliminado y notificado.' : 'Solicitud rechazada y notificada.', 'success');
      } catch (e) {
          addToast('Error al procesar la resolución.', 'error');
      } finally {
          setIsProcessing({ active: false, text: '' });
      }
  };
  // Módulo Anuncios (solo desarrollador): una sola fila por anuncio.
  // Broadcast (TODOS) con leídos por usuario; directo con leído simple.
  const enviarAnuncio = async ({ titulo, mensaje, destino }) => {
      const remitente = currentUser?.username || 'Desarrollador';
      const dests = destino === 'TODOS' ? usuariosList.map(u => u.username).filter(Boolean) : [destino];
      if (dests.length === 0) { addToast('No hay destinatarios.', 'warning'); return false; }
      try {
          setIsProcessing({ active: true, text: 'Enviando anuncio...' });
          const id = generateId();
          const grupo = generateId();
          const fecha = new Date().toISOString();
          const data = { id, tipoRegistro: 'NOTIFICACION', accion: 'anuncio', usuarioDestino: destino === 'TODOS' ? 'TODOS' : destino, alcance: destino === 'TODOS' ? 'TODOS' : destino, titulo, mensaje, leido: false, leidos: [], totalDest: dests.length, fecha, remitente, grupo };
          const { error } = await supabase.from('notificaciones').insert([{ id, data }]);
          if (error) throw error;
          setNotificaciones(prev => [{ id, ...data }, ...prev]);
          await registrarAuditoria({
              usuario: remitente, dependencia: dependenciaActual,
              accion: 'ENVIAR_ANUNCIO', entidad: 'NOTIFICACION', entidadId: grupo,
              detalles: { titulo, destino, total: dests.length }
          });
          addToast(destino === 'TODOS' ? `Anuncio enviado a ${dests.length} usuarios.` : `Anuncio enviado a @${destino}.`, 'success');
          return true;
      } catch (e) {
          addToast('No se pudo enviar el anuncio.', 'error');
          return false;
      } finally {
          setIsProcessing({ active: false, text: '' });
      }
  };
  const eliminarGrupoAnuncio = async (grupo) => {
      const ids = notificaciones.filter(n => (n.grupo || n.id) === grupo).map(n => n.id);
      if (ids.length === 0) return;
      try {
          await Promise.all(ids.map(id => supabase.from('notificaciones').delete().eq('id', id)));
          setNotificaciones(prev => prev.filter(n => (n.grupo || n.id) !== grupo));
          addToast('Anuncio eliminado.', 'success');
      } catch (e) {
          addToast('No se pudo eliminar el anuncio.', 'error');
      }
  };
  const anunciosGrupos = useMemo(() => {
      const mapa = new Map();
      notificaciones.filter(n => n.accion === 'anuncio').forEach(n => {
          const g = n.grupo || n.id;
          if (!mapa.has(g)) mapa.set(g, { grupo: g, titulo: n.titulo || '(Sin título)', mensaje: n.mensaje || '', fecha: n.fecha, remitente: n.remitente, alcance: n.alcance || n.usuarioDestino, total: 0, leidos: 0 });
          const e = mapa.get(g);
          if (Array.isArray(n.leidos) || n.totalDest) {
              // Formato nuevo: una sola fila (toma el máximo por seguridad)
              e.total = Math.max(e.total, n.totalDest || 0);
              e.leidos = Math.max(e.leidos, (n.leidos || []).length);
          } else {
              // Formato legacy (fan-out): una fila por destinatario
              e.total++;
              if (n.leido) e.leidos++;
          }
          if (new Date(n.fecha).getTime() > new Date(e.fecha).getTime()) e.fecha = n.fecha;
      });
      return [...mapa.values()].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [notificaciones]);

  // --- EN App_2.jsx ---

  // Exportación favorita: recuerda el último formato para repetirlo en 1 clic.
  const [ultimaExportacion, setUltimaExportacion] = useState(() => { try { return JSON.parse(localStorage.getItem('ultima_exportacion') || 'null'); } catch { return null; } });
  // Idioma global (fuerza re-render al cambiar ES/GN).
  const { t: ti } = useIdioma();
  const guardarUltimaExport = (formato) => {
    const v = { formato, ts: Date.now() };
    setUltimaExportacion(v);
    try { localStorage.setItem('ultima_exportacion', JSON.stringify(v)); } catch {}
  };


  // Handlers de PDFs/QR/CSV/Excel/backup: hook extraído (Fase 6).
  const {
    marcarBienConQR, handleDownloadLabelPNG, handleDownloadSimpleQR,
    handleBulkLabelPNGZip, handleBulkSimpleQRZip,
    handleGenerateFC04PDF, handleGenerateFC11PDF, handleGenerateFC10PDF,
    handleGenerateConsolidatedFC10PDF, handleExportFC10CSV, handleExportFC11CSV,
    handleDownloadTemplateCSV, handleExportBackupGeneral,
    handleExportInventarioCSV, handleExportInventarioExcel,
    handleDownloadTemplateFuncionarios
  } = usePdfHandlers({
    notify: addToast, setIsProcessing, appLogo,
    bienes, filteredBienes, dependenciaActual, fc10List, fc11List,
    funcionariosPadron, currentUser, fc10Year, isAdmin,
    setBienes, setIsQRModalOpen, setIsConsolidatedFC10ModalOpen,
    resolveLogoImg: (...a) => resolveLogoImg(...a)
  });

  const exportarCSV = () => { guardarUltimaExport('csv'); handleExportInventarioCSV(); };
  const exportarExcel = () => { guardarUltimaExport('xlsx'); handleExportInventarioExcel(); };
  const repetirUltimaExportacion = () => {
    if (!ultimaExportacion) return addToast('Aún no hay exportaciones favoritas.', 'warning');
    if (ultimaExportacion.formato === 'xlsx') handleExportInventarioExcel(); else handleExportInventarioCSV();
  };
  // Reintento de importación CSV de bienes (guarda el último archivo).
  const ultimoArchivoBienesRef = useRef(null);







  // Logo para PDFs: respeta el logo subido por el usuario, si no usa el
  // institucional según dependencia, y como último recurso el placeholder.
  const resolveLogoImg = async (dependencia) => {
    if (appLogo) return appLogo;
    try {
      const b64 = await convertirImagenABase64(getLogoPorDependencia(dependencia));
      if (b64) return b64;
    } catch (e) {}
    return getPlaceholderLogo();
  };






  const toggleQR = async (bien) => { 
      const nuevoEstadoQR = !bien.hasQR;
      const updatedBien = { ...bien, hasQR: nuevoEstadoQR }; 
      
      // Actualizamos inmediatamente el estado local para que no desaparezca ni parpadee
      setBienes(prev => prev.map(b => b.id === bien.id ? updatedBien : b)); 
      
      try { 
          await supabase.from('bens').update(conSello({ data: updatedBien })).eq('id', updatedBien.id);
          
          const cacheActual = await localforage.getItem('bienes_cache') || [];
          const nuevoCache = cacheActual.map(b => b.id === bien.id ? updatedBien : b);
          await localforage.setItem('bienes_cache', nuevoCache);

          addToast(`Estado QR actualizado`, "success"); 
      } catch (error) { 
          // Si falla, revertimos el cambio en pantalla
          setBienes(prev => prev.map(b => b.id === bien.id ? bien : b));
          addToast("Error de red al guardar QR.", "error"); 
      } 
  };
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingCSVImport({ type: 'bienes', file });
  };

  // Paso previo al import: muestra conteos y primeras filas en el modal.
  const previsualizarCSVBienes = async (file) => {
    if (!file) return;
    setIsProcessing({ active: true, text: 'Analizando planilla...' });
    try {
      const { default: Papa } = await import('papaparse');
      const { validos, duplicados, errores } = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => resolve(mapearFilasBienes(results.data, results.meta.fields, bienes, dependenciaActual)),
          error: (err) => reject(err)
        });
      });
      setCsvPreviewData({ validos, duplicados, errores, tipo: 'bienes', file });
      setIsCSVPreviewOpen(true);
    } catch (e) {
      addToast("No se pudo leer el archivo CSV.", "error");
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };

  const executeProcessBienesCSV = async (file) => {

    setIsProcessing({ active: true, text: 'Procesando Planilla Excel (CSV)...' });
    setIsCSVPreviewOpen(false);
    if (file) ultimoArchivoBienesRef.current = file;

    // papaparse se carga bajo demanda: no entra al bundle inicial.
    const { default: Papa } = await import('papaparse');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results) => {
        const { validos: newBienes, duplicados } = mapearFilasBienes(results.data, results.meta.fields, bienes, dependenciaActual);
        const duplicatesSkipped = duplicados.length;

        if (newBienes.length > 0) {
          try {
            const payload = newBienes.map(b => conSello({ id: b.id, data: b }));
            await supabase.from('bens').insert(payload);
            // Actualización local dirigida (evita recargar todo el inventario)
            setBienes(prev => [...newBienes, ...prev.filter(b => !newBienes.some(n => n.id === b.id))]);
            try {
              const cacheActual = await localforage.getItem(`bienes_cache_${dependenciaActual}`) || [];
              await localforage.setItem(`bienes_cache_${dependenciaActual}`, [...newBienes, ...cacheActual.filter(b => !newBienes.some(n => n.id === b.id))]);
            } catch (e) {}
            addToast(`¡Éxito! Se guardaron ${newBienes.length} bienes nuevos.${duplicatesSkipped > 0 ? ` Se omitieron ${duplicatesSkipped} duplicados.` : ''}`, "success");
          } catch (error) {
            addToast("Error al guardar registros en la base de datos.", "error", { action: { label: 'Reintentar', onClick: () => { if (ultimoArchivoBienesRef.current) executeProcessBienesCSV(ultimoArchivoBienesRef.current); } } });
          }
        } else {
          addToast(`No se importó ningún bien. Se omitieron ${duplicatesSkipped} duplicados.`, "warning");
        }

        setIsProcessing({ active: false, text: '' });
        // Resetea el input para permitir reimportar el mismo archivo.
        // (Antes: `e.target.value` inexistente en este scope -> ReferenceError.)
        if (fileInputRef.current) fileInputRef.current.value = null;
      },
      error: (err) => {
        console.error(err);
        addToast("Error al procesar el archivo CSV.", "error", { action: { label: 'Reintentar', onClick: () => { if (ultimoArchivoBienesRef.current) executeProcessBienesCSV(ultimoArchivoBienesRef.current); } } });
        setIsProcessing({ active: false, text: '' });
      }
    });
  };
  // --- BACKUP GENERAL DE PROTECCIÓN DEL SISTEMA (SOLO ADMINS) ---










  



  // Extracción de código QR: helper puro en utils/qr (Fase 1).
  // Modo conteo: el escáner alimenta la conciliación física en vez de abrir el bien
  useEffect(() => {
      if (isScannerOpen) {
          setTimeout(() => {
              if (window.Html5Qrcode) {
                  const html5QrCode = new window.Html5Qrcode("reader");
                  window.html5QrCode = html5QrCode;
                  
                  html5QrCode.start(
                      { facingMode: "environment" },
                      { fps: 10, qrbox: { width: 250, height: 250 } },
                      (decodedText) => { html5QrCode.stop().then(() => { handleScanSuccess(decodedText); }).catch(() => { handleScanSuccess(decodedText); }); },
                      (errorMessage) => {}
                  ).catch(err => { addToast("No se pudo acceder a la cámara. Verifique los permisos.", "error"); setIsScannerOpen(false); });
              }
          }, 300);
      }
  }, [isScannerOpen]);


  const saludoBienvenida = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "¡Buenos días";
    if (hora < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }, []);

  const renderPagination = () => (
    <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
      <span className="text-sm text-zinc-500 font-medium">{ti('inv.mostrando')} <span className="font-bold text-zinc-900 dark:text-white">{(currentPage - 1) * itemsPorPagina + (filteredBienes.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPorPagina, filteredBienes.length)}</span> {ti('inv.de')} {filteredBienes.length}</span>
      <div className="flex items-center gap-2">
        <FiltroCombo
          ancho="w-[132px]"
          compacto
          valor={itemsPorPagina}
          opciones={[10, 20, 50].map(n => ({ label: `${n} ${ti('inv.por_pagina')}`, value: n }))}
          onElegir={(v) => cambiarPaginaTam(parseInt(v, 10))}
          etiquetaTodos={ti('inv.por_pagina')}
          titulo={ti('inv.por_pagina')}
        />
        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">{ti('inv.anterior')}</button>
        <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">{ti('inv.siguiente')}</button>
      </div>
    </div>
  );

  // --- INICIO DE CÓDIGO RESTAURADO ---

  // --- FIN DE CÓDIGO RESTAURADO ---
  // Toasts: hook extraído (Fase 1). Misma API que el código inline original.


// --- VISTA PaBLICA DE ESCANEO QR REDISEÑADA Y OPTIMIZADA PARA MÓVILES ---
// --- VISTA PÚBLICA DE ESCANEO QR CLARA, MODERNA Y OPTIMIZADA PARA MÓVILES (iOS / ANDROID) ---
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && !mostrarLoginDev) {
  return <MaintenanceScreen config={mantenimiento} onAccesoDesarrollador={() => setMostrarLoginDev(true)} />;
}
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && mostrarLoginDev) {
  return (
      <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} appLogo={appLogo} toasts={toasts} isProcessing={isProcessing.active} />
  );
}
if (publicBienId) {
  return (
    <div className="h-dvh overflow-y-auto bg-slate-100 flex flex-col items-center p-3 sm:p-6 text-slate-900 font-sans selection:bg-blue-600 selection:text-white custom-scrollbar">
      <div className="bg-white border border-slate-200/80 rounded-[28px] sm:rounded-[32px] p-4 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden m-auto">

        {/* Acento superior institucional */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500"></div>

        {/* Header institucional */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-2 border border-blue-100 shadow-sm">
            <i className="fa-solid fa-shield-halved text-xl"></i>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 mb-2 border border-blue-200/60">
            <i className="fa-solid fa-circle-check text-[10px] text-blue-600"></i> Verificación Oficial de Activo
          </span>

          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
            Universidad Nacional de Pilar
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
            Sistema Integrado de Gestión Patrimonial
          </p>
        </div>

        {/* Contenido principal o Spinner */}
        {publicBienData ? (
          <div className="py-4 space-y-3">

            {publicBienData.fotos?.[0]?.url && (
              <button
                onClick={() => setPublicFotoAmpliada(publicBienData.fotos[0].url)}
                title="Ampliar foto"
                className="block w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              >
                <img
                  src={publicBienData.fotos[0].url}
                  alt="Foto del activo (toca para ampliar)"
                  loading="lazy"
                  decoding="async"
                  className="w-full max-h-44 sm:max-h-56 object-cover pointer-events-none"
                  onError={(e) => { e.currentTarget.closest('div').style.display = 'none'; }}
                />
              </button>
            )}

            {/* Tarjeta de Rótulo y Estado */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código / Rótulo</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5 truncate">
                    {publicBienData.rotulo || "S/Rótulo"}
                  </p>
                </div>
                {publicBienData.estadoConservacion && (
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    publicBienData.estadoConservacion === "De Baja"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {publicBienData.estadoConservacion}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción General</p>
                <p className={`text-xs sm:text-sm font-bold text-slate-800 mt-1 leading-relaxed ${!publicDescExpandida && (publicBienData.descripcion || '').length > 140 ? 'line-clamp-3' : ''}`}>
                  {publicBienData.descripcion || "Sin descripción asignada"}
                </p>
                {(publicBienData.descripcion || '').length > 140 && (
                  <button onClick={() => setPublicDescExpandida(v => !v)} className="mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                    {publicDescExpandida ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            </div>

            {/* Datos Técnicos y Contables */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-layer-group text-blue-600"></i> Cuenta
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                  {publicBienData.cuenta || "Sin Cuenta"}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-coins text-emerald-600"></i> Valor
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  Gs. {formatCurrency(publicBienData.valorUnitario || publicBienData.valor || publicBienData.valorAdquisicion || "0")}
                </p>
              </div>

              {publicBienData.subcuenta && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-sitemap text-indigo-600"></i> Sub-Cuenta
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {publicBienData.subcuenta}
                  </p>
                </div>
              )}

              {publicBienData.fechaAdquisicion && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar text-amber-600"></i> Adquisición
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {String(publicBienData.fechaAdquisicion).split("T")[0]}
                  </p>
                </div>
              )}

              {publicBienData.vidaUtil && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-hourglass-half text-purple-600"></i> Vida Útil
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {publicBienData.vidaUtil} años
                  </p>
                </div>
              )}
            </div>

            {/* Custodio, Ubicación y Dependencia */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-user-check text-blue-600"></i> Responsable Asignado
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {publicBienData.funcionario || "Sin Responsable Asignado"}
                </p>
                {publicBienData.funcionarioCargo && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Cargo: {publicBienData.funcionarioCargo}
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-rose-600"></i> Ubicación Física
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {publicBienData.ubicacion || "Sin Ubicación Registrada"}
                </p>
              </div>

              {publicBienData.dependencia && (
                <div className="pt-2.5 border-t border-slate-200/60">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-building-columns text-emerald-600"></i> Dependencia
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {publicBienData.dependencia}
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600 mb-3"></i>
            <p className="text-xs text-slate-500 font-semibold">Consultando datos de registro...</p>
          </div>
        )}

        {/* Pie y botón de retorno */}
        <div className="pt-2">
          <button 
            onClick={() => window.location.href = window.location.origin} 
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-98"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i> Ir a la Plataforma Principal
          </button>
        </div>

      </div>
      {publicFotoAmpliada && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm" onClick={() => setPublicFotoAmpliada(null)}>
          <img src={publicFotoAmpliada} alt="Foto ampliada del activo" className="max-h-[90dvh] max-w-full rounded-2xl shadow-2xl object-contain" />
          <span className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <i className="fa-solid fa-xmark"></i>
          </span>
        </div>
      )}
    </div>
  );
}

  // 2. LUEGO EL RESTO DE VALIDACIONES (Mantenimiento global, Login, etc.)

  if (!isAuthenticated) {
      return (
          <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} appLogo={appLogo} toasts={toasts} isProcessing={isProcessing.active} />
      );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-dvh overflow-hidden bg-zinc-50 dark:bg-darkbg-main transition-colors duration-300 text-base`} style={{ '--dep-accent': colorPorDependencia(dependenciaActual) }}>
      <a href="#contenido" className="skip-link px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold shadow-xl">{ti('app.saltar')}</a>
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputFuncionariosRef} onChange={handleFileUploadFuncionarios} />
      
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        
        {!isOnline && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-black bg-amber-500/90 text-white backdrop-blur-md border border-amber-400/30 transition-all animate-slide-up">
            <i className="fa-solid fa-wifi-slash text-base"></i>
            <span className="flex-1">{ti('off.sin_conexion')}{colaOffline > 0 ? ` · ${colaOffline} ${colaOffline === 1 ? ti('off.pendiente') : ti('off.pendientes')}` : ''}</span>
          </div>
        )}
        {isOnline && colaOffline > 0 && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-black bg-sky-600/90 text-white backdrop-blur-md border border-sky-400/30 transition-all animate-slide-up">
            <i className="fa-solid fa-cloud-arrow-up text-base"></i>
            <span className="flex-1">{ti('off.sinc')} {colaOffline} {colaOffline === 1 ? ti('off.pendiente') : ti('off.pendientes')}...</span>
          </div>
        )}

        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3.5 px-5 py-4 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-[20px] shadow-2xl text-xs font-bold bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 transition-all animate-slide-up">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-inner ${
              t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' : 
              t.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50' : 
              t.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' : 
              'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'
            }`}>
              <i className={`fa-solid ${
                t.type === 'success' ? 'fa-circle-check text-sm' : 
                t.type === 'error' ? 'fa-circle-exclamation text-sm' : 
                t.type === 'warning' ? 'fa-triangle-exclamation text-sm' : 
                'fa-circle-info text-sm'
              }`}></i>
            </div>
            <span className="flex-1 leading-relaxed">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
        
      </div>

      {isProcessing.active && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-[500] flex flex-col items-center justify-center animate-fade-in">
          <div className="proc-track"><div className={`proc-fill ${isProcessing.pct == null ? 'indete' : ''}`} style={isProcessing.pct != null ? { width: `${Math.min(100, Math.max(0, isProcessing.pct))}%` } : undefined}></div></div>
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-primary mb-4"></i>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-white tracking-tight">{isProcessing.text}</h2>
          {isProcessing.pct != null && (
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-2 tabular-nums">{Math.round(isProcessing.pct)}%</p>
          )}
        </div>
      )}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} appLogo={appLogo} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} esDesarrollador={esDesarrollador} solicitudesBaja={solicitudesBaja} dependenciaActual={dependenciaActual} onExportBackup={() => setConfirmBackupModal(true)} mantenimiento={mantenimiento} onOpenMantenimiento={() => setIsMantenimientoModalOpen(true)} onOpenDependencias={() => setIsDependenciasModalOpen(true)} />
      
      <div className="flex flex-1 flex-col min-w-0 bg-zinc-50 dark:bg-darkbg-main relative">
          {dbError && (
            <div className="flex items-center justify-center gap-x-6 bg-red-50 px-6 py-2.5 sm:px-3.5 border-b border-red-200 dark:bg-red-900/30 dark:border-red-900/50 shadow-sm z-50">
              <p className="text-sm leading-6 text-red-700 dark:text-red-400 font-medium">
                <i className="fa-solid fa-wifi mr-2"></i> Error de sincronización con Supabase. Verifique su conexión.
              </p>
            </div>
          )}

          <Header setIsSidebarOpen={setIsSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} setIsScannerOpen={setIsScannerOpen} dependenciaActual={dependenciaActual} setDependenciaActual={requestDependenciaChange} todasDependencias={todasDependencias} clearAllFilters={clearAllFilters} darkMode={darkMode} setDarkMode={setDarkMode} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} unreadCount={unreadCount} misNotificaciones={misNotificaciones} markAsRead={markAsRead} onMarkAllRead={markAllAsRead} currentUser={currentUser} isAdmin={isAdmin} handleLogout={() => setShowLogoutConfirm(true)} />

          <main id="contenido" className="flex-1 overflow-y-auto custom-scrollbar">
            <div key={activeTab} className="tab-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 min-h-full flex flex-col">
                {activeTab === 'dashboard' && (<DashboardView currentUser={currentUser} dependenciaActual={dependenciaActual} saludoBienvenida={saludoBienvenida} stats={stats} pendientes={pendientes} isLoading={isLoading} timeStats={timeStats} clearAllFilters={clearAllFilters} setActiveTab={setActiveTab} setFiltroQR={setFiltroQR} setFiltroFC10={setFiltroFC10} setFiltroPendiente={setFiltroPendiente} setFiltroAnio={setFiltroAnio} setFiltroMes={setFiltroMes} setCurrentPage={setCurrentPage} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} fileInputRef={fileInputRef} handleExportInventarioCSV={handleExportInventarioCSV} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setFc10Year={setFc10Year} setFc10Month={setFc10Month} />)}

                {activeTab === 'resumen' && (<ResumenView dependenciaActual={dependenciaActual} stats={stats} pendientes={pendientes} fc10List={fc10List} />)}
                {activeTab === 'inventario' && (<InventarioView hasFilters={hasFilters} filteredBienes={filteredBienes} stats={stats} handleDownloadTemplateCSV={handleDownloadTemplateCSV} fileInputRef={fileInputRef} handleExportInventarioCSV={exportarCSV} handleExportInventarioExcel={exportarExcel} ultimaExportacion={ultimaExportacion} onRepetirExport={repetirUltimaExportacion} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} searchRef={searchRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} orden={orden} setOrden={setOrden} filtroFuncionario={filtroFuncionario} setFiltroFuncionario={setFiltroFuncionario} funcionariosUnicos={funcionariosUnicos} filtroUbicacion={filtroUbicacion} setFiltroUbicacion={setFiltroUbicacion} ubicacionesUnicas={ubicacionesUnicas} filtroAnio={filtroAnio} setFiltroAnio={setFiltroAnio} aniosUnicos={aniosUnicos} filtroSubcuenta={filtroSubcuenta} setFiltroSubcuenta={setFiltroSubcuenta} subcuentasUnicas={subcuentasUnicas} filtroAnalitico1={filtroAnalitico1} setFiltroAnalitico1={setFiltroAnalitico1} analiticos1Unicos={analiticos1Unicos} filtroAnalitico2={filtroAnalitico2} setFiltroAnalitico2={setFiltroAnalitico2} analiticos2Unicos={analiticos2Unicos} filtroFC10={filtroFC10} setFiltroFC10={setFiltroFC10} filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado} vistasGuardadas={vistasGuardadas} aplicarVista={aplicarVista} eliminarVista={eliminarVista} mostrarGuardarVista={mostrarGuardarVista} setMostrarGuardarVista={setMostrarGuardarVista} nombreVista={nombreVista} setNombreVista={setNombreVista} guardarVistaActual={guardarVistaActual} clearAllFilters={clearAllFilters} filtroPendiente={filtroPendiente} setFiltroPendiente={setFiltroPendiente} itemsPaginados={itemsPaginados} fc10VigentePorBien={fc10VigentePorBien} isAdmin={isAdmin} setItemToDelete={setItemToDelete} seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} limpiarSeleccion={limpiarSeleccion} vistaInv={vistaInv} cambiarVistaInv={cambiarVistaInv} lastMutatedBienId={lastMutatedBienId} onBajaMasiva={bajaMasiva} onQRLoteSeleccion={qrLoteSeleccion} STYLES={STYLES} openFichaBien={openFichaBien} openFC10Modal={openFC10Modal} openFC11Modal={openFC11Modal} renderPagination={renderPagination} />)}

                {activeTab === 'aprobaciones' && isAdmin && (<AprobacionesView solicitudesBaja={solicitudesBaja} dependenciaActual={dependenciaActual} bienes={bienes} resolverSolicitudFuncionario={resolverSolicitudFuncionario} openResolucionModal={openResolucionModal} />)}

                {activeTab === 'auditoria' && isAdmin && (<AuditoriaView fetchAuditoria={fetchAuditoria} isLoadingAud={isLoadingAud} kpisAud={kpisAud} evolucionValor={evolucionValor} maxEvolucion={maxEvolucion} formatoCortoGs={formatoCortoGs} clearAllFilters={clearAllFilters} setFiltroAnio={setFiltroAnio} setFiltroMes={setFiltroMes} setActiveTab={setActiveTab} saludDatos={saludDatos} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} conteoUbicacion={conteoUbicacion} setConteoUbicacion={setConteoUbicacion} bienes={bienes} dependenciaActual={dependenciaActual} ubicacionesUnicas={ubicacionesUnicas} conteoCodigos={conteoCodigos} conteoInput={conteoInput} setConteoInput={setConteoInput} agregarCodigoConteo={agregarCodigoConteo} resultadoConteo={resultadoConteo} setScanParaConteo={setScanParaConteo} setIsScannerOpen={setIsScannerOpen} setConteoCodigos={setConteoCodigos} exportarConteoCSV={exportarConteoCSV} descargarActaConteoPDF={descargarActaConteoPDF} guardarActaConteo={guardarActaConteo} muestraN={muestraN} setMuestraN={setMuestraN} muestraUbicacion={muestraUbicacion} setMuestraUbicacion={setMuestraUbicacion} muestra={muestra} verificadosMuestra={verificadosMuestra} setVerificadosMuestra={setVerificadosMuestra} generarMuestra={generarMuestra} guardarActaMuestreo={guardarActaMuestreo} descargarActaMuestreoPDF={descargarActaMuestreoPDF} totalAud={totalAud} paginaAud={paginaAud} alcanceAud={alcanceAud} setAlcanceAud={setAlcanceAud} searchAud={searchAud} setSearchAud={setSearchAud} filtroAccionAud={filtroAccionAud} setFiltroAccionAud={setFiltroAccionAud} accionesUnicasAud={accionesUnicasAud} auditoriaList={auditoriaList} actorAud={actorAud} tonoAccionAud={tonoAccionAud} detalleAudCorto={detalleAudCorto} />)}
                {activeTab === 'usuarios' && isAdmin && (<UsuariosView usuariosList={usuariosList} setUsuarioEditing={setUsuarioEditing} setIsUsuarioModalOpen={setIsUsuarioModalOpen} esDesarrollador={esDesarrollador} currentUser={currentUser} setItemToDelete={setItemToDelete} STYLES={STYLES} />)}
                {activeTab === 'anuncios' && esDesarrollador && (<AnunciosView usuariosList={usuariosList} anunciosGrupos={anunciosGrupos} onEnviar={enviarAnuncio} onEliminarGrupo={eliminarGrupoAnuncio} currentUser={currentUser} />)}
                {activeTab === 'funcionarios' && (<FuncionariosView funcionariosPurosDependencia={funcionariosPurosDependencia} dependenciaActual={dependenciaActual} sincronizarBienesConPadron={sincronizarBienesConPadron} handleDownloadTemplateFuncionarios={handleDownloadTemplateFuncionarios} fileInputFuncionariosRef={fileInputFuncionariosRef} isAdmin={isAdmin} setIsUbicacionesModalOpen={setIsUbicacionesModalOpen} setIsNewFuncionarioModalOpen={setIsNewFuncionarioModalOpen} searchFuncionarioInput={searchFuncionarioInput} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} funcionariosPaginados={funcionariosPaginados} handleEditFuncionario={handleEditFuncionario} handleDeleteFuncionario={handleDeleteFuncionario} renderPaginationFuncionarios={renderPaginationFuncionarios} />)}

                {activeTab === 'fc04' && (<Fc04View filteredFC04={filteredFC04} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} openFC04Modal={openFC04Modal} STYLES={STYLES} isLoading={isLoading} ORIGENES_FC04={ORIGENES_FC04} handleGenerateFC04PDF={handleGenerateFC04PDF} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}

                {activeTab === 'fc10' && (<Fc10View filteredFC10={filteredFC10} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} STYLES={STYLES} setIsConsolidatedFC10ModalOpen={setIsConsolidatedFC10ModalOpen} handleExportFC10CSV={handleExportFC10CSV} isLoading={isLoading} bienes={bienes} handleGenerateFC10PDF={handleGenerateFC10PDF} openFC10Modal={openFC10Modal} isAdmin={isAdmin} setItemToDelete={setItemToDelete} setActiveTab={setActiveTab} />)}
                {activeTab === 'fc11' && (<Fc11View filteredFC11={filteredFC11} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} STYLES={STYLES} handleExportFC11CSV={handleExportFC11CSV} isLoading={isLoading} dependenciaActual={dependenciaActual} handleGenerateFC11PDF={handleGenerateFC11PDF} openFC11Modal={openFC11Modal} bienes={bienes} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}
                {activeTab === 'ayuda' && (<AyudaView setTourPaso={setTourPaso} STYLES={STYLES} />)}
            </div>
          </main>
      </div>

      {/* Modales y componentes flotantes (carga diferida) */}
      <Suspense fallback={null}>
      <AppModals STYLES={STYLES} isCSVPreviewOpen={isCSVPreviewOpen} setIsCSVPreviewOpen={setIsCSVPreviewOpen} confirmCSVImportFuncionarios={confirmCSVImportFuncionarios} csvPreviewData={csvPreviewData} isFuncionarioModalOpen={isFuncionarioModalOpen} setIsFuncionarioModalOpen={setIsFuncionarioModalOpen} funcionarioToEdit={funcionarioToEdit} saveFuncionarioEdit={saveFuncionarioEdit} ubicacionesDep={ubicacionesDep} isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} setScanParaConteo={setScanParaConteo} scanParaConteo={scanParaConteo} conteoCodigos={conteoCodigos} isQRModalOpen={isQRModalOpen} setIsQRModalOpen={setIsQRModalOpen} isBulkQR={isBulkQR} qrTargetBien={qrTargetBien} handleDownloadLabelPNG={handleDownloadLabelPNG} handleDownloadSimpleQR={handleDownloadSimpleQR} handleBulkLabelPNGZip={handleBulkLabelPNGZip} handleBulkSimpleQRZip={handleBulkSimpleQRZip} setDarkMode={setDarkMode} setIsAtajosOpen={setIsAtajosOpen} handleExportInventarioCSV={exportarCSV} handleExportInventarioExcel={exportarExcel} repetirUltimaExportacion={repetirUltimaExportacion} ultimaExportacion={ultimaExportacion} isFC03ModalOpen={isFC03ModalOpen} setIsFC03ModalOpen={setIsFC03ModalOpen} fc03Config={fc03Config} setFc03Config={setFc03Config} fc03FuncionarioTexto={fc03FuncionarioTexto} setFc03FuncionarioTexto={setFc03FuncionarioTexto} showFC03FuncDropdown={showFC03FuncDropdown} setShowFC03FuncDropdown={setShowFC03FuncDropdown} ubicacionesUnicas={ubicacionesUnicas} funcionariosPadron={funcionariosPadron} dependenciaActual={dependenciaActual} executeGenerateFC03={executeGenerateFC03} isFC04ModalOpen={isFC04ModalOpen} setIsFC04ModalOpen={setIsFC04ModalOpen} fc04Editing={fc04Editing} saveFC04={saveFC04} fc10Month={fc10Month} fc10Year={fc10Year} ORIGENES_FC04={ORIGENES_FC04} fc04SinMovimiento={fc04SinMovimiento} setFc04SinMovimiento={setFc04SinMovimiento} handleAddFC04Item={handleAddFC04Item} fc04Items={fc04Items} handleFC04ItemChange={handleFC04ItemChange} handleRemoveFC04Item={handleRemoveFC04Item} isFC10ModalOpen={isFC10ModalOpen} setIsFC10ModalOpen={setIsFC10ModalOpen} fc10TargetBien={fc10TargetBien} fc10Editing={fc10Editing} saveFC10={saveFC10} funcionariosConDatos={funcionariosConDatos} estructurasDB={estructurasDB} isFC11ModalOpen={isFC11ModalOpen} setIsFC11ModalOpen={setIsFC11ModalOpen} fc11TargetBien={fc11TargetBien} fc11Editing={fc11Editing} saveFC11={saveFC11} todasDependencias={todasDependencias} isUsuarioModalOpen={isUsuarioModalOpen} isAdmin={isAdmin} setIsUsuarioModalOpen={setIsUsuarioModalOpen} usuarioEditing={usuarioEditing} saveUsuario={saveUsuario} esDesarrollador={esDesarrollador} isBienModalOpen={isBienModalOpen} setIsBienModalOpen={setIsBienModalOpen} bienEditing={bienEditing} setBienEditing={setBienEditing} bienFormRef={bienFormRef} saveBien={saveBien} isSaving={isSaving} ESTADOS_CONSERVACION={ESTADOS_CONSERVACION} sugerenciasBienesDep={sugerenciasBienesDep} padronDep={padronDep} fichaBien={fichaBien} setFichaBien={setFichaBien} setEventosAuditFicha={setEventosAuditFicha} eventosFicha={eventosFicha} subirFotoBien={subirFotoBien} eliminarFotoBien={eliminarFotoBien} subiendoFoto={subiendoFoto} tourPaso={tourPaso} pasosTour={pasosTour} setTourPaso={setTourPaso} cerrarTour={cerrarTour} setActiveTab={setActiveTab} cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} bienes={bienes} irTabGlobal={irTabGlobal} isDependenciasModalOpen={isDependenciasModalOpen} setIsDependenciasModalOpen={setIsDependenciasModalOpen} dependenciasList={dependenciasList} DEPENDENCIAS_UNP={DEPENDENCIAS_UNP} dependenciasDetectadas={dependenciasDetectadas} conteosDependencia={conteosDependencia} guardarDependencia={guardarDependencia} eliminarDependencia={eliminarDependencia} fusionarDependencia={fusionarDependencia} isSavingDep={isSavingDep} verPadronDependencia={verPadronDependencia} ubicacionesList={ubicacionesList} conteosUbicacion={conteosUbicacion} guardarUbicacion={guardarUbicacion} eliminarUbicacion={eliminarUbicacion} asignarFuncionarioAUbicacion={asignarFuncionarioAUbicacion} isUbicacionesModalOpen={isUbicacionesModalOpen} setIsUbicacionesModalOpen={setIsUbicacionesModalOpen} isSavingUbicacion={isSavingUbicacion} isMantenimientoModalOpen={isMantenimientoModalOpen} setIsMantenimientoModalOpen={setIsMantenimientoModalOpen} mantenimiento={mantenimiento} saveMantenimiento={saveMantenimiento} isSavingMant={isSavingMant} showLogoutConfirm={showLogoutConfirm} setShowLogoutConfirm={setShowLogoutConfirm} handleLogout={handleLogout} resolucionBaja={resolucionBaja} setResolucionBaja={setResolucionBaja} submitResolucionBaja={submitResolucionBaja} motivoResolucion={motivoResolucion} setMotivoResolucion={setMotivoResolucion} itemToDelete={itemToDelete} setItemToDelete={setItemToDelete} motivoSolicitudBaja={motivoSolicitudBaja} setMotivoSolicitudBaja={setMotivoSolicitudBaja} confirmDeleteAction={confirmDeleteAction} confirmBackupModal={confirmBackupModal} setConfirmBackupModal={setConfirmBackupModal} handleExportBackupGeneral={handleExportBackupGeneral} pendingCSVImport={pendingCSVImport} setPendingCSVImport={setPendingCSVImport} fileInputRef={fileInputRef} fileInputFuncionariosRef={fileInputFuncionariosRef} executeProcessBienesCSV={executeProcessBienesCSV} executeProcessFuncionariosCSV={executeProcessFuncionariosCSV} previsualizarCSVBienes={previsualizarCSVBienes} showChangelog={showChangelog} setShowChangelog={setShowChangelog} isConsolidatedFC10ModalOpen={isConsolidatedFC10ModalOpen} setIsConsolidatedFC10ModalOpen={setIsConsolidatedFC10ModalOpen} handleGenerateConsolidatedFC10PDF={handleGenerateConsolidatedFC10PDF} isNewFuncionarioModalOpen={isNewFuncionarioModalOpen} setIsNewFuncionarioModalOpen={setIsNewFuncionarioModalOpen} handleSaveManualFuncionario={handleSaveManualFuncionario} showUnsavedChangesModal={showUnsavedChangesModal} setShowUnsavedChangesModal={setShowUnsavedChangesModal} showDependenciaConfirm={showDependenciaConfirm} setShowDependenciaConfirm={setShowDependenciaConfirm} confirmDependenciaChange={confirmDependenciaChange} pendingDependencia={pendingDependencia} clearAllFilters={clearAllFilters} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} openFC03Modal={openFC03Modal}  fc10List={fc10List} fc11List={fc11List}  modoCampo={modoCampo} setModoCampo={setModoCampo} ultimoEscaneo={ultimoEscaneo} setUltimoEscaneo={setUltimoEscaneo} openFichaBien={openFichaBien} />
      </Suspense>
      <AtajosModal isOpen={isAtajosOpen} onClose={() => setIsAtajosOpen(false)} STYLES={STYLES} />
    </div>
  );
}




