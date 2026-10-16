import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { lazyConReintento } from './utils/lazyConReintento';
import SkeletonLoader from './components/SkeletonLoader';
import { STYLES, DEPENDENCIAS_UNP, ESTADOS_CONSERVACION, ORIGENES_FC04, INACTIVITY_LIMIT_MS, PENDIENTE_LABELS, FORMATO_PDF } from './constants/appConstants';
import SimpleBar from './components/SimpleBar';
import { PeriodSelector } from './components/FilterComponents';
import AnimatedNumber from './components/AnimatedNumber';
import CommandPalette from './components/CommandPalette';
import TourGuiado from './components/TourGuiado';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
// Modales de apertura bajo demanda: carga diferida para acelerar el arranque
const BienModal = lazyConReintento(() => import('./components/BienModal'));
const FC04Modal = lazyConReintento(() => import('./components/FC04Modal'));
const FC10Modal = lazyConReintento(() => import('./components/FC10Modal'));
const FC11Modal = lazyConReintento(() => import('./components/FC11Modal'));
import localforage from 'localforage';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';
// Modales pesados: carga diferida para acelerar el arranque
const CSVPreviewModal = lazyConReintento(() => import('./components/CSVPreviewModal'));
import { 
    formatCurrency, formatCI, generateId, parseDateInfo, 
    formatDateText, getEstadoAbbr, normalizeStr, matchSearchWords, matchBienSearch, getPlaceholderLogo,
    convertirImagenABase64, getLogoPorDependencia, comprimirImagen 
} from './utils/helpers';
import { generateSimpleQR, generateProfessionalLabelPNG, buildFC10PDFDoc, buildActaAuditoriaPDF } from './utils/pdfGenerators';
import { conSello, debeResyncTotal, fusionarBienes, ahoraISO } from './services/syncBienes';
import { useToasts } from './hooks/useToasts';
import { useAuditoria } from './hooks/useAuditoria';
import { usePdfHandlers } from './hooks/usePdfHandlers';
import { useFuncionarios } from './hooks/useFuncionarios';
import { useAuthSession } from './hooks/useAuthSession';
import { useInventarioFiltros, ITEMS_POR_PAGINA } from './hooks/useInventarioFiltros';
import { numeroALetras } from './utils/numeroLetras';
import { extraerCodigoQR } from './utils/qr';
import { normalizarBien, tieneValor } from './utils/bienPublico';
import MaintenanceScreen from './components/MaintenanceScreen';
import MantenimientoModal from './components/modals/MantenimientoModal';
import UbicacionesModal from './components/modals/UbicacionesModal';
import DependenciasModal from './components/modals/DependenciasModal';
import AyudaView from './views/AyudaView';
import ResumenView from './views/ResumenView';
import UsuariosView from './views/UsuariosView';
import Fc04View from './views/Fc04View';
import Fc10View from './views/Fc10View';
import Fc11View from './views/Fc11View';
import FuncionariosView from './views/FuncionariosView';
import AprobacionesView from './views/AprobacionesView';
import AuditoriaView from './views/AuditoriaView';
import DashboardView from './views/DashboardView';
import InventarioView from './views/InventarioView';
import FichaBienModal from './components/FichaBienModal';
const LogoutModal = lazyConReintento(() => import('./components/modals/LogoutModal'));
const ResolucionBajaModal = lazyConReintento(() => import('./components/modals/ResolucionBajaModal'));
const DependenciaConfirmModal = lazyConReintento(() => import('./components/modals/DependenciaConfirmModal'));
const QRModal = lazyConReintento(() => import('./components/modals/QRModal'));
const ConsolidadoFC10Modal = lazyConReintento(() => import('./components/modals/ConsolidadoFC10Modal'));
const UsuarioModal = lazyConReintento(() => import('./components/modals/UsuarioModal'));
const NuevoFuncionarioModal = lazyConReintento(() => import('./components/modals/NuevoFuncionarioModal'));
const FuncionarioModal = lazyConReintento(() => import('./components/modals/FuncionarioModal'));
const ScannerModal = lazyConReintento(() => import('./components/modals/ScannerModal'));
const UnsavedChangesModal = lazyConReintento(() => import('./components/modals/UnsavedChangesModal'));
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
  const { toasts, addToast } = useToasts();
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
  const [isSaving, setIsSaving] = useState(false);
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
  const [notificaciones, setNotificaciones] = useState([]);
 
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
  const [isBulkQR, setIsBulkQR] = useState(false);
  const [qrTargetBien, setQrTargetBien] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  // Ficha 360 del bien: timeline de trazabilidad
  const [fichaBien, setFichaBien] = useState(null);
  const [eventosAuditFicha, setEventosAuditFicha] = useState([]);
  const openFichaBien = async (bien) => {
    if (!bien) return;
    setFichaBien(bien);
    setEventosAuditFicha([]);
    try {
      const { data, error } = await supabase.from('auditoria').select('*').eq('bienid', bien.id).order('fecha', { ascending: false }).limit(100);
      if (!error && data) setEventosAuditFicha(data);
    } catch (e) {}
  };
  
  const [isBienModalOpen, setIsBienModalOpen] = useState(false);
  const [bienEditing, setBienEditing] = useState(null);
  const bienFormRef = useRef(null);

  const [isFC10ModalOpen, setIsFC10ModalOpen] = useState(false);
  const [fc10TargetBien, setFc10TargetBien] = useState(null);
  const [fc10Editing, setFc10Editing] = useState(null);

  const [isFC11ModalOpen, setIsFC11ModalOpen] = useState(false);
  const [fc11TargetBien, setFc11TargetBien] = useState(null);
  const [fc11Editing, setFc11Editing] = useState(null);
  const [fc11FormNumber, setFc11FormNumber] = useState('');

  const [isFC04ModalOpen, setIsFC04ModalOpen] = useState(false);
  const [fc04Editing, setFc04Editing] = useState(null);
  const [fc04Items, setFc04Items] = useState([]);
  const [fc04SinMovimiento, setFc04SinMovimiento] = useState(false);

  const [isFC03ModalOpen, setIsFC03ModalOpen] = useState(false);
  const [fc03Config, setFc03Config] = useState({ tipoFiltro: 'general', filtroValor: '', lugar: 'Pilar' });
  const [fc03FuncionarioTexto, setFc03FuncionarioTexto] = useState('');
  const [showFC03FuncDropdown, setShowFC03FuncDropdown] = useState(false);

  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioEditing, setUsuarioEditing] = useState(null);


  const [itemToDelete, setItemToDelete] = useState(null);
  const [motivoSolicitudBaja, setMotivoSolicitudBaja] = useState('');
  const [confirmBackupModal, setConfirmBackupModal] = useState(false);
  const [pendingCSVImport, setPendingCSVImport] = useState(null);
  const [resolucionBaja, setResolucionBaja] = useState(null);
  const [motivoResolucion, setMotivoResolucion] = useState('');

  const [dbError, setDbError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fileInputRef = useRef(null);
  const fileInputFuncionariosRef = useRef(null);

  const [fc10List, setFc10List] = useState([]); 
  const [fc11List, setFc11List] = useState([]); 
  const [fc04List, setFc04List] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]); 
  const [funcionariosPadron, setFuncionariosPadron] = useState([]); 
  const [estructurasDB, setEstructurasDB] = useState([]);
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
    stats, pendientes, filteredBienes, paginatedBienes, itemsPaginados, totalPages
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
      const { error } = await supabase.from('funcionarios').update({ ubicacion: ubicacionNombre || '' }).eq('id', funcId);
      if (error) throw error;
      setFuncionariosPadron(prev => prev.map(f => (f.id === funcId ? { ...f, ubicacion: ubicacionNombre || '' } : f)));
      addToast(ubicacionNombre ? 'Funcionario asignado a la ubicación.' : 'Funcionario sin ubicación.', 'success');
    } catch (e) {
      addToast('No se pudo asignar.', 'error');
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
  // Atajo "/": enfoca el buscador del inventario · Ctrl/Cmd+K: paleta global
  const searchRef = useRef(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (activeTab !== 'inventario') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab]);
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
      { tab: 'inventario', selector: '[data-tour="inv-table"]', titulo: 'Acciones por fila', texto: 'Desde cada bien: ficha 360 con trazabilidad, QR, acta FC-10, traslado, edición y duplicado.' },
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


  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);

    // --- 1. VALIDACIÓN DE ROL EN SERVIDOR ---
    if (currentUser?.username) {
        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
          .select('username, cargo, dependencia')
          .eq('username', currentUser.username)
          .maybeSingle();

        if (userError || !dbUser) {
          addToast("Sesión no válida o usuario inexistente.", "error");
          handleLogout();
          return;
        }

        const esAdminEnDB = dbUser.cargo === 'admin';
        if (currentUser.role === 'admin' && !esAdminEnDB) {
          addToast("Se detectó una alteración no autorizada en los permisos de sesión.", "error");
          handleLogout();
          return;
        }
      }
    // --- FIN DE VALIDACIÓN DE ROL ---

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de red')), 8000)
      );

      const fetchPromise = (async () => {
        // --- BIENES: descarga total solo si hace falta, si no delta por updated_at ---
        const CACHE_BIENES = `bienes_cache_${dependenciaActual}`;
        const META_BIENES = `bienes_meta_${dependenciaActual}`;
        let metaBienes = null;
        let cacheBienes = null;
        try { metaBienes = await localforage.getItem(META_BIENES); } catch (e) {}
        try { cacheBienes = await localforage.getItem(CACHE_BIENES); } catch (e) {}
        const descargaTotal = debeResyncTotal(metaBienes) || !Array.isArray(cacheBienes);

        if (descargaTotal) {
        let todosLosNuevosBienes = [];
        let rangeSize = 1000;
        let from = 0;
        let to = rangeSize - 1;
        let keepFetchingBienes = true;

        while (keepFetchingBienes) {
          let query = supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual);

          const { data: batch, error } = await query.range(from, to);

          if (error || !batch || batch.length === 0) {
            keepFetchingBienes = false;
          } else {
            for (const item of batch) todosLosNuevosBienes.push(item);
            if (batch.length < rangeSize) {
              keepFetchingBienes = false;
            } else {
              from += rangeSize;
              to += rangeSize;
            }
          }
        }

        const { lista: inventarioFinal, maxUpdatedAt } = fusionarBienes([], todosLosNuevosBienes, dependenciaActual);
        if (inventarioFinal.length > 0) {
          await localforage.setItem(CACHE_BIENES, inventarioFinal);
          // Si ninguna fila trae sello (datos legacy), el punto de sync es "ahora":
          // desde aquí, toda edición ya sale sellada y entra en el delta.
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || ahoraISO(), actualizadoEn: Date.now() });
          setBienes(inventarioFinal);
        } else {
          setBienes([]);
        }
        } else {
          // Delta: solo filas tocadas desde la última sincronización (KB, no MB).
          const { data: cambios, error: errorDelta } = await supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual)
            .gt('updated_at', metaBienes.updated_at);
          if (errorDelta) throw errorDelta;
          const { lista, maxUpdatedAt } = fusionarBienes(cacheBienes, cambios || [], dependenciaActual);
          await localforage.setItem(CACHE_BIENES, lista);
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || metaBienes.updated_at, actualizadoEn: Date.now() });
          setBienes(lista);
        }

        const [resFc10, resFc11, resFc04, resEstructuras, resAuditoria, resUsuarios, resFuncionarios] = await Promise.all([ 
            supabase.from('fc10').select('id, data').eq('data->>dependencia', dependenciaActual),
            supabase.from('fc11').select('id, data'), 
            supabase.from('fc04').select('id, data').eq('data->>dependencia', dependenciaActual),
            supabase.from('estructuras').select('id, data'), 
            supabase.from('notificaciones').select('*'),
            supabase.from('usuarios').select('username, nombre, cargo, dependencia'),
            supabase.from('funcionarios').select('*')
        ]);

        const parseDirect = (resData) => {
            if (!resData) return [];
            return resData.map(item => {
                if (item.data) {
                    let parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                    return { id: item.id, ...parsed };
                }
                return item;
            });
        };

        setFc10List(parseDirect(resFc10.data)); 
        setFc11List(parseDirect(resFc11.data));
        setFc04List(parseDirect(resFc04.data)); 
        setEstructurasDB(parseDirect(resEstructuras.data));
        
        const notifData = resAuditoria.data || [];
        setNotificaciones(notifData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));
        
        setUsuariosList(resUsuarios.data || []);
        
        const funcsData = resFuncionarios.data || [];
        setFuncionariosPadron(funcsData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));
        
        setDbError(false);
      })();

      await Promise.race([fetchPromise, timeoutPromise]);

    } catch (error) { 
        console.error("Error crítico de datos:", error);
        if (!isSilent) setDbError(true);
        
        try {
            const cachedBienes = await localforage.getItem(`bienes_cache_${dependenciaActual}`);
            if (cachedBienes && cachedBienes.length > 0) {
                setBienes(cachedBienes);
            }
        } catch (e) {}
    } finally { 
        setIsLoading(false); 
    }
  }, [dependenciaActual, currentUser, handleLogout]);
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
  // --- MOTOR DE ARRANQUE DE DATOS ---
  useEffect(() => { 
      if (isAuthenticated) {
          fetchData(false); 
          cargarNotificaciones();
          const notifInterval = setInterval(() => { if (!document.hidden) sondearNotificaciones(); }, 30000);
          const notifChannel = supabase.channel("notif-realtime").on("postgres_changes", { event: "*", schema: "public", table: "notificaciones" }, (payload) => { fusionarNotificacion(payload); }).subscribe();
          // Tiempo real en bienes: lo que cambia en un equipo (ej: foto desde el celular)
          // se refleja solo en los demás, sin refrescar
          const bensChannel = supabase.channel("bens-realtime").on("postgres_changes", { event: "*", schema: "public", table: "bens" }, (payload) => {
              try {
                  if (payload.eventType === 'DELETE') {
                      if (payload.old?.id) {
                        setBienes(prev => prev.filter(b => b.id !== payload.old.id));
                        // La caché también debe olvidar el borrado o el próximo delta lo resucita.
                        localforage.getItem(`bienes_cache_${dependenciaActual}`).then(cache => {
                          if (Array.isArray(cache)) localforage.setItem(`bienes_cache_${dependenciaActual}`, cache.filter(b => b.id !== payload.old.id));
                        }).catch(() => {});
                      }
                      return;
                  }
                  const row = payload.new;
                  if (!row) return;
                  const d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
                  // El canal trae cambios de TODAS las dependencias: lo ajeno no se mezcla.
                  if ((d.dependencia || '') !== dependenciaActual) {
                      setBienes(prev => prev.filter(b => b.id !== row.id));
                      return;
                  }
                  const bien = { id: row.id, ...d };
                  setBienes(prev => {
                      const i = prev.findIndex(b => b.id === bien.id);
                      if (i === -1) return [...prev, bien];
                      const copia = [...prev];
                      copia[i] = bien;
                      return copia;
                  });
                  setFichaBien(prev => (prev && prev.id === bien.id ? bien : prev));
              } catch (e) {}
          }).subscribe();
          return () => {
              clearInterval(notifInterval);
              supabase.removeChannel(notifChannel);
              supabase.removeChannel(bensChannel);
          };
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);
  // -----------------------------------


  // Listas únicas, stats, pendientes, filtrado y paginación: todo vive en
  // useInventarioFiltros (Fase 3). La UI usa los mismos nombres.


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

  // --- EN App_2.jsx ---


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




  const openFC03Modal = () => {
      setFc03Config({ tipoFiltro: 'general', filtroValor: '', lugar: 'Pilar' });
      setFc03FuncionarioTexto('');
      setShowFC03FuncDropdown(false);
      setIsFC03ModalOpen(true);
  };

  const executeGenerateFC03 = () => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast("Cargando librerías PDF...", "warning");
    
    let bienesToPrint = filteredBienes.filter(b => b.estadoConservacion !== 'De Baja');
    
    let repText = "INVENTARIO GENERAL";
    let funcText = "TODOS LOS RESPONSABLES";

    if (fc03Config.tipoFiltro === 'ubicacion' && fc03Config.filtroValor) {
        bienesToPrint = bienesToPrint.filter(b => normalizeStr(b.ubicacion) === normalizeStr(fc03Config.filtroValor));
        repText = fc03Config.filtroValor.toUpperCase();
    } else if (fc03Config.tipoFiltro === 'funcionario' && fc03Config.filtroValor) {
        bienesToPrint = bienesToPrint.filter(b => normalizeStr(b.funcionario) === normalizeStr(fc03Config.filtroValor));
        funcText = fc03Config.filtroValor.toUpperCase();
        const bienRef = bienesToPrint.find(b => b.ubicacion);
        if (bienRef) repText = bienRef.ubicacion.toUpperCase();
    }

    if (bienesToPrint.length === 0) return addToast("No se encontraron bienes activos para los filtros aplicados.", "warning");
    setIsProcessing({ active: true, text: 'Generando Reporte Oficial FC-03...' }); 
    const todayStr = new Date().toLocaleDateString('es-PY');
    
    setTimeout(async () => {
      try {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('l', 'mm', FORMATO_PDF); 
        const pageWidth = doc.internal.pageSize.width; 
        const pageHeight = doc.internal.pageSize.height;
        const logoImg = await resolveLogoImg(dependenciaActual); 

        let totalValor = 0;
        
        const tableRows = bienesToPrint.map(b => {
            const valor = parseInt(String(b.valorUnitario).replace(/\D/g, ''), 10) || 0;
            totalValor += valor;
            return [
                b.cuenta || '', b.subcuenta || '', b.analitico1 || '', b.analitico2 || '', 
                b.descripcion || '', b.ubicacion || '-', b.funcionario || 'Sin Asignar', 
                formatDateText(b.fechaAdquisicion) || '', b.rotulo || 'S/Rótulo', '1', 
                formatCurrency(valor), formatCurrency(valor), 'C', getEstadoAbbr(b.estadoConservacion), '', ''
            ];
        });

        // Número a letras: helper puro en utils/numeroLetras (Fase 1).
        const strTotal = formatCurrency(totalValor);
        
        tableRows.push([
            { content: 'TOTAL', colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: strTotal, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: strTotal, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '', colSpan: 4 }
        ]);
        tableRows.push([
            { content: 'TOTAL GENERAL', colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: strTotal, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: strTotal, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '', colSpan: 4 }
        ]);
        tableRows.push([
            { content: `SON GUARANIES: ${numeroALetras(totalValor).toLowerCase()}`, colSpan: 16, styles: { fontStyle: 'bold', halign: 'left', cellPadding: 2 } }
        ]);
        
        doc.autoTable({ 
            startY: 72, 
            margin: { top: 72, bottom: 35, left: 10, right: 10 }, 
            theme: 'grid', 
            head: [
                [
                    { content: 'CUENTA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'SUB\nCTA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'ESPECIFICACIÓN', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'DESCRIPCIÓN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'UBICACIÓN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'FUNCIONARIO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'EN REGISTROS Y/O DOCUMENTO', colSpan: 5, styles: { halign: 'center' } },
                    { content: 'INVENTARIO\nFÍSICO', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'DIFERENCIA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'OBS.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
                ],
                [
                    { content: 'An. 1', styles: { halign: 'center' } },
                    { content: 'An. 2', styles: { halign: 'center' } },
                    { content: 'FECHA\nADQUISICIÓN', styles: { halign: 'center' } },
                    { content: 'ROTULADO', styles: { halign: 'center' } },
                    { content: 'CANT.', styles: { halign: 'center' } },
                    { content: 'VALOR\nUNIT.', styles: { halign: 'center' } },
                    { content: 'VALOR\nTOTAL', styles: { halign: 'center' } },
                    { content: 'BIENES', styles: { halign: 'center' } },
                    { content: 'ESTADO', styles: { halign: 'center' } }
                ]
            ], 
            body: tableRows, rowPageBreak: 'avoid',
            styles: { fontSize: 6, cellPadding: 1, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.15 }, 
            headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', textColor: [0,0,0], lineWidth: 0.3 }, 
            didDrawPage: function(data) {
                doc.addImage(logoImg, 'PNG', 12, 6, 18, 18); 
                doc.setFont("helvetica", "bold"); doc.setFontSize(12); 
                doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, 11, { align: 'center' }); 
                doc.setFontSize(9.5); 
                doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, 16, { align: 'center' }); 
                doc.setFontSize(10.5); 
                doc.text("INVENTARIO DE BIENES DE USO (FC-03)", pageWidth / 2, 22, { align: 'center' }); 
                
                doc.setFontSize(8); doc.setFont("helvetica", "bold");
                doc.text("F.C. - 03", 10, 29);
                
                doc.setDrawColor(0); doc.setLineWidth(0.2);
                doc.rect(10, 31, pageWidth - 20, 39); 
                
                doc.line(10, 38.6, 140, 38.6);
                doc.line(10, 46.2, 140, 46.2);
                doc.line(10, 53.8, 140, 53.8);
                doc.line(10, 61.4, 140, 61.4);
                
                doc.line(195, 37.5, pageWidth - 10, 37.5); 
                doc.line(195, 43.5, pageWidth - 10, 43.5); 
                doc.line(195, 49.5, pageWidth - 10, 49.5); 
                doc.line(195, 55.5, pageWidth - 10, 55.5); 

                doc.line(42, 31, 42, 70); 
                doc.line(140, 31, 140, 70); 
                doc.line(195, 31, 195, 70); 
                doc.line(235, 55.5, 235, 70); 

                doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
                doc.text("ENTIDAD", 12, 35.5);
                doc.text("UNIDAD JERÁRQUICA", 12, 43.1);
                doc.text("REPARTICIÓN", 12, 50.7);
                doc.text("DEPENDENCIA", 12, 58.3);
                doc.text("ÁREA", 12, 65.9);

                doc.setFont("helvetica", "normal");
                doc.text("28 - UNIVERSIDAD NACIONAL DE PILAR", 44, 35.5);
                doc.text(dependenciaActual.toUpperCase(), 44, 43.1, { maxWidth: 94 });
                doc.text(repText, 44, 50.7, { maxWidth: 94 });
                doc.text(dependenciaActual.toUpperCase(), 44, 58.3, { maxWidth: 94 });
                doc.text(`${repText} (Resp: ${funcText})`, 44, 65.9, { maxWidth: 94 });

                doc.setFont("helvetica", "bold"); doc.text("ESTADO DE CONSERVACIÓN", 142, 35.5);
                doc.setFont("helvetica", "normal");
                doc.text("MB........Muy Bueno", 142, 43.1);
                doc.text("B..........Bueno", 142, 50.7);
                doc.text("R..........Regular", 142, 58.3);
                doc.text("M.........Malo", 142, 65.9);

                doc.setFont("helvetica", "bold"); doc.text("BIENES", 197, 35);
                doc.setFont("helvetica", "normal");
                doc.text("NR.... No Registrado", 197, 41);
                doc.text("F.......Faltante", 197, 47);
                doc.text("C...... Conforme", 197, 53);

                doc.setFont("helvetica", "bold");
                doc.text(`Hoja N° ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 35, 35);

                doc.text("Fecha", 197, 59); 
                doc.setFont("helvetica", "normal"); 
                doc.text(todayStr, 238, 59);
                
                doc.setFont("helvetica", "bold"); 
                doc.text("Lugar", 197, 65); 
                doc.setFont("helvetica", "normal"); 
                doc.text(fc03Config.lugar.toUpperCase(), 238, 65);

                const finalY = pageHeight - 18; 
                doc.setDrawColor(0); doc.setLineWidth(0.3);
                const sigWidth = 65;
                
                doc.line(15, finalY, 15 + sigWidth, finalY); 
                doc.setFont("helvetica", "bold"); doc.setFontSize(8); 
                doc.text("Jefe de Dependencia", 15 + (sigWidth/2), finalY + 4, { align: 'center' });
                
                const midX = pageWidth / 2;
                doc.line(midX - (sigWidth/2), finalY, midX + (sigWidth/2), finalY); 
                doc.text("Jefe de Bienes Patrimoniales", midX, finalY + 4, { align: 'center' });

                const rightX = pageWidth - 15 - sigWidth;
                doc.line(rightX, finalY, rightX + sigWidth, finalY); 
                doc.text("Directora General de Administración y Finanzas", rightX + (sigWidth/2), finalY + 4, { align: 'center' });

                doc.setFont("helvetica", "italic"); doc.setFontSize(6); doc.setTextColor(100);
                doc.text("Generado por el Sistema Integrado de Gestión Patrimonial UNP", 14, pageHeight - 4);
                doc.setTextColor(0);
            }
        });
        
        const descFiltro = fc03Config.tipoFiltro === 'general' ? 'General' : fc03Config.filtroValor.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanDepName = dependenciaActual.replace(/\s+/g, '_'); 
        doc.save(`FC03_${cleanDepName}_${descFiltro}_${todayStr}.pdf`); 
        addToast("Reporte Inventario Oficial generado", "success");
      } catch(e) { 
        console.error(e); 
        addToast("Error PDF: " + (e.message || "Desconocido"), "error"); 
      } finally { 
        setIsProcessing({ active: false, text: '' }); 
        setIsFC03ModalOpen(false); 
      }
    }, 100);
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
  
const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingCSVImport({ type: 'bienes', file });
  };

  const executeProcessBienesCSV = async (file) => {

    setIsProcessing({ active: true, text: 'Procesando Planilla Excel (CSV)...' });

    // papaparse se carga bajo demanda: no entra al bundle inicial.
    const { default: Papa } = await import('papaparse');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: async (results) => {
        const newBienes = [];
        let duplicatesSkipped = 0;

        // Mapeo automático de columnas: acepta encabezados con otros nombres,
        // sin tildes, mayúsculas o abreviaturas (ej: "Rotulo", "VALOR", "Fecha").
        const ALIAS_COLUMNAS = {
          rotulo: ['Nº RÓTULO', 'N ROTULO', 'ROTULO', 'RÓTULO', 'CÓDIGO', 'CODIGO'],
          cuenta: ['CUENTA MAYOR', 'CUENTA'],
          subcuenta: ['SUB-CUENTA', 'SUBCUENTA', 'SUB CUENTA'],
          analitico1: ['ANALÍTICO 1', 'ANALITICO 1', 'AN 1', 'AN. 1'],
          analitico2: ['ANALÍTICO 2', 'ANALITICO 2', 'AN 2', 'AN. 2'],
          descripcion: ['DESCRIPCIÓN GENERAL', 'DESCRIPCION GENERAL', 'DESCRIPCIÓN', 'DESCRIPCION', 'DETALLE'],
          fechaAdquisicion: ['FECHA ADQUISICIÓN (YYYY-MM-DD)', 'FECHA ADQUISICION', 'FECHA ADQUISICIÓN', 'FECHA'],
          valorUnitario: ['VALOR UNITARIO (SIN PUNTOS)', 'VALOR UNITARIO', 'VALOR', 'PRECIO', 'COSTO'],
          vidaUtil: ['VIDA ATIL (AÑOS)', 'VIDA ÚTIL', 'VIDA UTIL', 'VIDA'],
        };
        const encabezados = results.meta.fields || [];
        const buscarColumna = (aliases) => {
          const normas = aliases.map(a => normalizeStr(a));
          return encabezados.find(h => normas.includes(normalizeStr(h))) || null;
        };
        const COL = {};
        Object.keys(ALIAS_COLUMNAS).forEach(k => { COL[k] = buscarColumna(ALIAS_COLUMNAS[k]); });
        const val = (row, c) => (c ? String(row[c] ?? '').trim() : '');

        results.data.forEach(row => {
          // Mapeo seguro de columnas independientemente del nombre exacto de la cabecera
          const rotuloCSV = val(row, COL.rotulo);
          if (!rotuloCSV) return;

          const isDuplicateDB = bienes.some(b => 
            normalizeStr(b.rotulo) === normalizeStr(rotuloCSV) && 
            b.dependencia === dependenciaActual
          );

          if (isDuplicateDB) {
            duplicatesSkipped++;
            return;
          }

          newBienes.push({
            id: generateId(),
            dependencia: dependenciaActual,
            cuenta: val(row, COL.cuenta),
            subcuenta: val(row, COL.subcuenta),
            analitico1: val(row, COL.analitico1),
            analitico2: val(row, COL.analitico2),
            descripcion: val(row, COL.descripcion),
            fechaAdquisicion: val(row, COL.fechaAdquisicion),
            rotulo: rotuloCSV,
            valorUnitario: (val(row, COL.valorUnitario) || '0').replace(/\D/g, ''),
            vidaUtil: val(row, COL.vidaUtil),
            funcionario: '',
            ubicacion: '',
            hasFC10: false,
            hasQR: false,
            estadoConservacion: 'Muy bueno'
          });
        });

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
            addToast("Error al guardar registros en la base de datos.", "error");
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
        addToast("Error al procesar el archivo CSV.", "error");
        setIsProcessing({ active: false, text: '' });
      }
    });
  };
  // --- BACKUP GENERAL DE PROTECCIÓN DEL SISTEMA (SOLO ADMINS) ---





  const saveUsuario = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const userData = Object.fromEntries(f.entries());
    // La clave vive en Supabase Auth: nunca guardar texto plano en la tabla
    delete userData.password;
    // Solo el desarrollador puede otorgar rol de desarrollador
    if (userData.cargo === 'desarrollador' && !esDesarrollador) {
      return addToast('Solo el Desarrollador del Sistema puede otorgar ese rol.', 'error');
    }
    // Proteger cuentas de desarrollador existentes
    if (usuarioEditing?.cargo === 'desarrollador' && !esDesarrollador) {
      return addToast('Solo el Desarrollador del Sistema gestiona esa cuenta.', 'error');
    }
    
    try {
        let res;
        if (usuarioEditing) {
            const updateData = { nombre: userData.nombre, cargo: userData.cargo, dependencia: userData.dependencia };
            res = await supabase.from('usuarios').update(updateData).eq('username', usuarioEditing.username);
        } else {
            res = await supabase.from('usuarios').insert([userData]);
        }
        
        if (!res.error) {
            addToast(usuarioEditing ? "Usuario actualizado" : "Usuario creado", "success");
            setIsUsuarioModalOpen(false);
            if (usuarioEditing) {
                setUsuariosList(prev => prev.map(u => u.username === usuarioEditing.username ? { ...u, nombre: userData.nombre, cargo: userData.cargo, dependencia: userData.dependencia } : u));
            } else {
                setUsuariosList(prev => [...prev, userData]);
            }
        } else {
            addToast(res.error.message || "Error al procesar la solicitud", "error");
        }
    } catch (error) {
        addToast("Error de conexión.", "error");
    }
  };

  const saveBien = async (e, keepOpen = false) => {
    if(e) e.preventDefault(); 
    if (isSaving) return;

    const form = bienFormRef.current;
    if (!form || !form.reportValidity()) return;

    setIsSaving(true);
    setIsProcessing({ active: true, text: 'Guardando y sincronizando activo...' });

    const formData = new FormData(form); 
    const rotuloInput = formData.get('rotulo').trim(); 
    const isDuplicate = bienes.some(b => b.rotulo.toLowerCase() === rotuloInput.toLowerCase() && b.dependencia === dependenciaActual && (!bienEditing || b.id !== bienEditing.id)); 
    if (isDuplicate) { 
        addToast(`El rótulo "${rotuloInput}" ya está registrado en esta dependencia.`, "error"); 
        setIsSaving(false);
        setIsProcessing({ active: false, text: '' });
        return; 
    }

    const funcNombre = formData.get('funcionario').trim();
    let funcDoc = formData.get('funcionarioDoc')?.trim() || '';
    let funcCargo = formData.get('funcionarioCargo')?.trim() || '';

    if (funcNombre) {
        const matchPadron = funcionariosPadron.find(f => 
            normalizeStr(f.nombre) === normalizeStr(funcNombre) || 
            String(f.cedula).trim() === funcDoc.replace(/\./g, '')
        );
        if (matchPadron) {
            funcDoc = matchPadron.cedula;
            funcCargo = matchPadron.cargo || funcCargo;
        }
    }
    
    const bienData = { 
        id: bienEditing ? bienEditing.id : generateId(), 
        dependencia: dependenciaActual, 
        cuenta: formData.get('cuenta') || '', 
        subcuenta: formData.get('subcuenta') || '', 
        analitico1: formData.get('analitico1') || '', 
        analitico2: formData.get('analitico2') || '', 
        descripcion: formData.get('descripcion'), 
        fechaAdquisicion: formData.get('fechaAdquisicion'), 
        rotulo: rotuloInput, 
        valorUnitario: formData.get('valorUnitario').replace(/\./g, ''), 
        funcionario: funcNombre, 
        funcionarioDoc: funcDoc, 
        funcionarioCargo: funcCargo, 
        ubicacion: formData.get('ubicacion').trim(), 
        estadoConservacion: formData.get('estadoConservacion') || 'Muy bueno', 
        vidaUtil: formData.get('vidaUtil') || '', 
        hasFC10: bienEditing ? bienEditing.hasFC10 : false, 
        hasQR: formData.get('hasQR') === 'on',
        // Preservar fotos existentes (no vienen en el formulario)
        fotos: bienEditing?.fotos || []
    };
    
    try { 
        // xÓ AQUÍ SE INTERCEPTA EL MODO OFFLINE
        if (!navigator.onLine) {
            await enqueueOfflineAction({ type: 'SAVE_BIEN', payload: bienData });
            
            // Actualizamos el estado de la app y la caché IndexedDB
            setBienes(prev => [bienData, ...prev.filter(b => b.id !== bienData.id)]);
            const cacheActual = (await localforage.getItem(`bienes_cache_${dependenciaActual}`)) || [];
            await localforage.setItem(`bienes_cache_${dependenciaActual}`, [bienData, ...cacheActual.filter(b => b.id !== bienData.id)]);

            setIsBienModalOpen(false);
            setIsSaving(false);
            setIsProcessing({ active: false, text: '' });
            return addToast(`Guardado localmente. Se sincronizará al recuperar la señal.`, "warning");
        }

        let res;
        const payload = conSello({ id: bienData.id, data: bienData });
        if (bienEditing) {
            res = await supabase.from('bens').update(payload).eq('id', bienData.id);
        } else {
            res = await supabase.from('bens').insert([payload]);
        }

        if (!res.error) {
            await registrarAuditoria({
                usuario: currentUser?.username || 'Usuario',
                dependencia: dependenciaActual,
                accion: bienEditing ? 'MODIFICACION' : 'CREACION',
                entidad: 'BIEN',
                entidadId: bienData.id,
                detalles: {
                    rotulo: bienData.rotulo,
                    descripcion: bienData.descripcion,
                    cambios: bienEditing ? { anterior: bienEditing, nuevo: bienData } : bienData
                }
            });

            if (funcNombre && funcDoc) {
                const funcExists = funcionariosPadron.find(f => f.cedula === funcDoc && f.dependencia === dependenciaActual);
                if (!funcExists) {
                    const newFunc = { id: generateId(), cedula: funcDoc, nombre: funcNombre, cargo: funcCargo, dependencia: dependenciaActual };
                    await supabase.from('funcionarios').insert([newFunc]);
                    setFuncionariosPadron(prev => [...prev, newFunc]);
                }
            }

            setBienes(prev => {
                if (bienEditing) {
                    return prev.map(b => b.id === bienData.id ? bienData : b);
                } else {
                    return [bienData, ...prev];
                }
            });

            const cacheActual = await localforage.getItem(`bienes_cache_${dependenciaActual}`) || [];
            let nuevoCache = [...cacheActual];
            const idxCache = nuevoCache.findIndex(b => b.id === bienData.id);
            if (idxCache !== -1) {
                nuevoCache[idxCache] = bienData;
            } else {
                nuevoCache.push(bienData);
            }
            await localforage.setItem(`bienes_cache_${dependenciaActual}`, nuevoCache);

            if (keepOpen) {
                addToast(`"${rotuloInput}" guardado y sincronizado.`, "success");
                form.elements['rotulo'].value = '';
                form.elements['descripcion'].value = '';
                if(form.elements['hasQR']) form.elements['hasQR'].checked = false;
                form.elements['rotulo'].focus();
                setBienEditing(null);
            } else {
                setIsBienModalOpen(false); 
                addToast("Bien guardado y actualizado con el padrón", "success"); 
            }
        } else {
            addToast("Error al guardar en el servidor.", "error");
        }
    } catch (e) { 
        addToast("Error al guardar.", "error"); 
    } finally {
        setIsSaving(false);
        setIsProcessing({ active: false, text: '' });
    }
  };

  const saveFC11 = async (e) => {
    e.preventDefault(); 
    const f = new FormData(e.target); 
    const fc11Data = { id: fc11Editing ? fc11Editing.id : generateId(), numeroFormulario: f.get('numeroFormulario'), fecha: f.get('fecha'), dependenciaRemitente: dependenciaActual, areaRemitente: f.get('areaRemitente'), dependenciaDestinataria: f.get('dependenciaDestinataria'), areaDestinataria: f.get('areaDestinataria'), motivo: f.get('motivo'), estadoConservacion: f.get('estadoConservacion'), observaciones: f.get('observaciones'), bienId: fc11TargetBien.id, bienSnapshot: fc11TargetBien, tipoRegistro: 'FC11' }; 
    const esMovimientoInterno = fc11Data.dependenciaRemitente === fc11Data.dependenciaDestinataria; 
    const updatedBien = { ...fc11TargetBien, dependencia: fc11Data.dependenciaDestinataria, estadoConservacion: fc11Data.estadoConservacion, hasFC10: false, funcionario: esMovimientoInterno ? fc11TargetBien.funcionario : '', ubicacion: esMovimientoInterno ? fc11TargetBien.ubicacion : '' };
    const payloadFC11 = { id: fc11Data.id, data: fc11Data };

    try {
      let res;
      if (fc11Editing) {
          res = await supabase.from('fc11').update(payloadFC11).eq('id', fc11Data.id);
      } else {
          res = await supabase.from('fc11').insert([payloadFC11]);
      }
      if (res?.error) throw res.error;

      const openFc10 = fc10List.find(fc => fc.bienId === fc11TargetBien.id && !fc.devolucionFecha); 
      if (openFc10) { 
          const closedFc10 = { ...openFc10, devolucionFecha: new Date().toISOString().split('T')[0], devolucionLugar: "Traslado FC-11", devolucionReceptor: "Sistema" }; 
          await supabase.from('fc10').update({ data: closedFc10 }).eq('id', closedFc10.id);
          setFc10List(prev => prev.map(fc => fc.id === closedFc10.id ? closedFc10 : fc)); 
      }

      await supabase.from('bens').update(conSello({ data: updatedBien })).eq('id', updatedBien.id);
      
      if (fc11Editing) setFc11List(prev => prev.map(item => item.id === fc11Data.id ? fc11Data : item)); else setFc11List(prev => [fc11Data, ...prev]);
      if (esMovimientoInterno) { setBienes(prev => prev.map(b => b.id === updatedBien.id ? updatedBien : b)); addToast(`Movimiento interno registrado en ${fc11Data.dependenciaDestinataria}.`, "warning"); } else { setBienes(prev => prev.filter(b => b.id !== updatedBien.id)); addToast(`El bien fue transferido a ${fc11Data.dependenciaDestinataria}.`, "success"); } setIsFC11ModalOpen(false);
    } catch (error) { console.error(error); addToast("Error al registrar FC-11.", "error"); }
  };

  const saveFC04 = async (e) => {
    e.preventDefault(); 
    const f = new FormData(e.target); 
    const fc04Data = { id: fc04Editing ? fc04Editing.id : generateId(), dependencia: dependenciaActual, mes: f.get('mes'), anio: f.get('anio'), origenMovimiento: f.get('origenMovimiento'), sinMovimiento: fc04SinMovimiento, bienesSnapshot: fc04SinMovimiento ? [] : fc04Items, fechaRegistro: new Date().toISOString(), tipoRegistro: 'FC04' };
    const payloadFC04 = { id: fc04Data.id, data: fc04Data };

    try {
      let res;
      if (fc04Editing) {
          res = await supabase.from('fc04').update(payloadFC04).eq('id', fc04Data.id);
      } else {
          res = await supabase.from('fc04').insert([payloadFC04]);
      }
      if (res?.error) throw res.error;

      if (!fc04SinMovimiento && fc04Items.length > 0) {
          const isBaja = fc04Data.origenMovimiento === 'B'; 
          const newBienes = []; 
          const updatedBienes = [];
          
          for (const item of fc04Items) {
              const existingBien = bienes.find(b => b.rotulo.toLowerCase() === item.rotulo.toLowerCase() && b.dependencia === dependenciaActual);
              if (isBaja) { 
                  if (existingBien) updatedBienes.push({ ...existingBien, estadoConservacion: 'De Baja' }); 
              } else if (!existingBien && (fc04Data.origenMovimiento === 'A' || fc04Data.origenMovimiento === 'C/D')) { 
                  newBienes.push({ id: generateId(), dependencia: dependenciaActual, cuenta: item.cuenta || '', subcuenta: item.subcuenta || '', analitico1: item.analitico1 || '', analitico2: item.analitico2 || '', descripcion: item.descripcion || '', rotulo: item.rotulo || '', valorUnitario: String(item.valorUnitario).replace(/\./g, ''), fechaAdquisicion: item.fechaAdquisicion || '', vidaUtil: item.vidaUtil || '', funcionario: '', ubicacion: '', hasFC10: false, hasQR: false, estadoConservacion: 'Muy bueno' }); 
              }
          }
          if (newBienes.length > 0) { 
              const payloadNewBienes = newBienes.map(b => conSello({ id: b.id, data: b }));
              await supabase.from('bens').insert(payloadNewBienes);
              setBienes(prev => [...newBienes, ...prev]); 
              addToast(`${newBienes.length} bienes inyectados.`, "success"); 
          }
          if (updatedBienes.length > 0) { 
              for (const b of updatedBienes) {
                  await supabase.from('bens').update(conSello({ data: b })).eq('id', b.id);
              }
              setBienes(prev => prev.map(old => updatedBienes.find(upd => upd.id === old.id) || old)); 
              addToast(`${updatedBienes.length} bajas registradas.`, "success"); 
          }
      }
      if (fc04Editing) setFc04List(prev => prev.map(item => item.id === fc04Data.id ? fc04Data : item)); else setFc04List(prev => [fc04Data, ...prev]); setIsFC04ModalOpen(false);
      addToast("Expediente FC-04 guardado", "success");
    } catch (error) { console.error(error); addToast("Error guardando FC-04.", "error"); }
  };

  const saveFC10 = async (e) => {
    e.preventDefault(); 
    const formData = new FormData(e.target); 
    const orgDataToSave = { unidad: formData.get('unidad'), unidadCod: formData.get('unidadCod'), reparticion: formData.get('reparticion'), reparticionCod: formData.get('reparticionCod'), dependenciaOrg: formData.get('dependenciaOrg'), dependenciaCod: formData.get('dependenciaCod'), area: formData.get('area'), areaCod: formData.get('areaCod') }; 
    localStorage.setItem('unp_last_org_data', JSON.stringify(orgDataToSave)); 
    
    const fcData = { id: fc10Editing ? fc10Editing.id : generateId(), bienId: fc10TargetBien.id, dependencia: dependenciaActual, fechaGeneracion: new Date().toISOString().split('T')[0], entidad: "UNIVERSIDAD NACIONAL DE PILAR", entidadCod: "28", unidad: orgDataToSave.unidad, unidadCod: orgDataToSave.unidadCod, reparticion: orgDataToSave.reparticion, reparticionCod: orgDataToSave.reparticionCod, dependenciaOrg: orgDataToSave.dependenciaOrg, dependenciaCod: orgDataToSave.dependenciaCod, area: orgDataToSave.area, areaCod: orgDataToSave.areaCod, funcionarioNombre: formData.get('funcionarioNombre'), funcionarioDoc: formData.get('funcionarioDoc'), funcionarioCargo: formData.get('funcionarioCargo'), estadoConservacion: formData.get('estadoConservacion'), cantidad: formData.get('cantidad') || '1', valorTotal: formData.get('valorTotal').replace(/\./g, ''), observaciones: formData.get('observaciones'), entregadoLugar: formData.get('entregadoLugar'), entregadoFecha: formData.get('entregadoFecha'), devolucionLugar: formData.get('devolucionLugar'), devolucionFecha: formData.get('devolucionFecha'), devolucionReceptor: formData.get('devolucionReceptor'), devolucionCargoReceptor: formData.get('devolucionCargoReceptor'), tipoRegistro: 'FC10' }; 
    const isDevuelto = !!fcData.devolucionFecha; 
    const updatedBien = { ...fc10TargetBien, estadoConservacion: fcData.estadoConservacion, hasFC10: !isDevuelto, funcionario: isDevuelto ? '' : fcData.funcionarioNombre, ubicacion: isDevuelto ? '' : fc10TargetBien.ubicacion };
    const payloadFC10 = { id: fcData.id, data: fcData };

    try { 
        let res;
        if (fc10Editing) {
            res = await supabase.from('fc10').update(payloadFC10).eq('id', fcData.id);
        } else {
            res = await supabase.from('fc10').insert([payloadFC10]);
        }
        if (res?.error) throw res.error;

        await supabase.from('bens').update(conSello({ data: updatedBien })).eq('id', updatedBien.id);

        const checkAndAddStructure = async (name, code, tipo) => { 
            if (name && code) { 
                try { 
                    const nameUpper = name.toUpperCase(); 
                    const exists = estructurasDB.find(item => item.nombre.toUpperCase() === nameUpper && item.tipoEstructura === tipo); 
                    if (!exists) { 
                        const newStruct = { id: generateId(), nombre: nameUpper, codigo: code, tipoRegistro: 'ESTRUCTURA', tipoEstructura: tipo }; 
                        setEstructurasDB(prev => [...prev, newStruct]); 
                        await supabase.from('estructuras').insert([{ id: newStruct.id, data: newStruct }]); 
                    } 
                } catch(err) {}
            } 
        }; 
        await checkAndAddStructure(orgDataToSave.unidad, orgDataToSave.unidadCod, 'unidad'); await checkAndAddStructure(orgDataToSave.reparticion, orgDataToSave.reparticionCod, 'reparticion'); await checkAndAddStructure(orgDataToSave.dependenciaOrg, orgDataToSave.dependenciaCod, 'dependencia'); await checkAndAddStructure(orgDataToSave.area, orgDataToSave.areaCod, 'area'); 
        
        setFc10List(prev => fc10Editing ? prev.map(f => f.id === fcData.id ? fcData : f) : [fcData, ...prev]); 
        setBienes(prev => prev.map(b => b.id === updatedBien.id ? updatedBien : b)); 
        setIsFC10ModalOpen(false); 
        addToast(isDevuelto ? "Devolución registrada" : "FC-10 Guardado exitosamente", "success"); 
    } catch (error) { console.error(error); addToast("Error al guardar.", "error"); }
  };
  const markAsRead = async (notif) => {
      if(notif.leido) return;
      const updated = {...notif, leido: true};
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
      try { 
          await supabase.from('notificaciones').update({ data: updated }).eq('id', notif.id);
      } catch(e) {}
  };
  const markAllAsRead = async () => {
      const pendientes = misNotificaciones.filter(n => !n.leido);
      if (pendientes.length === 0) return;
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
      try {
          await Promise.all(pendientes.map(n =>
              supabase.from('notificaciones').update({ data: { ...n, leido: true } }).eq('id', n.id)
          ));
      } catch (e) {}
  };

  const openResolucionModal = (bien, accion, notifOrigen = null) => { setResolucionBaja({ bien, accion, notifOrigen }); setMotivoResolucion(""); };
  const openFC10Modal = (bien, fc = null) => { setFc10TargetBien(bien); setFc10Editing(fc); setIsFC10ModalOpen(true); };
  const openFC11Modal = (bien, fc = null) => { setFc11TargetBien(bien); setFc11Editing(fc); setFc11FormNumber(fc ? fc.numeroFormulario : ''); setIsFC11ModalOpen(true); };
  const openFC04Modal = (fc = null) => { setFc04Editing(fc); if (fc) { setFc04Items(fc.bienesSnapshot || []); setFc04SinMovimiento(fc.sinMovimiento); } else { setFc04Items([]); setFc04SinMovimiento(false); } setIsFC04ModalOpen(true); };
  
  const handleAddFC04Item = () => {
    setFc04Items(prev => [...prev, { 
      id: generateId(), 
      cuenta: '', subcuenta: '', analitico1: '', analitico2: '', 
      rotulo: '', descripcion: '', valorUnitario: '', 
      fechaAdquisicion: '', vidaUtil: '' 
    }]);
  };

  const handleRemoveFC04Item = (id) => {
    setFc04Items(prev => prev.filter(item => item.id !== id));
  };

  const handleFC04ItemChange = (id, field, value) => {
    setFc04Items(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Extracción de código QR: helper puro en utils/qr (Fase 1).
  // Modo conteo: el escáner alimenta la conciliación física en vez de abrir el bien
  const [scanParaConteo, setScanParaConteo] = useState(false);
  const handleScanSuccess = async (decodedText) => {
    const targetId = extraerCodigoQR(decodedText);
    if (scanParaConteo) {
      setIsScannerOpen(false);
      agregarCodigoConteo(targetId);
      // Reabrir para el siguiente escaneo
      setTimeout(() => setIsScannerOpen(true), 350);
      return;
    }
    setIsScannerOpen(false);

    // 1. Buscar en la lista de bienes cargados en memoria
    let bienEncontrado = bienes.find(b => 
      b.id === targetId || 
      normalizeStr(b.rotulo) === normalizeStr(targetId)
    );

    // 2. Si no se encuentra en memoria, consultar directamente en Supabase
    if (!bienEncontrado) {
      setIsProcessing({ active: true, text: 'Buscando activo escaneado en el sistema...' });
      try {
        const { data: dbItem } = await supabase
          .from('bens')
          .select('*')
          .or(`id.eq.${targetId},data->>rotulo.eq.${targetId}`)
          .maybeSingle();

        if (dbItem) {
          const parsed = dbItem.data ? (typeof dbItem.data === 'string' ? JSON.parse(dbItem.data) : dbItem.data) : dbItem;
          bienEncontrado = { id: dbItem.id, ...parsed };

          if (bienEncontrado.dependencia && normalizeStr(bienEncontrado.dependencia) !== normalizeStr(dependenciaActual)) {
            if (isAdmin) {
              setDependenciaActual(bienEncontrado.dependencia);
              addToast(`Activo ubicado en dependencia: ${bienEncontrado.dependencia}`, "info");
            } else {
              addToast(`Este bien pertenece a la dependencia: ${bienEncontrado.dependencia}`, "warning");
            }
          }
        }
      } catch (err) {
        console.error("Error buscando bien escaneado:", err);
      } finally {
        setIsProcessing({ active: false, text: '' });
      }
    }

    if (bienEncontrado) {
      addToast(`Bien localizado: ${bienEncontrado.rotulo} - ${bienEncontrado.descripcion || ''}`, "success");
      clearAllFilters();
      const rotuloLimpio = bienEncontrado.rotulo || '';
      setSearchTerm(rotuloLimpio);
      setSearchInput(rotuloLimpio);
      setActiveTab('inventario');
      setBienEditing(bienEncontrado);
      setIsBienModalOpen(true);
    } else {
      addToast(`Activo "${targetId}" no encontrado en el inventario.`, "warning");
      clearAllFilters();
      setSearchTerm(targetId);
      setSearchInput(targetId);
      setActiveTab('inventario');
    }
  };
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

  const misNotificaciones = useMemo(() => { 
    const directas = notificaciones.filter(n => n.tipoRegistro === 'NOTIFICACION' && n.usuarioDestino === currentUser?.username);

    if (isAdmin) {
      const solicitudesComoNotif = notificaciones
        .filter(n => (n.tipo === 'BAJA_BIEN' || n.tipo === 'BAJA_FUNCIONARIO') && n.estado === 'PENDIENTE')
        .map(n => ({
          id: n.id,
          tipoRegistro: 'NOTIFICACION',
          esSolicitud: true,
          accion: 'solicitud',
          titulo: n.tipo === 'BAJA_FUNCIONARIO'
            ? `Solicitud de padrón: ${n.nombre || 'S/N'}`
            : `Solicitud de Baja: #${n.rotulo || 'S/R'}`,
          mensaje: n.tipo === 'BAJA_FUNCIONARIO'
            ? `${n.solicitante || 'Un funcionario'} solicita eliminar a "${n.nombre || ''}" del padrón. Motivo: ${n.motivo || 'No especificado'}.`
            : `${n.solicitante || 'Un funcionario'} solicita la baja de "${n.descripcion || 'Bien'}". Motivo: ${n.motivo || 'No especificado'}.`,
          fecha: n.created_at || new Date().toISOString(),
          leido: false,
          notifOrigen: n
        }));

      return [...solicitudesComoNotif, ...directas].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    return directas.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 
  }, [notificaciones, currentUser, isAdmin]);

  const unreadCount = misNotificaciones.filter(n => !n.leido).length;
  const saludoBienvenida = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "¡Buenos días";
    if (hora < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }, []);

  const renderPagination = () => (
    <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
      <span className="text-sm text-zinc-500 font-medium">Mostrando <span className="font-bold text-zinc-900 dark:text-white">{(currentPage - 1) * ITEMS_POR_PAGINA + (filteredBienes.length > 0 ? 1 : 0)} - {Math.min(currentPage * ITEMS_POR_PAGINA, filteredBienes.length)}</span> de {filteredBienes.length}</span>
      <div className="flex gap-2">
        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">Anterior</button>
        <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">Siguiente</button>
      </div>
    </div>
  );
  const submitResolucionBaja = async (e) => {
      e.preventDefault();
      const { bien, accion, notifOrigen } = resolucionBaja;
      const motivoFinal = motivoResolucion.trim();
      setIsProcessing({ active: true, text: accion === "aprobar" ? "Aprobando baja..." : "Rechazando solicitud..." });

      try {
          // Encontrar la notificación de solicitud de baja pendiente asociada
          const notifPendiente = notifOrigen || notificaciones.find(
              n => n.tipo === "BAJA_BIEN" && (n.bienId === bien.id || n.bien_id === bien.id) && n.estado === "PENDIENTE"
          );

          const estadoNuevo = accion === "aprobar" ? "APROBADO" : "RECHAZADO";
          const solicitanteUsername = notifPendiente?.solicitante || notifPendiente?.solicitadoPor || bien?.bajaSolicitadaPor || "Usuario";

          // 1. Actualizar estado local inmediatamente para máxima fluidez UX sin recargas
          if (notifPendiente) {
              const notifActualizada = { ...notifPendiente, estado: estadoNuevo, motivoResolucion: motivoFinal, resueltoPor: currentUser?.username || "Admin", resueltoFecha: new Date().toISOString() };
              setNotificaciones(prev => prev.map(n => n.id === notifPendiente.id ? notifActualizada : n));
              await supabase.from("notificaciones").update({ data: notifActualizada }).eq("id", notifPendiente.id);
          }

          // 2. Si se aprueba, marcar bien como "De Baja" en React y Supabase
          if (accion === "aprobar") {
              const bienReal = bienes.find(b => b.id === bien.id) || bien;
              const updatedBien = { ...bienReal, estadoConservacion: "De Baja" };
              setBienes(prev => prev.map(b => b.id === bien.id ? updatedBien : b));
              await supabase.from("bens").update(conSello({ data: updatedBien })).eq("id", bien.id);
              const cacheKey = "bienes_cache_" + (dependenciaActual || "general");
              const cacheActual = (await localforage.getItem(cacheKey)) || [];
              await localforage.setItem(cacheKey, cacheActual.map(b => b.id === bien.id ? updatedBien : b));
          }

          // 3. Crear notificación directa en el buzón del funcionario solicitante
          if (solicitanteUsername) {
              const notifId = generateId();
              const rotuloTxt = bien?.rotulo ? `#${bien.rotulo}` : "";
              const notifUsuario = {
                  id: notifId,
                  tipoRegistro: "NOTIFICACION",
                  usuarioDestino: solicitanteUsername,
                  accion,
                  titulo: accion === "aprobar" ? `Baja Aprobada: Bien ${rotuloTxt}` : `Baja Rechazada: Bien ${rotuloTxt}`,
                  mensaje: accion === "aprobar"
                      ? `La solicitud de baja para el bien "${bien?.descripcion || rotuloTxt}" ha sido APROBADA por la administración.${motivoFinal ? " Motivo: " + motivoFinal : ""}`
                      : `La solicitud de baja para el bien "${bien?.descripcion || rotuloTxt}" ha sido RECHAZADA.${motivoFinal ? " Motivo: " + motivoFinal : ""}`,
                  leido: false,
                  fecha: new Date().toISOString(),
                  bienId: bien.id
              };
              setNotificaciones(prev => [notifUsuario, ...prev]);
              await supabase.from("notificaciones").insert([{ id: notifId, data: notifUsuario }]);
          }

          // 4. Registrar auditoría de la resolución
          await registrarAuditoria({
              usuario: currentUser?.username || "Admin",
              dependencia: dependenciaActual,
              accion: accion === "aprobar" ? "APROBAR_BAJA" : "RECHAZAR_BAJA",
              entidad: "BIEN",
              entidadId: bien.id,
              detalles: { rotulo: bien?.rotulo, motivo: motivoFinal, solicitante: solicitanteUsername }
          });

          addToast(accion === "aprobar" ? "Baja aprobada y notificada al usuario." : "Solicitud rechazada y notificada al usuario.", "success");
      } catch (e) {
          console.error("Error al resolver baja:", e);
          addToast("Error al procesar la resolución.", "error");
      } finally {
          setIsProcessing({ active: false, text: "" });
          setResolucionBaja(null);
          setMotivoResolucion("");
      }
  };

  // --- INICIO DE CÓDIGO RESTAURADO ---
  const parseNotifRow = (item) => {
      const d = item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item;
      return { id: item.id, ...d };
  };
  const cargarNotificaciones = async () => {
      const { data, error } = await supabase.from('notificaciones').select('*');
      if (!error && data) {
          setNotificaciones(data.map(parseNotifRow));
      }
  };
  // Sondeo liviano: últimas 100 por actualización, fusionadas sin recargar todo
  const sondearNotificaciones = async () => {
      try {
          const { data, error } = await supabase.from('notificaciones').select('id, data, updated_at').order('updated_at', { ascending: false }).limit(100);
          if (error || !data) return;
          const frescas = data.map(parseNotifRow);
          setNotificaciones(prev => {
              const mapa = new Map(prev.map(n => [n.id, n]));
              frescas.forEach(n => mapa.set(n.id, n));
              return [...mapa.values()];
          });
      } catch (e) {}
  };
  const fusionarNotificacion = (payload) => {
      try {
          if (payload.eventType === 'DELETE') {
              if (payload.old?.id) setNotificaciones(prev => prev.filter(n => n.id !== payload.old.id));
              return;
          }
          const row = payload.new;
          if (!row) return;
          const parsed = parseNotifRow(row);
          setNotificaciones(prev => {
              const i = prev.findIndex(n => n.id === parsed.id);
              if (i === -1) return [parsed, ...prev];
              const copia = [...prev];
              copia[i] = parsed;
              return copia;
          });
      } catch (e) {}
  };

  const confirmDeleteAction = async () => {
      if (!itemToDelete) return; 
      const { type, id, username, item } = itemToDelete;
      try { 
          let res = { error: null };
          if (type === 'requestBajaFuncionario') {
              if (!motivoSolicitudBaja.trim()) {
                  return addToast('Debe ingresar el motivo de la solicitud.', 'warning');
              }
              const solicitudId = generateId();
              const nuevaSolicitud = {
                  id: solicitudId,
                  funcionarioId: item.id || id,
                  nombre: item.nombre,
                  cedula: item.cedula,
                  solicitante: currentUser?.username || 'Usuario',
                  dependencia: item.dependencia || dependenciaActual,
                  tipo: 'BAJA_FUNCIONARIO',
                  estado: 'PENDIENTE',
                  motivo: motivoSolicitudBaja.trim(),
                  created_at: new Date().toISOString()
              };
              res = await supabase.from('notificaciones').insert([{ id: solicitudId, data: nuevaSolicitud }]);

              if (!res.error) {
                addToast('Solicitud enviada con éxito al administrador.', 'success');
                setMotivoSolicitudBaja('');
                setItemToDelete(null);
                cargarNotificaciones();

                await registrarAuditoria({
                  usuario: currentUser?.username || 'Usuario',
                  dependencia: dependenciaActual,
                  accion: 'SOLICITUD_BAJA_FUNCIONARIO',
                  entidad: 'FUNCIONARIO',
                  entidadId: item.id || id,
                  detalles: { nombre: item?.nombre, cedula: item?.cedula, motivo: motivoSolicitudBaja.trim() }
                });
              }
              return;
          }
          if (type === 'requestBaja') {
              if (!motivoSolicitudBaja.trim()) {
                  return addToast("Debe ingresar el motivo de la baja.", "warning");
              }
              const solicitudId = generateId();
              const nuevaSolicitud = { 
                  id: solicitudId, 
                  bienId: item.id || id, 
                  rotulo: item.rotulo, 
                  descripcion: item.descripcion, 
                  ubicacion: item.ubicacion, 
                  funcionario: item.funcionario, 
                  solicitante: currentUser?.username || 'Usuario', 
                  dependencia: item.dependencia || dependenciaActual, 
                  tipo: 'BAJA_BIEN', 
                  estado: 'PENDIENTE', 
                  motivo: motivoSolicitudBaja.trim(),
                  created_at: new Date().toISOString() 
              };
              res = await supabase.from('notificaciones').insert([{ id: solicitudId, data: nuevaSolicitud }]);
              
              if (!res.error) { 
                addToast("Solicitud de baja enviada con éxito al administrador.", "success"); 
                setMotivoSolicitudBaja('');
                setItemToDelete(null);
                cargarNotificaciones(); 

                await registrarAuditoria({
                  usuario: currentUser?.username || 'Usuario',
                  dependencia: dependenciaActual,
                  accion: 'SOLICITUD_BAJA',
                  entidad: 'BIEN',
                  entidadId: item.id || id,
                  detalles: { rotulo: item?.rotulo, descripcion: item?.descripcion, motivo: motivoSolicitudBaja.trim() }
                });
              }
          } else {
              if (type === 'bien') {
                  if (item.estadoConservacion === 'De Baja') { 
                    res = await supabase.from('bens').delete().eq('id', id); 
                  } else { 
                    res = await supabase.from('bens').update(conSello({ data: { ...item, estadoConservacion: 'De Baja' } })).eq('id', id); 
                  }

                  await registrarAuditoria({
                    usuario: currentUser?.username || 'Usuario',
                    dependencia: dependenciaActual,
                    accion: 'ELIMINACION_O_BAJA',
                    entidad: 'BIEN',
                    entidadId: id,
                    detalles: { rotulo: item?.rotulo, descripcion: item?.descripcion, estadoPrevio: item?.estadoConservacion }
                  });
              }
              else if (type === 'fc10') res = await supabase.from('fc10').delete().eq('id', id);
              else if (type === 'fc11') res = await supabase.from('fc11').delete().eq('id', id);
              else if (type === 'fc04') res = await supabase.from('fc04').delete().eq('id', id);
              else if (type === 'usuario') {
                  if (itemToDelete.cargo === 'desarrollador' && !esDesarrollador) {
                      return addToast('Solo el Desarrollador del Sistema gestiona esa cuenta.', 'error');
                  }
                  res = await supabase.from('usuarios').delete().eq('username', username);
              }
              else if (type === 'funcionario') res = await supabase.from('funcionarios').delete().eq('id', id);

              if (!res.error) addToast("Acción completada", "success");
          }
          // Actualización local dirigida (evita una recarga total y ahorra transferencia)
          if (res && !res.error) {
              if (type === 'bien') {
                  if (item.estadoConservacion === 'De Baja') setBienes(prev => prev.filter(b => b.id !== id));
                  else setBienes(prev => prev.map(b => b.id === id ? { ...b, estadoConservacion: 'De Baja' } : b));
              }
              else if (type === 'fc10') setFc10List(prev => prev.filter(f => f.id !== id));
              else if (type === 'fc11') setFc11List(prev => prev.filter(f => f.id !== id));
              else if (type === 'fc04') setFc04List(prev => prev.filter(f => f.id !== id));
              else if (type === 'usuario') setUsuariosList(prev => prev.filter(u => u.username !== username));
              else if (type === 'funcionario') setFuncionariosPadron(prev => prev.filter(f => f.id !== id));
          }
      } catch (e) { 
        addToast("Error de red.", "error"); 
      } finally { 
        setItemToDelete(null); 
      }
  };
  // xÓ Escuchador de estado de red (Offline / Online)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Cuando regresa internet, vaciamos la cola guardada localmente
      processOfflineQueue((count) => {
        addToast(`Se sincronizaron ${count} operaciones guardadas en modo local.`, "success");
        fetchData(true); // Recargamos los datos para reflejar los cambios reales de Supabase
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("Conexión perdida. Se activó el modo de almacenamiento local.", "warning");
    };

    // Escuchar eventos nativos del navegador
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intentar sincronizar por si había algo pendiente al cargar la app
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);
  useEffect(() => {
      if (isAuthenticated) {
          fetchData(false);
          cargarNotificaciones();
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);
  // --- FIN DE CÓDIGO RESTAURADO ---
  // Toasts: hook extraído (Fase 1). Misma API que el código inline original.


// --- VISTA PaBLICA DE ESCANEO QR REDISEÑADA Y OPTIMIZADA PARA MÓVILES ---
// --- VISTA PÚBLICA DE ESCANEO QR CLARA, MODERNA Y OPTIMIZADA PARA MÓVILES (iOS / ANDROID) ---
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && !mostrarLoginDev) {
  return <MaintenanceScreen config={mantenimiento} onAccesoDesarrollador={() => setMostrarLoginDev(true)} />;
}
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && mostrarLoginDev) {
  return (
      <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} appLogo={appLogo} toasts={toasts} />
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
          <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} appLogo={appLogo} toasts={toasts} />
      );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-dvh overflow-hidden bg-zinc-50 dark:bg-darkbg-main transition-colors duration-300 text-base`}>
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputFuncionariosRef} onChange={handleFileUploadFuncionarios} />
      
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        
        {!isOnline && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-black bg-amber-500/90 text-white backdrop-blur-md border border-amber-400/30 transition-all animate-slide-up">
            <i className="fa-solid fa-wifi-slash text-base"></i>
            <span className="flex-1">Sin conexión a red (Modo Local)</span>
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
          </div>
        ))}
        
      </div>

      {isProcessing.active && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-[500] flex flex-col items-center justify-center animate-fade-in">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-primary mb-4"></i>
          <h2 className="text-xl font-medium text-zinc-900 dark:text-white tracking-tight">{isProcessing.text}</h2>
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

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 min-h-full flex flex-col">
                {activeTab === 'dashboard' && (<DashboardView currentUser={currentUser} dependenciaActual={dependenciaActual} saludoBienvenida={saludoBienvenida} stats={stats} pendientes={pendientes} isLoading={isLoading} timeStats={timeStats} clearAllFilters={clearAllFilters} setActiveTab={setActiveTab} setFiltroQR={setFiltroQR} setFiltroFC10={setFiltroFC10} setFiltroPendiente={setFiltroPendiente} setFiltroAnio={setFiltroAnio} setFiltroMes={setFiltroMes} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} fileInputRef={fileInputRef} handleExportInventarioCSV={handleExportInventarioCSV} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setFc10Year={setFc10Year} setFc10Month={setFc10Month} />)}

                {activeTab === 'resumen' && (<ResumenView dependenciaActual={dependenciaActual} stats={stats} pendientes={pendientes} fc10List={fc10List} />)}
                {activeTab === 'inventario' && (<InventarioView hasFilters={hasFilters} filteredBienes={filteredBienes} stats={stats} handleDownloadTemplateCSV={handleDownloadTemplateCSV} fileInputRef={fileInputRef} handleExportInventarioCSV={handleExportInventarioCSV} handleExportInventarioExcel={handleExportInventarioExcel} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} searchRef={searchRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} filtroFuncionario={filtroFuncionario} setFiltroFuncionario={setFiltroFuncionario} funcionariosUnicos={funcionariosUnicos} filtroUbicacion={filtroUbicacion} setFiltroUbicacion={setFiltroUbicacion} ubicacionesUnicas={ubicacionesUnicas} filtroAnio={filtroAnio} setFiltroAnio={setFiltroAnio} aniosUnicos={aniosUnicos} filtroSubcuenta={filtroSubcuenta} setFiltroSubcuenta={setFiltroSubcuenta} subcuentasUnicas={subcuentasUnicas} filtroAnalitico1={filtroAnalitico1} setFiltroAnalitico1={setFiltroAnalitico1} analiticos1Unicos={analiticos1Unicos} filtroAnalitico2={filtroAnalitico2} setFiltroAnalitico2={setFiltroAnalitico2} analiticos2Unicos={analiticos2Unicos} filtroFC10={filtroFC10} setFiltroFC10={setFiltroFC10} filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado} vistasGuardadas={vistasGuardadas} aplicarVista={aplicarVista} eliminarVista={eliminarVista} mostrarGuardarVista={mostrarGuardarVista} setMostrarGuardarVista={setMostrarGuardarVista} nombreVista={nombreVista} setNombreVista={setNombreVista} guardarVistaActual={guardarVistaActual} clearAllFilters={clearAllFilters} filtroPendiente={filtroPendiente} setFiltroPendiente={setFiltroPendiente} itemsPaginados={itemsPaginados} fc10VigentePorBien={fc10VigentePorBien} isAdmin={isAdmin} setItemToDelete={setItemToDelete} openFichaBien={openFichaBien} openFC10Modal={openFC10Modal} openFC11Modal={openFC11Modal} renderPagination={renderPagination} />)}

                {activeTab === 'aprobaciones' && isAdmin && (<AprobacionesView solicitudesBaja={solicitudesBaja} dependenciaActual={dependenciaActual} bienes={bienes} resolverSolicitudFuncionario={resolverSolicitudFuncionario} openResolucionModal={openResolucionModal} />)}

                {activeTab === 'auditoria' && isAdmin && (<AuditoriaView fetchAuditoria={fetchAuditoria} isLoadingAud={isLoadingAud} kpisAud={kpisAud} evolucionValor={evolucionValor} maxEvolucion={maxEvolucion} formatoCortoGs={formatoCortoGs} clearAllFilters={clearAllFilters} setFiltroAnio={setFiltroAnio} setFiltroMes={setFiltroMes} setActiveTab={setActiveTab} saludDatos={saludDatos} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} conteoUbicacion={conteoUbicacion} setConteoUbicacion={setConteoUbicacion} bienes={bienes} dependenciaActual={dependenciaActual} ubicacionesUnicas={ubicacionesUnicas} conteoCodigos={conteoCodigos} conteoInput={conteoInput} setConteoInput={setConteoInput} agregarCodigoConteo={agregarCodigoConteo} resultadoConteo={resultadoConteo} setScanParaConteo={setScanParaConteo} setIsScannerOpen={setIsScannerOpen} setConteoCodigos={setConteoCodigos} exportarConteoCSV={exportarConteoCSV} descargarActaConteoPDF={descargarActaConteoPDF} guardarActaConteo={guardarActaConteo} muestraN={muestraN} setMuestraN={setMuestraN} muestraUbicacion={muestraUbicacion} setMuestraUbicacion={setMuestraUbicacion} muestra={muestra} verificadosMuestra={verificadosMuestra} setVerificadosMuestra={setVerificadosMuestra} generarMuestra={generarMuestra} guardarActaMuestreo={guardarActaMuestreo} descargarActaMuestreoPDF={descargarActaMuestreoPDF} totalAud={totalAud} paginaAud={paginaAud} alcanceAud={alcanceAud} setAlcanceAud={setAlcanceAud} searchAud={searchAud} setSearchAud={setSearchAud} filtroAccionAud={filtroAccionAud} setFiltroAccionAud={setFiltroAccionAud} accionesUnicasAud={accionesUnicasAud} auditoriaList={auditoriaList} actorAud={actorAud} tonoAccionAud={tonoAccionAud} detalleAudCorto={detalleAudCorto} />)}
                {activeTab === 'usuarios' && isAdmin && (<UsuariosView usuariosList={usuariosList} setUsuarioEditing={setUsuarioEditing} setIsUsuarioModalOpen={setIsUsuarioModalOpen} esDesarrollador={esDesarrollador} currentUser={currentUser} setItemToDelete={setItemToDelete} STYLES={STYLES} />)}
                {activeTab === 'funcionarios' && (<FuncionariosView funcionariosPurosDependencia={funcionariosPurosDependencia} dependenciaActual={dependenciaActual} sincronizarBienesConPadron={sincronizarBienesConPadron} handleDownloadTemplateFuncionarios={handleDownloadTemplateFuncionarios} fileInputFuncionariosRef={fileInputFuncionariosRef} isAdmin={isAdmin} setIsUbicacionesModalOpen={setIsUbicacionesModalOpen} setIsNewFuncionarioModalOpen={setIsNewFuncionarioModalOpen} searchFuncionarioInput={searchFuncionarioInput} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} funcionariosPaginados={funcionariosPaginados} handleEditFuncionario={handleEditFuncionario} handleDeleteFuncionario={handleDeleteFuncionario} renderPaginationFuncionarios={renderPaginationFuncionarios} />)}

                {activeTab === 'fc04' && (<Fc04View filteredFC04={filteredFC04} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} openFC04Modal={openFC04Modal} STYLES={STYLES} isLoading={isLoading} ORIGENES_FC04={ORIGENES_FC04} handleGenerateFC04PDF={handleGenerateFC04PDF} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}

                {activeTab === 'fc10' && (<Fc10View filteredFC10={filteredFC10} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} STYLES={STYLES} setIsConsolidatedFC10ModalOpen={setIsConsolidatedFC10ModalOpen} handleExportFC10CSV={handleExportFC10CSV} isLoading={isLoading} bienes={bienes} handleGenerateFC10PDF={handleGenerateFC10PDF} openFC10Modal={openFC10Modal} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}
                {activeTab === 'fc11' && (<Fc11View filteredFC11={filteredFC11} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} STYLES={STYLES} handleExportFC11CSV={handleExportFC11CSV} isLoading={isLoading} dependenciaActual={dependenciaActual} handleGenerateFC11PDF={handleGenerateFC11PDF} openFC11Modal={openFC11Modal} bienes={bienes} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}
                {activeTab === 'ayuda' && (<AyudaView setTourPaso={setTourPaso} STYLES={STYLES} />)}
            </div>
          </main>
      </div>

      {/* Modales y componentes flotantes (carga diferida) */}
      <Suspense fallback={null}>
      {isCSVPreviewOpen && (
          <CSVPreviewModal 
              isOpen={isCSVPreviewOpen}
              onClose={() => setIsCSVPreviewOpen(false)}
              onConfirm={confirmCSVImportFuncionarios}
              data={csvPreviewData}
              STYLES={STYLES}
          />
      )}
      {/* ... demás modales ... */}
      <FuncionarioModal 
    isOpen={isFuncionarioModalOpen}
    onClose={() => setIsFuncionarioModalOpen(false)}
    funcionarioToEdit={funcionarioToEdit}
    saveFuncionarioEdit={saveFuncionarioEdit}
    ubicaciones={ubicacionesDep}
    STYLES={STYLES}
/>
      <ScannerModal 
    isOpen={isScannerOpen}
    onClose={() => {
        setIsScannerOpen(false);
        setScanParaConteo(false);
        if (window.html5QrCode && window.html5QrCode.isScanning) {
            window.html5QrCode.stop().catch(() => {});
        }
    }}
    modoConteo={scanParaConteo}
    conteoActual={conteoCodigos.length}
    STYLES={STYLES}
/>
      <QRModal 
    isOpen={isQRModalOpen}
    onClose={() => setIsQRModalOpen(false)}
    isBulk={isBulkQR}
    bien={qrTargetBien}
    onDownloadLabel={handleDownloadLabelPNG}
    onDownloadSimpleQR={handleDownloadSimpleQR}
    onBulkLabelZip={handleBulkLabelPNGZip}
    onBulkSimpleZip={handleBulkSimpleQRZip}
    STYLES={STYLES}
/>
      {isFC03ModalOpen && (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>
            {/* CABECERA LIMPIA */}
            <div className="relative px-6 sm:px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                   <i className="fa-solid fa-file-pdf text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Generar Inventario FC-03</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Configura los parámetros del reporte</p>
                </div>
              </div>
              <button onClick={() => setIsFC03ModalOpen(false)} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                 <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            {/* CUERPO DEL MODAL */}
            <div className="p-8 space-y-6 bg-white dark:bg-zinc-900">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tipo de Reporte</label>
                    <div className="relative">
                        <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.tipoFiltro} onChange={e => {
                            setFc03Config({...fc03Config, tipoFiltro: e.target.value, filtroValor: ''});
                            setFc03FuncionarioTexto('');
                            setShowFC03FuncDropdown(false);
                        }}>
                            <option value="general">General (Toda la Dependencia)</option>
                            <option value="ubicacion">Por Ubicación Específica</option>
                            <option value="funcionario">Por Funcionario Responsable</option>
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                    </div>
                </div>               
                {fc03Config.tipoFiltro === 'ubicacion' && (
                    <div className="space-y-2 animate-fade-in">
                        <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Seleccionar Ubicación</label>
                        <div className="relative">
                            <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.filtroValor} onChange={e => setFc03Config({...fc03Config, filtroValor: e.target.value})}>
                                <option value="">Seleccione una ubicación...</option>
                                {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                        </div>
                    </div>
                )}               
                {fc03Config.tipoFiltro === 'funcionario' && (() => {
                    const depFuncionarios = funcionariosPadron.filter(f => f.dependencia === dependenciaActual);
                    const listadoFiltrado = depFuncionarios.filter(f => 
                        matchSearchWords(`${f.cedula} ${f.nombre}`, fc03FuncionarioTexto)
                    );

                    return (
                        <div className="space-y-2 animate-fade-in relative">
                            <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Buscar Funcionario Responsable
                                </label>
                                {fc03Config.filtroValor && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        <i className="fa-solid fa-check mr-1"></i> Seleccionado
                                    </span>
                                )}
                            </div>

                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                                <input 
                                    type="text"
                                    value={fc03FuncionarioTexto}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFc03FuncionarioTexto(val);
                                        setShowFC03FuncDropdown(true);
                                        if (!val) {
                                            setFc03Config(prev => ({ ...prev, filtroValor: '' }));
                                        }
                                    }}
                                    onFocus={() => setShowFC03FuncDropdown(true)}
                                    placeholder="Escriba Marta Ocampo, apellido o CI..."
                                    className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 pl-10 pr-10 py-3.5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner"
                                />
                                {fc03FuncionarioTexto && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFc03FuncionarioTexto('');
                                            setFc03Config(prev => ({ ...prev, filtroValor: '' }));
                                            setShowFC03FuncDropdown(true);
                                        }}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                                    >
                                        <i className="fa-solid fa-xmark text-xs"></i>
                                    </button>
                                )}
                            </div>

                            {/* Dropdown flotante */}
                            {showFC03FuncDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setShowFC03FuncDropdown(false)} 
                                    />
                                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 divide-y divide-zinc-100 dark:divide-zinc-800/60 custom-scrollbar">
                                        {listadoFiltrado.length === 0 ? (
                                            <div className="p-4 text-center text-xs font-semibold text-zinc-400">
                                                No se encontraron funcionarios coincidentes
                                            </div>
                                        ) : (
                                            listadoFiltrado.slice(0, 50).map(f => {
                                                const isSelected = fc03Config.filtroValor === f.nombre;
                                                return (
                                                    <button
                                                        key={f.id || (f.cedula + '-' + f.nombre)}
                                                        type="button"
                                                        onClick={() => {
                                                            setFc03Config(prev => ({ ...prev, filtroValor: f.nombre }));
                                                            setFc03FuncionarioTexto(f.nombre);
                                                            setShowFC03FuncDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                                            isSelected 
                                                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold' 
                                                                : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col truncate pr-2">
                                                            <span className="truncate">{f.nombre}</span>
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                                {f.cedula !== 'S/C' ? `CI: ${formatCI(f.cedula)}` : 'Sin Cédula'}
                                                            </span>
                                                        </div>
                                                        {isSelected && <i className="fa-solid fa-check text-amber-600 shrink-0"></i>}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lugar de Emisión</label>
                    <input type="text" className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner" value={fc03Config.lugar} onChange={e => setFc03Config({...fc03Config, lugar: e.target.value})} placeholder="Ej: Pilar" />
                </div>
            </div>
            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-2 px-6 sm:px-8 py-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 rounded-b-[24px]">
              <button onClick={() => setIsFC03ModalOpen(false)} className="h-10 px-5 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">Cancelar</button>
              <button onClick={executeGenerateFC03} className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 dark:disabled:hover:bg-white" disabled={fc03Config.tipoFiltro !== 'general' && !fc03Config.filtroValor}>
                <i className="fa-solid fa-file-pdf text-xs"></i> Generar Documento
              </button>
            </div>
          </div>
        </div>
      )}
      {isFC04ModalOpen && (
          <FC04Modal 
              setIsFC04ModalOpen={setIsFC04ModalOpen}
              fc04Editing={fc04Editing}
              saveFC04={saveFC04}
              fc10Month={fc10Month}
              fc10Year={fc10Year}
              ORIGENES_FC04={ORIGENES_FC04}
              fc04SinMovimiento={fc04SinMovimiento}
              setFc04SinMovimiento={setFc04SinMovimiento}
              handleAddFC04Item={handleAddFC04Item}
              fc04Items={fc04Items || []}
              handleFC04ItemChange={handleFC04ItemChange}
              formatCurrency={formatCurrency}
              handleRemoveFC04Item={handleRemoveFC04Item}
              STYLES={STYLES}
          />
      )}
      {isFC10ModalOpen && (
          <FC10Modal 
              setIsFC10ModalOpen={setIsFC10ModalOpen}
              fc10TargetBien={fc10TargetBien}
              fc10Editing={fc10Editing}
              saveFC10={saveFC10}
              STYLES={STYLES}
              formatCurrency={formatCurrency}
              funcionariosConDatos={funcionariosConDatos}
          />
      )}
      {isFC11ModalOpen && (
          <FC11Modal 
              setIsFC11ModalOpen={setIsFC11ModalOpen}
              fc11TargetBien={fc11TargetBien}
              fc11Editing={fc11Editing}
              saveFC11={saveFC11}
              fc10Month={fc10Month}
              fc10Year={fc10Year}
              todasDependencias={todasDependencias}
              dependenciaActual={dependenciaActual}
              formatCurrency={formatCurrency}
              STYLES={STYLES}
          />
      )}
      <UsuarioModal 
    isOpen={isUsuarioModalOpen && isAdmin}
    onClose={() => setIsUsuarioModalOpen(false)}
    usuarioEditing={usuarioEditing}
    saveUsuario={saveUsuario}
    todasDependencias={todasDependencias}
    esDesarrollador={esDesarrollador}
    STYLES={STYLES}
/>
      {isBienModalOpen && (
    <BienModal 
        setIsBienModalOpen={setIsBienModalOpen}
        bienEditing={bienEditing}
        setBienEditing={setBienEditing}
        bienFormRef={bienFormRef}
        saveBien={saveBien}
        isSaving={isSaving}
        formatCurrency={formatCurrency}
        ESTADOS_CONSERVACION={ESTADOS_CONSERVACION}
        funcionariosConDatos={funcionariosConDatos}
        ubicacionesUnicas={ubicacionesUnicas}
        STYLES={STYLES}
        funcionariosPadron={padronDep}
        ubicaciones={ubicacionesDep}
        sugerenciasBienes={sugerenciasBienesDep}
    />
)}
      <FichaBienModal
        isOpen={Boolean(fichaBien)}
        onClose={() => { setFichaBien(null); setEventosAuditFicha([]); }}
        bien={fichaBien}
        eventos={eventosFicha}
        formatCurrency={formatCurrency}
        formatDateText={formatDateText}
        onAgregarFoto={subirFotoBien}
        onEliminarFoto={eliminarFotoBien}
        subiendoFoto={subiendoFoto}
        esAdmin={isAdmin}
        STYLES={STYLES}
      />
      {tourPaso >= 0 && (
        <TourGuiado
          pasos={pasosTour}
          paso={tourPaso}
          setPaso={setTourPaso}
          onClose={cerrarTour}
          irTab={(tab) => { if (tab) setActiveTab(tab); }}
        />
      )}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        bienes={bienes}
        funcionarios={funcionariosPadron}
        dependenciaActual={dependenciaActual}
        irInventario={(rotulo) => { clearAllFilters(); setSearchTerm(rotulo); setSearchInput(rotulo); setCurrentPage(1); setActiveTab('inventario'); }}
        abrirNuevoBien={() => { setBienEditing(null); setIsBienModalOpen(true); }}
        abrirEscaner={() => setIsScannerOpen(true)}
        abrirFC03={() => openFC03Modal()}
        irTab={irTabGlobal}
      />
      <DependenciasModal
        isOpen={isDependenciasModalOpen}
        onClose={() => setIsDependenciasModalOpen(false)}
        dependencias={dependenciasList.length > 0 ? dependenciasList.filter(d => d.activa !== false) : DEPENDENCIAS_UNP.map(n => ({ id: n, nombre: n }))}
        detectadas={dependenciasDetectadas}
        conteos={conteosDependencia}
        onSave={guardarDependencia}
        onDelete={eliminarDependencia}
        onFusionar={fusionarDependencia}
        isSaving={isSavingDep}
        dependenciaActual={dependenciaActual}
        onVerPadron={verPadronDependencia}
        ubicacionesList={ubicacionesList}
        conteosUbicacion={conteosUbicacion}
        funcionarios={funcionariosPadron}
        onGuardarUbicacion={guardarUbicacion}
        onEliminarUbicacion={eliminarUbicacion}
        onAsignarFuncionario={asignarFuncionarioAUbicacion}
        STYLES={STYLES}
      />
      <UbicacionesModal
        isOpen={isUbicacionesModalOpen}
        onClose={() => setIsUbicacionesModalOpen(false)}
        ubicaciones={ubicacionesList.filter(u => u.dependencia === dependenciaActual)}
        conteos={conteosUbicacion}
        onSave={guardarUbicacion}
        onDelete={eliminarUbicacion}
        isSaving={isSavingUbicacion}
        dependenciaActual={dependenciaActual}
        STYLES={STYLES}
      />
      <MantenimientoModal
        isOpen={isMantenimientoModalOpen}
        onClose={() => setIsMantenimientoModalOpen(false)}
        initial={mantenimiento}
        onSave={saveMantenimiento}
        isSaving={isSavingMant}
        STYLES={STYLES}
      />
      <LogoutModal 
    isOpen={showLogoutConfirm} 
    onClose={() => setShowLogoutConfirm(false)} 
    onConfirm={handleLogout} 
    STYLES={STYLES} 
/>
      <ResolucionBajaModal 
    resolucionBaja={resolucionBaja}
    setResolucionBaja={setResolucionBaja}
    submitResolucionBaja={submitResolucionBaja}
    motivoResolucion={motivoResolucion}
    setMotivoResolucion={setMotivoResolucion}
    STYLES={STYLES}
/>
      {/* MODAL DE AVISO PARA ELIMINACIÓN O SOLICITUD DE BAJA */}
      {itemToDelete && (() => {
        const tipo = itemToDelete.type;
        const esFunc = tipo === 'funcionario' || tipo === 'requestBajaFuncionario';
        const esSolicitud = tipo === 'requestBaja' || tipo === 'requestBajaFuncionario';
        const titulo = esFunc
          ? (esSolicitud ? 'Solicitar eliminación del funcionario' : '¿Eliminar del padrón?')
          : (tipo === 'usuario' ? '¿Eliminar usuario?'
          : tipo === 'fc10' ? '¿Eliminar acta FC-10?'
          : tipo === 'fc11' ? '¿Eliminar formulario FC-11?'
          : tipo === 'fc04' ? '¿Eliminar acta FC-04?'
          : (esSolicitud ? 'Solicitud de Baja / Eliminación' : '¿Eliminar o dar de baja el registro?'));
        const nombreFc10 = itemToDelete.item?.funcionarioNombre || 'este funcionario';
        const rotuloFc10 = itemToDelete.item?.bienRotulo || itemToDelete.item?.rotulo || 'S/Rótulo';
        const numFc11 = itemToDelete.item?.numeroFormulario || 'S/Nº';
        const rotuloFc11 = itemToDelete.item?.bienSnapshot?.rotulo || 'S/Rótulo';
        const periodoFc04 = (itemToDelete.item?.mes || itemToDelete.item?.anio)
          ? `${itemToDelete.item?.mes || '?'} / ${itemToDelete.item?.anio || '?'}` : 'este periodo';
        const nombreUsuario = itemToDelete.item?.nombre
          ? `${itemToDelete.item.username || itemToDelete.username || ''} (${itemToDelete.item.nombre})`
          : (itemToDelete.item?.username || itemToDelete.username || 'este usuario');
        const descripcion = esFunc
          ? (esSolicitud
            ? `Se enviará una notificación formal al administrador para evaluar la exclusión de "${itemToDelete.item?.nombre || 'este funcionario'}" (CI ${itemToDelete.item?.cedula || 'S/C'}) del padrón.`
            : `Se eliminará a "${itemToDelete.item?.nombre || 'este funcionario'}" (CI ${itemToDelete.item?.cedula || 'S/C'}) del padrón de forma permanente. Esta acción no se puede deshacer.`)
          : (tipo === 'usuario'
            ? `Se eliminará al usuario "${nombreUsuario}" de forma permanente. Esta acción no se puede deshacer.`
          : tipo === 'fc10'
            ? `Se eliminará el acta FC-10 de "${nombreFc10}" (rótulo ${rotuloFc10}) de forma permanente. Esta acción no se puede deshacer.`
          : tipo === 'fc11'
            ? `Se eliminará el formulario FC-11 Nº ${numFc11} (rótulo ${rotuloFc11}) de forma permanente. Esta acción no se puede deshacer.`
          : tipo === 'fc04'
            ? `Se eliminará el acta FC-04 del periodo ${periodoFc04} de forma permanente. Esta acción no se puede deshacer.`
          : (esSolicitud
            ? `Se enviará una notificación formal al administrador para evaluar la exclusión del activo "${itemToDelete.item?.rotulo || 'S/Rótulo'}".`
            : `Esta acción modificará el estado del activo "${itemToDelete.item?.rotulo || 'S/Rótulo'}" a De Baja o lo removerá del inventario activo.`));
        return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>

                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${esSolicitud ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    <i className={`fa-solid ${esSolicitud ? 'fa-paper-plane' : 'fa-triangle-exclamation'} text-xl`}></i>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    {titulo}
                </h3>

                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    {descripcion}
                </p>

                {esSolicitud && (
                  <div className="text-left mb-6 space-y-1.5">
                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Motivo de la solicitud <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={motivoSolicitudBaja}
                      onChange={(e) => setMotivoSolicitudBaja(e.target.value)}
                      placeholder={esFunc ? 'Ej: Renuncia, traslado definitivo, jubilación...' : 'Ej: Avería irreparable, rotura física, obsolescencia, desuso...'}
                      className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => { setItemToDelete(null); setMotivoSolicitudBaja(''); }}
                        className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmDeleteAction}
                        disabled={esSolicitud && !motivoSolicitudBaja.trim()}
                        className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {esSolicitud ? 'Enviar Solicitud' : 'Confirmar Acción'}
                    </button>
                </div>

            </div>
        </div>
        );
      })()}
      {/* MODAL DE CONFIRMACIÓN DE BACKUP GENERAL */}
      {confirmBackupModal && (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white mb-4">
              <i className="fa-solid fa-database text-xl"></i>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              ¿Descargar Copia de Seguridad?
            </h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Esta operación compilará y descargará una copia completa e íntegra (.json) de todos los registros patrimoniales, funcionarios, asignaciones y auditorías de la Universidad.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBackupModal(false)}
                className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmBackupModal(false);
                  handleExportBackupGeneral();
                }}
                className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              >
                <i className="fa-solid fa-download mr-1.5 text-xs"></i> Sí, Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE IMPORTACIÓN MASIVA CSV */}
      {pendingCSVImport && (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white mb-4">
              <i className="fa-solid fa-file-csv text-xl"></i>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              ¿Confirmar Importación Masiva?
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-left mb-6 space-y-1.5">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Archivo seleccionado:</p>
              <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{pendingCSVImport.file?.name}</p>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-1">Destino:</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{dependenciaActual}</p>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Los registros serán validados para evitar duplicados e incorporados a la base de datos oficial. ¿Desea proceder con la carga?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (fileInputFuncionariosRef.current) fileInputFuncionariosRef.current.value = '';
                  setPendingCSVImport(null);
                }}
                className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const { type, file } = pendingCSVImport;
                  setPendingCSVImport(null);
                  if (type === 'bienes') {
                    executeProcessBienesCSV(file);
                  } else {
                    executeProcessFuncionariosCSV(file);
                  }
                }}
                className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              >
                <i className="fa-solid fa-check mr-1.5 text-xs"></i> Sí, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
                <div className="px-6 py-8 sm:px-8 text-center relative overflow-hidden bg-[#0a1c38]">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-[22rem] rounded-full bg-violet-500/20 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-[0.18em] mb-4">
                            <i className="fa-solid fa-circle-check text-[10px]"></i> Sistema Actualizado
                        </span>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Novedades de la v{mantenimiento?.ultima_version || ''}</h2>
                    </div>
                </div>
                <div className="p-6 sm:p-8 bg-white dark:bg-darkbg-card">
                    <ul className="space-y-3">
                        {(Array.isArray(mantenimiento?.notas_version) ? mantenimiento.notas_version : []).map((n, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25 mt-0.5">
                                    <i className="fa-solid fa-check text-[9px] text-emerald-500"></i>
                                </span>
                                <span>{n}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex px-6 sm:px-8 pb-6 sm:pb-8 bg-white dark:bg-darkbg-card">
                    <button
                        onClick={() => {
                            try { localStorage.setItem('unp_last_version', mantenimiento?.ultima_version || ''); } catch (e) {}
                            setShowChangelog(false);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-6 h-11 text-[13px] font-bold text-white dark:text-zinc-900 transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                    >
                        Entendido, continuar al sistema
                    </button>
                </div>
            </div>
        </div>
      )}
      <ConsolidadoFC10Modal 
    isOpen={isConsolidatedFC10ModalOpen}
    onClose={() => setIsConsolidatedFC10ModalOpen(false)}
    bienes={bienes}
    dependenciaActual={dependenciaActual}
    funcionariosPadron={funcionariosPadron}
    handleGenerateConsolidatedFC10PDF={handleGenerateConsolidatedFC10PDF}
    STYLES={STYLES}
/>
      <NuevoFuncionarioModal 
    isOpen={isNewFuncionarioModalOpen}
    onClose={() => setIsNewFuncionarioModalOpen(false)}
    onSave={handleSaveManualFuncionario}
    dependenciaActual={dependenciaActual}
    ubicaciones={ubicacionesDep}
    STYLES={STYLES}
/>
      <UnsavedChangesModal 
        isOpen={showUnsavedChangesModal}
        onConfirmClose={() => {
          setShowUnsavedChangesModal(false);
          setIsBienModalOpen(false);
          setIsFC04ModalOpen(false);
          setBienEditing(null);
        }}
        onCancel={() => setShowUnsavedChangesModal(false)}
        STYLES={STYLES}
      />
      <DependenciaConfirmModal 
          showDependenciaConfirm={showDependenciaConfirm}
          setShowDependenciaConfirm={setShowDependenciaConfirm}
          confirmDependenciaChange={confirmDependenciaChange}
          pendingDependencia={pendingDependencia}
          STYLES={STYLES}
      />
      </Suspense>
    </div>
  );
}




