import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { lazyConReintento } from './utils/lazyConReintento';
import SkeletonLoader from './components/SkeletonLoader';
import { STYLES, DEPENDENCIAS_UNP, ESTADOS_CONSERVACION, ORIGENES_FC04, INACTIVITY_LIMIT_MS } from './constants/appConstants';
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState(() => { const saved = localStorage.getItem('current_user'); return saved ? JSON.parse(saved) : null; });
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('logoOficial'));
  const isAdmin = useMemo(() => currentUser?.role === 'admin' || currentUser?.role === 'dev' || currentUser?.cargo === 'cargo', [currentUser]);
  // Desarrollador: mismas capacidades que admin, pero nunca bloqueado por mantenimiento
  // y único con acceso al módulo de mantenimiento.
  const esDesarrollador = useMemo(() => currentUser?.role === 'dev', [currentUser]);
  
  const [loginUser, setLoginUser] = useState(''); 
  const [loginPass, setLoginPass] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => { const saved = localStorage.getItem('theme'); if (saved !== null) return saved === 'dark'; return true; });
  // Persistir el tema en cada cambio (antes solo se guardaba desde el login y se perdía al refrescar)
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  // Arranque limpio: permite un futuro auto-reintento de chunks ante deploys intermedios
  useEffect(() => {
    try { sessionStorage.removeItem('chunk_reintentado'); } catch (e) {}
  }, []);
  // Formato único de papel para todos los PDF del sistema: oficio (216 x 330 mm).
  // Se eliminó el selector A4/Oficio de la interfaz: un solo formato oficial.
  const FORMATO_PDF = [216, 330];
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState({ active: false, text: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Modo mantenimiento: aviso global que bloquea el uso para todos
  const [mantenimiento, setMantenimiento] = useState(null);
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);
  const [isSavingMant, setIsSavingMant] = useState(false);
  // Puerta de acceso dev: si el muro te agarra sin sesión, este flag muestra
  // el login en vez del muro. Solo una sesión con cargo 'desarrollador'
  // levanta el bloqueo (misma validación de siempre, sin atajos nuevos).
  const [mostrarLoginDev, setMostrarLoginDev] = useState(false);
  useEffect(() => {
    let alive = true;
    const cargar = async () => {
      if (document.hidden) return;
      try {
        const { data, error } = await supabase.from('app_config').select('*').eq('id', 'global').limit(1);
        if (!error && data && data[0] && alive) setMantenimiento(data[0]);
      } catch (e) {}
    };
    cargar();
    const t = setInterval(cargar, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);
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
  const [dependenciaActual, setDependenciaActual] = useState(() => {
    if (currentUser?.dependencia) return currentUser.dependencia;
    return isAdmin ? 'Rectorado' : 'Rectorado';
  });
 
  const [currentPaginaFuncionarios, setCurrentPaginaFuncionarios] = useState(1);
  const itemsPorPaginaFuncs = 20;
  const [isFuncionarioModalOpen, setIsFuncionarioModalOpen] = useState(false);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null);
  const [isNewFuncionarioModalOpen, setIsNewFuncionarioModalOpen] = useState(false);
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

  const [isCSVPreviewOpen, setIsCSVPreviewOpen] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState({ validos: [], duplicados: [], errores: [] });
  const [pendingFuncionariosToImport, setPendingFuncionariosToImport] = useState([]);

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

  const [searchFuncionarioInput, setSearchFuncionarioInput] = useState('');
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
  const PENDIENTE_LABELS = { sinQR: 'Sin etiqueta QR', sinFC10: 'Sin acta FC-10', sinUbicacion: 'Sin ubicación', sinFuncionario: 'Sin responsable', vidaVencida: 'Vida útil vencida', porVencer: 'Vida útil por vencer' };
  // Auditoría (solo admin): libro de eventos + conciliación física + muestreo aleatorio
  const [auditoriaList, setAuditoriaList] = useState([]);
  const [isLoadingAud, setIsLoadingAud] = useState(false);
  const [searchAud, setSearchAud] = useState('');
  const [filtroAccionAud, setFiltroAccionAud] = useState('');
  const [conteoCodigos, setConteoCodigos] = useState([]);
  const [conteoInput, setConteoInput] = useState('');
  const [muestraN, setMuestraN] = useState(10);
  const [muestraUbicacion, setMuestraUbicacion] = useState('');
  const [conteoUbicacion, setConteoUbicacion] = useState('');
  const [muestra, setMuestra] = useState([]);
  const [verificadosMuestra, setVerificadosMuestra] = useState({});
  const PAGE_AUD = 50;
  const [paginaAud, setPaginaAud] = useState(1);
  const [totalAud, setTotalAud] = useState(0);
  const [alcanceAud, setAlcanceAud] = useState('dep');
  const [kpisAud, setKpisAud] = useState({ total: 0, altas: 0, mods: 0, bajas: 0 });
  const [accionesUnicasAud, setAccionesUnicasAud] = useState([]);
  const limpiarBusquedaAud = (texto) => String(texto || '').replace(/[%(),.]/g, ' ').replace(/\s+/g, ' ').trim();
  const fetchAuditoria = async (pagina = 1) => {
    const pag = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
    setIsLoadingAud(true);
    try {
      let q = supabase.from('auditoria').select('*', { count: 'exact' }).order('fecha', { ascending: false });
      if (alcanceAud === 'dep') q = q.eq('dependencia', dependenciaActual);
      if (filtroAccionAud) q = q.eq('accion', filtroAccionAud);
      if (searchAud.trim()) {
        const t = `%${limpiarBusquedaAud(searchAud).split(' ').filter(Boolean).join('%')}%`;
        q = q.or(`titulo.ilike.${t},mensaje.ilike.${t}`);
      }
      const from = (pag - 1) * PAGE_AUD;
      const { data, error, count } = await q.range(from, from + PAGE_AUD - 1);
      if (!error && data) {
        setAuditoriaList(data);
        setTotalAud(count || 0);
        setPaginaAud(pag);
      }
      // KPIs livianos del período (solo 2 columnas)
      try {
        const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
        let qk = supabase.from('auditoria').select('accion,fecha').gte('fecha', hace30).limit(2000);
        if (alcanceAud === 'dep') qk = qk.eq('dependencia', dependenciaActual);
        const { data: kd } = await qk;
        const cuenta = (re) => (kd || []).filter(r => re.test(String(r.accion || ''))).length;
        setKpisAud({ total: (kd || []).length, altas: cuenta(/CREA|ALTA/), mods: cuenta(/MODIF/), bajas: cuenta(/BAJA|ELIMINA/) });
      } catch (e) {}
      // Acciones distintas para el filtro
      try {
        const { data: ad } = await supabase.from('auditoria').select('accion').limit(1000);
        setAccionesUnicasAud([...new Set((ad || []).map(r => String(r.accion || 'OTROS')))].sort());
      } catch (e) {}
    } catch (e) {}
    finally { setIsLoadingAud(false); }
  };
  useEffect(() => {
    if (activeTab === 'auditoria' && isAdmin) fetchAuditoria(1);
  }, [activeTab, alcanceAud]);
  useEffect(() => {
    if (activeTab !== 'auditoria' || !isAdmin) return;
    const t = setTimeout(() => fetchAuditoria(1), 450);
    return () => clearTimeout(t);
  }, [searchAud, filtroAccionAud]);
  const actorAud = (row) => {
    if (row.usuario) return row.usuario;
    try {
      const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
      if (m && typeof m === 'object' && m.solicitante) return m.solicitante;
    } catch (e) {}
    return 'No registrado';
  };
  const detalleAudCorto = (row) => {
    try {
      const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
      if (m && typeof m === 'object') {
        if (m.cambios && m.cambios.anterior && m.cambios.nuevo) {
          const keys = Object.keys(m.cambios.nuevo).filter(k => JSON.stringify(m.cambios.nuevo[k]) !== JSON.stringify(m.cambios.anterior[k]));
          return keys.length ? `Campos: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '…' : ''}` : 'Registro actualizado';
        }
        const bits = [];
        if (m.solicitante) bits.push(m.solicitante);
        if (m.motivo) bits.push(m.motivo);
        if (m.descripcion) bits.push(String(m.descripcion).slice(0, 60));
        else if (m.rotulo) bits.push(`Rótulo ${m.rotulo}`);
        return bits.join(' · ');
      }
      return String(row.mensaje || '').slice(0, 120);
    } catch (e) { return String(row.mensaje || '').slice(0, 120); }
  };
  const tonoAccionAud = (accion) => {
    const a = String(accion || '').toUpperCase();
    if (a.includes('BAJA') || a.includes('ELIMINA')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (a.includes('CREA') || a.includes('ALTA')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (a.includes('MODIF')) return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20';
    if (a.includes('MUESTREO') || a.includes('CONCILIA')) return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };
  // Evolución del valor patrimonial: incorporado por mes (últimos 12 meses)
  const evolucionValor = useMemo(() => {
    const porMes = {};
    bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual)).forEach(b => {
      const { year, month } = parseDateInfo(b.fechaAdquisicion);
      if (!year || !month) return;
      const k = `${year}-${month}`;
      porMes[k] = (porMes[k] || 0) + (parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0);
    });
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ahora = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({
        key: k, etiqueta: `${nombres[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        year: String(d.getFullYear()), month: String(d.getMonth() + 1).padStart(2, '0'),
        valor: porMes[k] || 0
      });
    }
    return out;
  }, [bienes, dependenciaActual]);
  const maxEvolucion = Math.max(1, ...evolucionValor.map(e => e.valor));
  const formatoCortoGs = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toLocaleString('es-PY', { maximumFractionDigits: 1 })} M`;
    if (v >= 1000) return `${Math.round(v / 1000)} mil`;
    return String(v);
  };
  // Salud de datos: solo lectura (cero riesgo), detecta inconsistencias sin modificar nada
  const saludDatos = useMemo(() => {
    const idsBienes = new Set(bienes.map(b => b.id));
    const vistos = new Map();
    const duplicados = [];
    bienes.forEach(b => {
      const k = `${normalizeStr(b.dependencia)}||${normalizeStr(b.rotulo)}`;
      if (!b.rotulo || String(b.rotulo).trim() === '' || String(b.rotulo).trim() === 'S/R') return;
      if (vistos.has(k)) duplicados.push(b);
      else vistos.set(k, b.id);
    });
    // Posibles duplicados del padrón: mismo nombre normalizado, distinto registro
    const vistosFunc = new Map();
    const duplicadosFunc = [];
    funcionariosPadron.forEach(f => {
      const k = normalizeStr(f.nombre || '');
      if (!k) return;
      if (vistosFunc.has(k)) duplicadosFunc.push(f);
      else vistosFunc.set(k, f.id);
    });
    return [
      { id: 'dup', label: 'Rótulos duplicados', count: duplicados.length, detalle: duplicados.slice(0, 20), icon: 'fa-clone', box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      { id: 'dupfunc', label: 'Posibles duplicados en padrón', count: duplicadosFunc.length, detalle: duplicadosFunc.slice(0, 20), icon: 'fa-user-group', box: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', esPadron: true },
      { id: 'fc10', label: 'FC-10 sin bien asociado', count: fc10List.filter(fc => fc.bienId && !idsBienes.has(fc.bienId)).length, detalle: [], icon: 'fa-file-signature', box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      { id: 'fc11', label: 'FC-11 sin bien asociado', count: fc11List.filter(fc => fc.bienId && !idsBienes.has(fc.bienId)).length, detalle: [], icon: 'fa-truck-fast', box: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      { id: 'sindep', label: 'Bienes sin dependencia', count: bienes.filter(b => !String(b.dependencia || '').trim()).length, detalle: [], icon: 'fa-building-columns', box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20' },
      { id: 'sinfecha', label: 'Bienes sin fecha de adquisición', count: bienes.filter(b => !String(b.fechaAdquisicion || '').trim()).length, detalle: [], icon: 'fa-calendar-xmark', box: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
    ];
  }, [bienes, fc10List, fc11List]);
  const resultadoConteo = useMemo(() => {
    const base = bienes.filter(b =>
      normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) &&
      b.estadoConservacion !== 'De Baja' &&
      (!conteoUbicacion || String(b.ubicacion || '').trim() === conteoUbicacion)
    );
    const hallados = new Set();
    const noReg = [];
    conteoCodigos.forEach(code => {
      const f = base.find(b => b.id === code || normalizeStr(b.rotulo) === normalizeStr(code));
      if (f) hallados.add(f.id); else noReg.push(code);
    });
    return { total: base.length, hallados: hallados.size, faltantes: base.filter(b => !hallados.has(b.id)), noRegistrados: noReg };
  }, [conteoCodigos, bienes, dependenciaActual, conteoUbicacion]);
  const agregarCodigoConteo = (raw) => {
    const code = extraerCodigoQR(raw);
    if (!code) return;
    setConteoCodigos(prev => (prev.includes(code) ? prev : [...prev, code]));
    setConteoInput('');
  };
  const descargarActaConteoPDF = async () => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast('Cargando librerías PDF...', 'warning');
    setIsProcessing({ active: true, text: 'Generando acta de conciliación...' });
    try {
      const logo = await resolveLogoImg(dependenciaActual);
      const porId = new Map(bienes.map(b => [b.id, b]));
      const filas = [
        ...[...new Set(conteoCodigos)].map(code => {
          const b = [...porId.values()].find(x => x.id === code || normalizeStr(x.rotulo) === normalizeStr(code));
          return b
            ? { rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion, resultado: 'HALLADO' }
            : { rotulo: '-', descripcion: `Código no registrado: ${code}`, ubicacion: '-', resultado: 'NO REGISTRADO' };
        }),
        ...resultadoConteo.faltantes.map(b => ({ rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion, resultado: 'FALTANTE' }))
      ];
      const doc = await buildActaAuditoriaPDF({
        tipo: 'CONCILIACION',
        fecha: new Date().toISOString().split('T')[0],
        dependencia: dependenciaActual,
        alcance: conteoUbicacion || 'Toda la dependencia',
        auditor: currentUser?.nombre || currentUser?.username || '',
        resumen: `${resultadoConteo.hallados} hallados de ${resultadoConteo.total} · ${resultadoConteo.faltantes.length} faltantes · ${resultadoConteo.noRegistrados.length} no registrados`,
        filas, logoDataUrl: logo
      });
      doc.save(`Acta_Conciliacion_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Acta de conciliación generada.', 'success');
    } catch (e) {
      addToast('Error al generar el acta: ' + (e.message || 'desconocido'), 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const descargarActaMuestreoPDF = async () => {
    if (muestra.length === 0) return addToast('Genera primero la muestra.', 'warning');
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast('Cargando librerías PDF...', 'warning');
    setIsProcessing({ active: true, text: 'Generando acta de muestreo...' });
    try {
      const logo = await resolveLogoImg(dependenciaActual);
      const verif = Object.values(verificadosMuestra).filter(Boolean).length;
      const doc = await buildActaAuditoriaPDF({
        tipo: 'MUESTREO',
        fecha: new Date().toISOString().split('T')[0],
        dependencia: dependenciaActual,
        alcance: muestraUbicacion || 'Toda la dependencia',
        auditor: currentUser?.nombre || currentUser?.username || '',
        resumen: `${verif} verificados de ${muestra.length} muestreados`,
        filas: muestra.map(b => ({
          rotulo: b.rotulo, descripcion: b.descripcion, ubicacion: b.ubicacion,
          resultado: verificadosMuestra[b.id] ? 'VERIFICADO' : 'PENDIENTE'
        })),
        logoDataUrl: logo
      });
      doc.save(`Acta_Muestreo_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Acta de muestreo generada.', 'success');
    } catch (e) {
      addToast('Error al generar el acta: ' + (e.message || 'desconocido'), 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const exportarConteoCSV = () => {
    const rows = [['Estado', 'Rotulo', 'Descripcion', 'Codigo detectado']];
    resultadoConteo.faltantes.forEach(b => rows.push(['FALTANTE', b.rotulo || '', `"${String(b.descripcion || '').replace(/"/g, '""')}"`, '']));
    resultadoConteo.noRegistrados.forEach(c => rows.push(['NO REGISTRADO', '', '', c]));
    const blob = new Blob(["\uFEFF" + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Conciliacion_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const guardarActaConteo = async () => {
    await registrarAuditoria({
      usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
      accion: 'CONCILIACION_FISICA', entidad: 'CONCILIACION', entidadId: null,
      detalles: { total: resultadoConteo.total, hallados: resultadoConteo.hallados, faltantes: resultadoConteo.faltantes.length, noRegistrados: resultadoConteo.noRegistrados.length }
    });
    addToast('Acta de conciliación registrada en el libro.', 'success');
    fetchAuditoria();
  };
  const generarMuestra = () => {
    const base = bienes.filter(b =>
      normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) &&
      b.estadoConservacion !== 'De Baja' &&
      (!muestraUbicacion || String(b.ubicacion || '').trim() === muestraUbicacion)
    );
    if (base.length === 0) {
      addToast('No hay bienes activos en ese alcance para muestrear.', 'warning');
      return;
    }
    const n = Math.max(1, Math.min(parseInt(muestraN, 10) || 10, base.length));
    const barajada = [...base].sort(() => Math.random() - 0.5);
    setMuestra(barajada.slice(0, n));
    setVerificadosMuestra({});
  };
  const guardarActaMuestreo = async () => {
    const verif = Object.values(verificadosMuestra).filter(Boolean).length;
    await registrarAuditoria({
      usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
      accion: 'MUESTREO_VERIFICACION', entidad: 'MUESTREO', entidadId: null,
      detalles: { total: muestra.length, verificados: verif, rotulos: muestra.map(b => b.rotulo) }
    });
    addToast(`Muestreo registrado: ${verif}/${muestra.length} verificados.`, 'success');
    fetchAuditoria();
  };
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
  
  // Búsqueda robusta: insensible a tildes/mayúsculas y multi-palabra (AND),
  // así "gomez cordioli", "cordioli daniel" o "daniel 123" encuentran igual.
  const funcionariosPurosDependencia = useMemo(() => {
      let lista = funcionariosPadron.filter(f => f.dependencia === dependenciaActual);

      if (searchFuncionarioInput.trim() !== '') {
          const tokens = normalizeStr(searchFuncionarioInput).split(' ').filter(Boolean);
          lista = lista.filter(f => {
              const haystack = normalizeStr(`${f.cedula || ''} ${f.nombre || ''} ${f.cargo || ''}`);
              const hayDigits = `${f.cedula || ''}`.replace(/\D/g, '');
              return tokens.every(tok => {
                  if (haystack.includes(tok)) return true;
                  const tokDigits = tok.replace(/\D/g, '');
                  return Boolean(tokDigits) && hayDigits.includes(tokDigits);
              });
          });
      }

      return lista.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
  }, [funcionariosPadron, dependenciaActual, searchFuncionarioInput]);

  // 2. Calculamos el total de páginas exactas basándonos solo en los funcionarios puros
  const totalPagesFuncs = Math.ceil(funcionariosPurosDependencia.length / itemsPorPaginaFuncs);

  // 3. Cortamos la porción correspondiente a la página actual
  const funcionariosPaginados = useMemo(() => {
      const start = (currentPaginaFuncionarios - 1) * itemsPorPaginaFuncs;
      const subLista = funcionariosPurosDependencia.slice(start, start + itemsPorPaginaFuncs);

      // Agregamos los separadores alfabéticos únicamente para los elementos de esta página
      const listaConSeparadores = [];
      let letraActual = '';

      subLista.forEach(f => {
          const primeraLetra = String(f.nombre || '').trim().charAt(0).toUpperCase();
          if (primeraLetra !== letraActual) {
              letraActual = primeraLetra;
              listaConSeparadores.push({ esSeparador: true, letra: letraActual });
          }
          listaConSeparadores.push(f);
      });

      return listaConSeparadores;
  }, [funcionariosPurosDependencia, currentPaginaFuncionarios]);

  const handleLogout = useCallback(() => {
    try { supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  }, []);
  // Sesión real: al arrancar, solo vale si Supabase confirma sesión activa.
  // Sin sesión no hay acceso aunque exista bandera local (cierra la puerta de DevTools).
  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      if (!data.session) {
        localStorage.removeItem('is_logged_in');
        localStorage.removeItem('current_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        localStorage.removeItem('is_logged_in');
        localStorage.removeItem('current_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    return () => { vivo = false; try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, []);

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
  // --- MANEJO DE INACTIVIDAD Y CIERRE AUTOMÁTICO DE SESIÓN (15 Minutos) ---
  // INACTIVITY_LIMIT_MS vive en constants/appConstants (Fase 0 del split).

useEffect(() => {
  if (!isAuthenticated) return;

  let inactivityTimer;

  const handleInactivityLogout = () => {
    addToast("Sesión cerrada automáticamente por inactividad (15 min).", "warning");
    handleLogout();
  };

  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT_MS);
  };

  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  resetTimer();
  events.forEach(event => window.addEventListener(event, resetTimer));

  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    events.forEach(event => window.removeEventListener(event, resetTimer));
  };
}, [isAuthenticated]);
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
  const handleLogin = async (e) => { 
    e.preventDefault(); 
    setIsProcessing({ active: true, text: 'Verificando credenciales...' });

    try {
        // Acepta usuario o email completo (el email siempre es usuario@unp.edu.py)
        const entrada = loginUser.trim();
        const esEmail = entrada.includes('@');
        const emailAcceso = esEmail ? entrada.toLowerCase() : `${entrada.toLowerCase()}@unp.edu.py`;
        const nombreUsuario = esEmail ? entrada.split('@')[0] : entrada;
        // Sesión real con Supabase Auth
        const { error: errorAuth } = await supabase.auth.signInWithPassword({
            email: emailAcceso,
            password: loginPass
        });

        if (errorAuth) {
            setLoginError(true);
            const msgAuth = String(errorAuth.message || '');
            if (/confirm/i.test(msgAuth)) {
                addToast("Cuenta sin confirmar. Pide al administrador que la confirme en Supabase.", "error");
            } else {
                addToast("Credenciales incorrectas. Verifique su usuario y contraseña.", "error");
            }
            setIsProcessing({ active: false, text: '' });
            return;
        }

        // Perfil y rol desde la tabla usuarios (solo legible con sesión)
        const { data: perfil, error: errorPerfil } = await supabase
            .from('usuarios')
            .select('username, nombre, cargo, dependencia')
            .eq('username', nombreUsuario)
            .maybeSingle();

        if (errorPerfil || !perfil) {
            await supabase.auth.signOut();
            setLoginError(true);
            addToast("Usuario sin perfil en el sistema. Contacte al administrador.", "error");
            setIsProcessing({ active: false, text: '' });
            return;
        }

        const userSession = {
            username: perfil.username,
            nombre: perfil.nombre,
            cargo: perfil.cargo,
            role: perfil.cargo === 'admin' ? 'admin' : perfil.cargo === 'desarrollador' ? 'dev' : 'user',
            dependencia: perfil.dependencia || 'Rectorado'
        };

        localStorage.setItem('is_logged_in', 'true'); 
        localStorage.setItem('current_user', JSON.stringify(userSession)); 
        
        setLoginError(false); 
        setCurrentUser(userSession); 
        setIsAuthenticated(true); 
        setDependenciaActual(userSession.dependencia);
        // Cierra la puerta dev: el gate decide según el rol (dev entra, resto al muro).
        setMostrarLoginDev(false); 
        
        addToast(`Bienvenido, ${perfil.nombre} (${userSession.dependencia})`, "success"); 
    } catch (error) {
        setLoginError(true);
        addToast("Error al conectar con la base de datos", "error");
    } finally {
        setIsProcessing({ active: false, text: '' });
    }
  };

  const funcionariosConDatos = useMemo(() => { 
      const map = new Map(); 
      
      // 1. Padrón oficial de la dependencia
      funcionariosPadron.filter(f => f.dependencia === dependenciaActual).forEach(f => {
          const nombreSeguro = String(f.nombre).trim();
          if(!map.has(normalizeStr(nombreSeguro))) {
              map.set(normalizeStr(nombreSeguro), { nombre: nombreSeguro, doc: f.cedula || '', cargo: f.cargo || '' });
          }
      });

      // 2. FC-10 de la dependencia actual
      fc10List.filter(fc => fc.dependencia === dependenciaActual).forEach(fc => { 
          if (fc.funcionarioNombre && String(fc.funcionarioNombre).trim() !== "") { 
              const nombreSeguro = String(fc.funcionarioNombre).trim(); 
              if(!map.has(normalizeStr(nombreSeguro))) { 
                  map.set(normalizeStr(nombreSeguro), { nombre: nombreSeguro, doc: fc.funcionarioDoc || '', cargo: fc.funcionarioCargo || '' }); 
              } 
          } 
      }); 

      // 3. Bienes de la dependencia actual
      bienes.filter(b => b.dependencia === dependenciaActual).forEach(b => {
          if (b.funcionario && String(b.funcionario).trim() !== "") {
              const nombreSeguro = String(b.funcionario).trim();
              if(!map.has(normalizeStr(nombreSeguro))) {
                  map.set(normalizeStr(nombreSeguro), { nombre: nombreSeguro, doc: '', cargo: '' });
              }
          }
      });

      return Array.from(map.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre)); 
  }, [fc10List, bienes, funcionariosPadron, dependenciaActual]);

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


  const marcarBienConQR = async (bienId) => {
    if (!bienId) return;
    const bienActual = bienes.find(b => b.id === bienId);
    if (!bienActual || bienActual.hasQR) return;

    const updated = { ...bienActual, hasQR: true };
    setBienes(prev => prev.map(b => b.id === bienId ? updated : b));

    try {
      await supabase.from('bens').update(conSello({ data: updated })).eq('id', bienId);
      const cacheKey = 'bienes_cache_' + (dependenciaActual || 'general');
      const cache = (await localforage.getItem(cacheKey)) || [];
      await localforage.setItem(cacheKey, cache.map(b => b.id === bienId ? updated : b));
    } catch (err) {
      console.error('Error al actualizar hasQR en base de datos:', err);
    }
  };

const handleDownloadLabelPNG = async (bien, returnOnly = false) => {
  // Si no es solo vista previa, activamos el indicador visual de procesamiento
  if (!returnOnly) setIsProcessing({ active: true, text: 'Generando Etiqueta...' });

  try {
    const dataUrl = await generateProfessionalLabelPNG(bien, appLogo, returnOnly);
    if (!returnOnly) {
      await marcarBienConQR(bien.id);
      addToast("Etiqueta descargada con éxito", "success");
      setIsQRModalOpen(false);
    }
    return dataUrl;
  } catch (e) {
    addToast("Error al generar la etiqueta", "error");
  } finally {
    if (!returnOnly) setIsProcessing({ active: false, text: '' });
  }
};

const handleDownloadSimpleQR = async (bien, returnOnly = false) => {
  if (!returnOnly) setIsProcessing({ active: true, text: 'Procesando imagen QR...' });

  try {
    const dataUrl = await generateSimpleQR(bien, returnOnly);
    if (!returnOnly) {
      await marcarBienConQR(bien.id);
      addToast("Código QR simple descargado", "success");
      setIsQRModalOpen(false);
    }
    return dataUrl;
  } catch (e) {
    addToast("Error al descargar el QR", "error");
  } finally {
    if (!returnOnly) setIsProcessing({ active: false, text: '' });
  }
};

  const handleBulkLabelPNGZip = async () => {
    if (filteredBienes.length === 0) return addToast("No hay bienes filtrados.", "warning");
    setIsProcessing({ active: true, text: 'Iniciando generación masiva de etiquetas...' });

    setTimeout(async () => {
      try {
        const cleanDepName = dependenciaActual.replace(/\s+/g, '_');
        const zip = new window.JSZip();
        const folder = zip.folder(`Etiquetas_Completas_${cleanDepName}`);
        
        const CHUNK_SIZE = 8;
        const totalBienes = filteredBienes.length;

        for (let i = 0; i < totalBienes; i += CHUNK_SIZE) {
          const chunk = filteredBienes.slice(i, i + CHUNK_SIZE);
          
          setIsProcessing({ 
            active: true, 
            text: `Generando etiquetas: ${Math.min(i + CHUNK_SIZE, totalBienes)} de ${totalBienes}...` 
          });

          const results = await Promise.all(
            chunk.map(async (bien) => {
              const dataUrl = await generateProfessionalLabelPNG(bien, appLogo);
              return { bien, dataUrl };
            })
          );

          results.forEach(({ bien, dataUrl }) => {
            if (dataUrl) {
              const rotuloSeguro = bien.rotulo ? String(bien.rotulo) : 'S-R';
              const cleanRotulo = rotuloSeguro.replace(/[^a-zA-Z0-9]/g, '');
              folder.file(`Etiqueta_${cleanRotulo}.png`, dataUrl.replace(/^data:image\/png;base64,/, ""), { base64: true });
            }
          });
        }

        setIsProcessing({ active: true, text: 'Comprimiendo paquete ZIP...' });
        const content = await zip.generateAsync({ type: "blob" });

        if (window.saveAs) {
          window.saveAs(content, `Etiquetas_Patrimoniales_${cleanDepName}_${new Date().toISOString().split('T')[0]}.zip`);
        }
        
        try {
          const idsToUpdate = filteredBienes.map(b => b.id);
          setBienes(prev => prev.map(b => idsToUpdate.includes(b.id) ? { ...b, hasQR: true } : b));
          for (const bien of filteredBienes) {
            if (!bien.hasQR) {
              await supabase.from("bens").update({ data: { ...bien, hasQR: true } }).eq("id", bien.id);
            }
          }
        } catch (e) { console.error("Error bulk hasQR:", e); }
        addToast("Archivo ZIP de etiquetas generado con éxito", "success");
      } catch (error) {
        console.error("Error en ZIP:", error);
        addToast("Hubo un error al generar el archivo ZIP.", "error");
      } finally {
        setIsProcessing({ active: false, text: '' });
        setIsQRModalOpen(false);
      }
    }, 100);
  };

  const handleBulkSimpleQRZip = async () => {
    if (filteredBienes.length === 0) return addToast("No hay bienes filtrados.", "warning");
    
    setIsProcessing({ active: true, text: 'Iniciando compresión de QRs simples...' });

    setTimeout(async () => {
      try {
        const cleanDepName = dependenciaActual.replace(/\s+/g, '_');
        const zip = new window.JSZip();
        const folder = zip.folder(`QRs_Simples_${cleanDepName}`);
        
        const CHUNK_SIZE = 10;
        const totalBienes = filteredBienes.length;

        for (let i = 0; i < totalBienes; i += CHUNK_SIZE) {
          const chunk = filteredBienes.slice(i, i + CHUNK_SIZE);
          
          setIsProcessing({ 
            active: true, 
            text: `Procesando QRs: ${Math.min(i + CHUNK_SIZE, totalBienes)} de ${totalBienes}...` 
          });

          const results = await Promise.all(
            chunk.map(async (bien) => {
              const dataUrl = await generateSimpleQR(bien);
              return { bien, dataUrl };
            })
          );

          results.forEach(({ bien, dataUrl }) => {
            if (dataUrl) {
              const rotuloSeguroQR = bien.rotulo ? String(bien.rotulo) : 'S-R';
              const cleanRotulo = rotuloSeguroQR.replace(/[^a-zA-Z0-9]/g, '');
              folder.file(`QR_${cleanRotulo}.png`, dataUrl.replace(/^data:image\/png;base64,/, ""), { base64: true });
            }
          });
        }

        setIsProcessing({ active: true, text: 'Generando paquete comprimido ZIP...' });
        const content = await zip.generateAsync({ type: "blob" });

        if (window.saveAs) {
          window.saveAs(content, `QRs_Simples_${cleanDepName}_${new Date().toISOString().split('T')[0]}.zip`);
        }
        
        try {
          const idsToUpdate = filteredBienes.map(b => b.id);
          setBienes(prev => prev.map(b => idsToUpdate.includes(b.id) ? { ...b, hasQR: true } : b));
          for (const bien of filteredBienes) {
            if (!bien.hasQR) {
              await supabase.from("bens").update({ data: { ...bien, hasQR: true } }).eq("id", bien.id);
            }
          }
        } catch (e) { console.error("Error bulk simple QR:", e); }
        addToast("Archivo ZIP de QRs generado con éxito", "success");
      } catch (error) {
        console.error("Error en ZIP QR:", error);
        addToast("Hubo un error al generar el archivo ZIP.", "error");
      } finally {
        setIsProcessing({ active: false, text: '' });
        setIsQRModalOpen(false);
      }
    }, 100);
  };



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

  const handleGenerateFC04PDF = (fc) => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast("Cargando librerías PDF...", "warning");
    setIsProcessing({ active: true, text: 'Generando PDF FC-04...' });
    setTimeout(async () => {
      try {
        const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', FORMATO_PDF); const pageWidth = doc.internal.pageSize.width; const pageHeight = doc.internal.pageSize.height;
        const logoImg = await resolveLogoImg(fc.dependencia); doc.addImage(logoImg, 'PNG', 14, 12, 22, 22); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, 18, { align: 'center' }); doc.setFontSize(11); doc.text("DIRECCIÓN DE CONTABILIDAD", pageWidth / 2, 24, { align: 'center' }); doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, 29, { align: 'center' }); doc.setFontSize(14); doc.text("MOVIMIENTO DE BIENES DE USO (FC-04)", pageWidth / 2, 40, { align: 'center' });
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const mesNombre = monthNames[parseInt(fc.mes) - 1]; doc.setFontSize(10); doc.text(`Dependencia: ${fc.dependencia}`, 14, 50); doc.text(`Periodo: ${mesNombre.toUpperCase()} ${fc.anio}`, pageWidth - 14, 50, { align: 'right' }); const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento); doc.text(`Origen de Movimiento: ${origenObj ? `${origenObj.id} - ${origenObj.nombre}` : fc.origenMovimiento}`, 14, 56);
        let finalY = 62;
        if (fc.sinMovimiento) { doc.setFontSize(16); doc.setTextColor(100, 100, 100); doc.text("NO SE REGISTRA MOVIMIENTO ESTE MES", pageWidth / 2, finalY + 30, { align: 'center' }); finalY += 60; } 
        else { 
            const tableRows = fc.bienesSnapshot.map(b => [b.cuenta || '-', b.subcuenta || '-', b.analitico1 || '-', b.analitico2 || '-', b.rotulo || '-', b.descripcion || '-', formatCurrency(b.valorUnitario), formatDateText(b.fechaAdquisicion) || '-', b.vidaUtil || '-']); 
            doc.autoTable({ startY: finalY, theme: 'grid', head: [["Cuenta", "Subcuenta", "Analítico 1", "Analítico 2", "Rótulo / Código", "Descripción del Bien", "Valor Unitario (Gs.)", "Fecha Adquisición", "Vida atil"]], body: tableRows, rowPageBreak: 'avoid', margin: { bottom: 30 }, styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, headStyles: { fillColor: [248, 249, 250], fontStyle: 'bold', halign: 'center', textColor: [32,33,36] }, alternateRowStyles: { fillColor: [250, 252, 253] }, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 6: { halign: 'right', fontStyle: 'bold' }, 7: { halign: 'center' }, 8: { halign: 'center' } } }); finalY = doc.lastAutoTable.finalY + 10; 
        }
        if (!fc.sinMovimiento && fc.bienesSnapshot?.length > 0) { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0); doc.text(`Cantidad Total de Bienes: ${fc.bienesSnapshot.length}`, 14, finalY); finalY += 10; }
        if (finalY > pageHeight - 45) { doc.addPage(); finalY = 40; }
        let firmasY = finalY + 25; doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4); doc.line(pageWidth / 4 - 30, firmasY, pageWidth / 4 + 30, firmasY); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Director Administrativo", pageWidth / 4, firmasY + 5, { align: 'center' }); doc.line(pageWidth * 0.75 - 30, firmasY, pageWidth * 0.75 + 30, firmasY); doc.text("Jefe de Bienes Patrimoniales", pageWidth * 0.75, firmasY + 5, { align: 'center' });
        const cleanDepName = fc.dependencia.replace(/\s+/g, '_'); doc.save(`FC04_${cleanDepName}_${fc.mes}-${fc.anio}.pdf`); addToast("Reporte PDF FC-04 generado", "success");
      } catch(e) { console.error(e); addToast("Error PDF: " + (e.message || "Desconocido"), "error"); } finally { setIsProcessing({ active: false, text: '' }); }
    }, 100);
  };

  const handleGenerateFC11PDF = (fcsData) => {
    const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
    if (fcs.length === 0) return addToast("No hay datos para generar FC-11", "warning");
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast("Cargando librerías PDF...", "warning");
    setIsProcessing({ active: true, text: 'Generando PDF FC-11...' });
    const todayStr = new Date().toISOString().split('T')[0];
    setTimeout(async () => {
      try {
        const fc = fcs[0]; const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', FORMATO_PDF); const pageWidth = doc.internal.pageSize.width; const pageHeight = doc.internal.pageSize.height;
        const logoImg = await resolveLogoImg(fc.dependencia); const dateParts = (fc.fecha || '').split('-'); let formattedDate = ''; if(dateParts.length === 3) { const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]; formattedDate = `Pilar, ${dateParts[2]} de ${months[parseInt(dateParts[1])-1]} de ${dateParts[0]}`; }
        const copias = ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO'];
        for(let i = 0; i < 3; i++) {
            if(i > 0) doc.addPage();
            doc.addImage(logoImg, 'PNG', 14, 12, 22, 22); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, 18, { align: 'center' }); doc.setFontSize(11); doc.text("DIRECCIÓN DE CONTABILIDAD", pageWidth / 2, 24, { align: 'center' }); doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, 29, { align: 'center' }); doc.setFontSize(13); doc.text("FORMULARIO DE MOVIMIENTO INTERNO DE BIENES (FC-11)", pageWidth / 2, 38, { align: 'center' });
            doc.setFontSize(6); doc.setTextColor(200); doc.setFont("helvetica", "italic"); doc.text(`--- ${copias[i]} ---`, pageWidth - 14, 12, { align: 'right' }); doc.setTextColor(0); doc.setFont("helvetica", "normal");
            doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(`Nº Formulario: ${fc.numeroFormulario || 'S/N'}`, 14, 48); doc.setFont("helvetica", "normal"); doc.text(formattedDate, pageWidth - 14, 48, { align: 'right' });
            let finalY = 54; doc.autoTable({ startY: finalY, theme: 'grid', rowPageBreak: 'avoid', margin: { bottom: 30 }, body: [ [`Dependencia Remitente: ${fc.dependenciaRemitente || ''} ${fc.areaRemitente ? '- ' + fc.areaRemitente : ''}`.trim()], [`Dependencia Destinataria: ${fc.dependenciaDestinataria || ''} ${fc.areaDestinataria ? '- ' + fc.areaDestinataria : ''}`.trim()] ], styles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', fillColor: [248, 249, 250] } }); finalY = doc.lastAutoTable.finalY + 6;
            const tableRows = fcs.map(item => { const b = item.bienSnapshot || {}; const cuentaFull = [b.cuenta, b.subcuenta, b.analitico1, b.analitico2].filter(Boolean).join('-'); return [ cuentaFull || '-', b.rotulo || '-', b.descripcion || '-', formatDateText(b.fechaAdquisicion) || '-', (item.estadoConservacion || b.estadoConservacion || '-').toUpperCase(), b.hasQR ? 'SÍ' : 'NO' ]; });
            if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
            doc.autoTable({ startY: finalY, theme: 'grid', head: [["Cuenta Contable", "Rótulo / Código", "Descripción del Bien", "Fecha de Adquisición", "Estado Físico", "QR"]], body: tableRows, rowPageBreak: 'avoid', margin: { bottom: 30 }, styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, headStyles: { fillColor: [248, 249, 250], fontStyle: 'bold', halign: 'center', textColor: [32,33,36] }, alternateRowStyles: { fillColor: [250, 252, 253] }, columnStyles: { 0: { halign: 'center', cellWidth: 32 }, 1: { halign: 'center', cellWidth: 26 }, 2: { cellWidth: 'auto' }, 3: { halign: 'center', cellWidth: 30 }, 4: { halign: 'center', cellWidth: 24 }, 5: { halign: 'center', cellWidth: 12 } } }); finalY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(`Cantidad Total de Bienes Trasladados: ${fcs.length}`, 14, finalY); finalY += 10;
            if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
            doc.setFont("helvetica", "bold"); doc.text("Motivo o circunstancia del movimiento:", 14, finalY); finalY += 8; const motivos = ["Traspaso", "Préstamo", "Inservible", "Faltante"]; let startX = 20; doc.setFont("helvetica", "normal");
            motivos.forEach((m) => { doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.rect(startX, finalY - 3, 4, 4); if (fc.motivo === m) { doc.setFont("helvetica", "bold"); doc.text("X", startX + 0.9, finalY + 0.4); doc.setFont("helvetica", "normal"); } doc.text(m, startX + 6, finalY + 0.4); startX += 40; }); finalY += 10;
            if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
            doc.setFont("helvetica", "bold"); doc.text("Observaciones:", 14, finalY); finalY += 6; doc.setFont("helvetica", "normal"); doc.text(fc.observaciones || 'Ninguna.', 14, finalY, { maxWidth: pageWidth - 28, align: 'justify' });
            if (finalY > pageHeight - 65) { doc.addPage(); finalY = 30;} else { finalY += 35; }
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4); doc.line(14, finalY, 70, finalY); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("Jefe de Dependencia Remitente", 42, finalY + 5, { align: 'center' }); doc.line(78, finalY, 138, finalY); doc.text("Jefe de Dependencia Destinataria", 108, finalY + 5, { align: 'center' }); doc.line(146, finalY, 202, finalY); doc.text("Jefe Dpto. Bienes Patrimoniales", 174, finalY + 5, { align: 'center' });
            let pieY = pageHeight - 15; doc.setFont("helvetica", "normal"); doc.text("Distribución: Original para el Departamento de Bienes Patrimoniales, Copias para dependencia remitente y destinataria.", 14, pieY);
        }
        const cleanFormNum = (fc.numeroFormulario || 'S-N').replace(/[^a-zA-Z0-9]/g, '-'); doc.save(`FC11_Traslado_${cleanFormNum}_${todayStr}.pdf`); addToast("Reporte FC-11 generado", "success");
      } catch(e) { console.error(e); addToast("Error PDF: " + (e.message || "Desconocido"), "error"); } finally { setIsProcessing({ active: false, text: '' }); }
    }, 100);
  };
  const handleGenerateFC10PDF = (fcsData, bienesData) => {
    const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
    const bienesAListar = Array.isArray(bienesData) ? bienesData : [bienesData];
    if (fcs.length === 0) return addToast("No hay datos para generar FC-10", "warning");

    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast("Cargando librerías PDF...", "warning");
    setIsProcessing({ active: true, text: 'Generando PDF FC-10...' });
    
    setTimeout(() => {
      try {
        const { doc, fechaDocumento, fc } = buildFC10PDFDoc(fcs, bienesAListar);
        const cleanFunc = (fc.funcionarioNombre || 'SR').replace(/\s+/g, '_'); 
        doc.save(`FC10_Asignacion_${cleanFunc}_${fechaDocumento}.pdf`); 
        addToast("Reporte PDF FC-10 generado", "success");
      } catch(e) { 
        console.error(e); addToast("Error PDF: " + (e.message || "Desconocido"), "error"); 
      } finally { 
        setIsProcessing({ active: false, text: '' }); 
      }
    }, 100);
  };
  const handleGenerateConsolidatedFC10PDF = (funcionarioNombreSeleccionado, fechaDesde, fechaHasta) => {
    const vigentes = bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && b.estadoConservacion !== 'De Baja');
    let bienesDelFuncionario = vigentes.filter(b => normalizeStr(b.funcionario) === normalizeStr(funcionarioNombreSeleccionado));
    
    // Aplicamos los filtros de fecha recibidos del modal
    if (fechaDesde) bienesDelFuncionario = bienesDelFuncionario.filter(b => b.fechaAdquisicion >= fechaDesde);
    if (fechaHasta) bienesDelFuncionario = bienesDelFuncionario.filter(b => b.fechaAdquisicion <= fechaHasta);
    
    if (bienesDelFuncionario.length === 0) return addToast("No se encontraron bienes en este rango de fechas.", "warning");

    const funcionarioPadronInfo = funcionariosPadron.find(f => normalizeStr(f.nombre) === normalizeStr(funcionarioNombreSeleccionado)) || {
        cedula: 'S/D',
        cargo: 'Funcionario'
    };

    const fc10Base = {
        funcionarioNombre: funcionarioNombreSeleccionado,
        funcionarioDoc: funcionarioPadronInfo.cedula,
        funcionarioCargo: funcionarioPadronInfo.cargo || 'Funcionario'
    };

    const fcsVirtuales = bienesDelFuncionario.map(b => ({
        ...fc10Base,
        bienId: b.id,
        estadoConservacion: b.estadoConservacion,
        valorTotal: b.valorUnitario,
        entregadoFecha: b.fechaAdquisicion || new Date().toISOString().split('T')[0]
    }));

    handleGenerateFC10PDF(fcsVirtuales, bienesDelFuncionario);
    setIsConsolidatedFC10ModalOpen(false);
  };
  const handleExportFC10CSV = () => {
    const fcsAnuales = fc10List.filter(fc => {
        if (fc.dependencia !== dependenciaActual) return false;
        const genDate = fc.entregadoFecha || fc.fechaGeneracion || '';
        const devDate = fc.devolucionFecha || '';
        const [gYear] = genDate.split('-');
        let matchDev = false;
        if (devDate) {
            const [dYear] = devDate.split('-');
            matchDev = (dYear === fc10Year);
        }
        return (gYear === fc10Year) || matchDev;
    }).sort((a, b) => new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime());

    if (fcsAnuales.length === 0) return addToast(`No hay datos FC-10 para el año ${fc10Year}`, "warning");
    
    setIsProcessing({ active: true, text: 'Generando Excel...' });
    setTimeout(() => {
      let csvContent = "\uFEFF"; 
      csvContent += "Fecha Asignacion;Dependencia;Unidad;Reparticion;Area;Funcionario;C.I.;Cargo;Rotulo;Descripcion;Cuenta Contable;Estado Fisico;Valor (Gs.);Fecha Devolucion;Observaciones\n";
      
      fcsAnuales.forEach(fc => {
          const b = bienes.find(bien => bien.id === fc.bienId) || {};
          const cuentaFull = [b.cuenta, b.subcuenta, b.analitico1, b.analitico2].filter(Boolean).join('-');
          const row = [
              formatDateText(fc.entregadoFecha || fc.fechaGeneracion),
              fc.dependencia, fc.unidad || '-', fc.reparticion || '-', fc.area || '-',
              fc.funcionarioNombre, formatCI(fc.funcionarioDoc), fc.funcionarioCargo,
              b.rotulo || '-', `"${(b.descripcion || '').replace(/"/g, '""')}"`, cuentaFull || '-',
              fc.estadoConservacion, (fc.valorTotal || b.valorUnitario || 0),
              fc.devolucionFecha ? formatDateText(fc.devolucionFecha) : 'Vigente',
              `"${(fc.observaciones || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(';') + "\n";
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, `Reporte_FC10_${dependenciaActual.replace(/\s+/g, '_')}_${fc10Year}.csv`);
      setIsProcessing({ active: false, text: '' });
      addToast(`Reporte Excel FC-10 (${fc10Year}) descargado`, "success");
    }, 100);
  };

  const handleExportFC11CSV = () => {
    const fcsAnuales11 = fc11List.filter(fc => {
        const rem = fc.dependenciaRemitente || fc.remitente || '';
        const dest = fc.dependenciaDestinataria || fc.destinatario || '';
        if (rem !== dependenciaActual && dest !== dependenciaActual) return false;
        const [year] = String(fc.fecha || '').split('-');
        return year === fc10Year;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    if (fcsAnuales11.length === 0) return addToast(`No hay datos FC-11 para el año ${fc10Year}`, "warning");
    
    setIsProcessing({ active: true, text: 'Generando Excel...' });
    setTimeout(() => {
      let csvContent = "\uFEFF";
      csvContent += "N Formulario;Fecha;Dep. Remitente;Area Remitente;Dep. Destinataria;Area Destinataria;Rotulo Bien;Descripcion Bien;Estado Fisico;Motivo;Observaciones\n";
      
      fcsAnuales11.forEach(fc => {
          const b = fc.bienSnapshot || {};
          const row = [
              fc.numeroFormulario, formatDateText(fc.fecha),
              fc.dependenciaRemitente || fc.remitente, fc.areaRemitente || '-',
              fc.dependenciaDestinataria || fc.destinatario, fc.areaDestinataria || '-',
              b.rotulo || '-', `"${(b.descripcion || '').replace(/"/g, '""')}"`,
              fc.estadoConservacion || b.estadoConservacion, fc.motivo,
              `"${(fc.observaciones || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(';') + "\n";
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, `Reporte_FC11_${dependenciaActual.replace(/\s+/g, '_')}_${fc10Year}.csv`);
      setIsProcessing({ active: false, text: '' });
      addToast(`Reporte Excel FC-11 (${fc10Year}) descargado`, "success");
    }, 100);
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
  
  const handleDownloadTemplateCSV = () => {
      const csvContent = "\uFEFFCuenta Mayor;Sub-Cuenta;Analítico 1;Analítico 2;Descripción General;Fecha Adquisición (YYYY-MM-DD);Nº Rótulo;Valor Unitario (Sin puntos);Vida atil (Años)\n" +
                          "2.6.1.01;01;01;01;\"Computadora HP i5\";2023-01-15;10001;4500000;5\n" +
                          ";;;;\"Escritorio de Madera\";2022-11-10;10002;1200000;10";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, "Plantilla_Carga_Masiva_Bienes.csv");
      addToast("Plantilla Excel (CSV) base descargada", "success");
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
            addToast(`¡0xito! Se guardaron ${newBienes.length} bienes nuevos.${duplicatesSkipped > 0 ? ` Se omitieron ${duplicatesSkipped} duplicados.` : ''}`, "success");
          } catch (error) {
            addToast("Error al guardar registros en la base de datos.", "error");
          }
        } else {
          addToast(`No se importó ningún bien. Se omitieron ${duplicatesSkipped} duplicados.`, "warning");
        }

        setIsProcessing({ active: false, text: '' });
        e.target.value = null;
      },
      error: (err) => {
        console.error(err);
        addToast("Error al procesar el archivo CSV.", "error");
        setIsProcessing({ active: false, text: '' });
      }
    });
  };
  // --- BACKUP GENERAL DE PROTECCIÓN DEL SISTEMA (SOLO ADMINS) ---
  const handleExportBackupGeneral = async () => {
    if (!isAdmin) return addToast("Acción permitida únicamente para administradores.", "error");
    setIsProcessing({ active: true, text: "Generando respaldo integral del sistema..." });

    try {
      const [allBienes, allFc10, allFc11, allFc04, allEstructuras, allUsuarios, allFuncionarios, allNotif, allAudit] = await Promise.all([
        supabase.from("bens").select("*"),
        supabase.from("fc10").select("*"),
        supabase.from("fc11").select("*"),
        supabase.from("fc04").select("*"),
        supabase.from("estructuras").select("*"),
        supabase.from("usuarios").select("username, nombre, cargo, dependencia"),
        supabase.from("funcionarios").select("*"),
        supabase.from("notificaciones").select("*"),
        supabase.from("auditoria").select("*")
      ]);

      const backupData = {
        metadata: {
          version: "2.0",
          sistema: "Sistema de Gestión Patrimonial UNP",
          fechaGeneracion: new Date().toISOString(),
          generadoPor: currentUser?.username || "Admin",
          totalBienes: allBienes.data?.length || 0,
          totalFuncionarios: allFuncionarios.data?.length || 0
        },
        bienes: allBienes.data || [],
        fc10: allFc10.data || [],
        fc11: allFc11.data || [],
        fc04: allFc04.data || [],
        estructuras: allEstructuras.data || [],
        usuarios: (allUsuarios.data || []).map(u => ({ username: u.username, nombre: u.nombre, cargo: u.cargo, rol: u.rol })),
        funcionarios: allFuncionarios.data || [],
        notificaciones: allNotif.data || [],
        auditoria: allAudit.data || []
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const fechaStr = new Date().toISOString().split("T")[0];
      
      if (window.saveAs) {
        window.saveAs(blob, `BACKUP_SISTEMA_PATRIMONIAL_UNP_${fechaStr}.json`);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BACKUP_SISTEMA_PATRIMONIAL_UNP_${fechaStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      await registrarAuditoria({
        usuario: currentUser?.username || "Admin",
        dependencia: dependenciaActual,
        accion: "BACKUP_COMPLETO",
        entidad: "SISTEMA",
        entidadId: "BACKUP",
        detalles: { fecha: fechaStr, generadoPor: currentUser?.username }
      });

      addToast("Copia de seguridad del sistema descargada exitosamente.", "success");
    } catch (err) {
      console.error("Error al generar backup general:", err);
      addToast("Error al generar copia de seguridad del sistema.", "error");
    } finally {
      setIsProcessing({ active: false, text: "" });
    }
  };
  const handleExportInventarioCSV = () => {
      if (filteredBienes.length === 0) return addToast("No hay bienes para exportar", "warning");
      setIsProcessing({ active: true, text: 'Generando Reporte Excel...' });
      setTimeout(() => {
          let csvContent = "\uFEFFCuenta;Subcuenta;Analitico 1;Analitico 2;Rotulo;Descripcion;Dependencia;Ubicacion;Funcionario;Fecha Adquisicion;Valor Unitario (Gs.);Estado Conservacion;Vida Util;Tiene FC10;Tiene QR\n";
          filteredBienes.forEach(b => {
              const row = [
                  b.cuenta || '-', b.subcuenta || '-', b.analitico1 || '-', b.analitico2 || '-',
                  b.rotulo || '-', `"${(b.descripcion || '').replace(/"/g, '""')}"`,
                  b.dependencia || '-', b.ubicacion || '-', b.funcionario || '-',
                  formatDateText(b.fechaAdquisicion) || '-', b.valorUnitario || '0',
                  b.estadoConservacion || '-', b.vidaUtil || '-',
                  b.hasFC10 ? 'SI' : 'NO', b.hasQR ? 'SI' : 'NO'
              ];
              csvContent += row.join(';') + "\n";
          });
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          if (window.saveAs) window.saveAs(blob, `Reporte_Inventario_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
          setIsProcessing({ active: false, text: '' });
          addToast("Reporte Excel descargado exitosamente", "success");
      }, 100);
  };
  const handleExportInventarioExcel = () => {
      if (filteredBienes.length === 0) return addToast("No hay bienes para exportar", "warning");
      if (!window.XLSX) return addToast("Cargando librería Excel, intenta de nuevo...", "warning");
      setIsProcessing({ active: true, text: 'Generando Excel...' });
      setTimeout(() => {
          try {
              const filas = filteredBienes.map(b => ({
                  'Cuenta': b.cuenta || '-', 'Subcuenta': b.subcuenta || '-',
                  'Analítico 1': b.analitico1 || '-', 'Analítico 2': b.analitico2 || '-',
                  'Rótulo': b.rotulo || '-', 'Descripción': b.descripcion || '-',
                  'Dependencia': b.dependencia || '-', 'Ubicación': b.ubicacion || '-',
                  'Funcionario': b.funcionario || '-',
                  'Fecha Adquisición': formatDateText(b.fechaAdquisicion) || '-',
                  'Valor Unitario (Gs.)': parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0,
                  'Estado': b.estadoConservacion || '-', 'Vida Útil': b.vidaUtil || '-',
                  'FC-10': b.hasFC10 ? 'SÍ' : 'NO', 'QR': b.hasQR ? 'SÍ' : 'NO'
              }));
              const wb = window.XLSX.utils.book_new();
              const ws = window.XLSX.utils.json_to_sheet(filas);
              ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 55 }, { wch: 22 }, { wch: 28 }, { wch: 30 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 8 }];
              ws['!autofilter'] = { ref: ws['!ref'] };
              const totalValor = filas.reduce((a, r) => a + (r['Valor Unitario (Gs.)'] || 0), 0);
              const porEstado = {};
              filas.forEach(r => { porEstado[r['Estado']] = porEstado[r['Estado']] || { cant: 0, valor: 0 }; porEstado[r['Estado']].cant++; porEstado[r['Estado']].valor += r['Valor Unitario (Gs.)'] || 0; });
              const resumen = [
                  { 'Concepto': 'Dependencia', 'Valor': dependenciaActual },
                  { 'Concepto': 'Fecha de generación', 'Valor': new Date().toLocaleDateString('es-PY') },
                  { 'Concepto': 'Total de bienes', 'Valor': filas.length },
                  { 'Concepto': 'Valor total (Gs.)', 'Valor': totalValor },
                  { 'Concepto': '', 'Valor': '' },
                  { 'Concepto': 'Estado', 'Valor': 'Cantidad / Valor (Gs.)' },
                  ...Object.keys(porEstado).map(k => ({ 'Concepto': k, 'Valor': `${porEstado[k].cant} / ${porEstado[k].valor.toLocaleString('es-PY')}` }))
              ];
              const ws2 = window.XLSX.utils.json_to_sheet(resumen);
              ws2['!cols'] = [{ wch: 28 }, { wch: 34 }];
              window.XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
              window.XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');
              window.XLSX.writeFile(wb, `Inventario_${dependenciaActual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
              addToast("Excel generado exitosamente", "success");
          } catch (e) {
              addToast("Error al generar el Excel.", "error");
          } finally {
              setIsProcessing({ active: false, text: '' });
          }
      }, 100);
  };
  const sincronizarBienesConPadron = async () => {
    setIsProcessing({ active: true, text: 'Sincronizando activos con el Padrón de Funcionarios...' });

    try {
      let actualizados = 0;
      const bienesAActualizar = [];

      const nuevosBienes = bienes.map(b => {
        if (b.funcionario && String(b.funcionario).trim() !== "") {
          const match = funcionariosPadron.find(f => 
            normalizeStr(f.nombre) === normalizeStr(b.funcionario) && 
            (f.dependencia === b.dependencia || !f.dependencia)
          );
          if (match && (b.funcionarioDoc !== match.cedula || b.funcionarioCargo !== match.cargo)) {
            actualizados++;
            const bienActualizado = { ...b, funcionarioDoc: match.cedula, funcionarioCargo: match.cargo };
            bienesAActualizar.push(bienActualizado);
            return bienActualizado;
          }
        }
        return b;
      });

      if (actualizados > 0) {
        setBienes(nuevosBienes);

        // Actualización por lotes para no congelar la app
        const CHUNK_SIZE = 10;
        for (let i = 0; i < bienesAActualizar.length; i += CHUNK_SIZE) {
          const chunk = bienesAActualizar.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunk.map(b => supabase.from('bens').update(conSello({ data: b })).eq('id', b.id))
          );
        }

        await localforage.setItem(`bienes_cache_${dependenciaActual}`, nuevosBienes);
        addToast(`¡Sincronización exitosa! Se actualizaron ${actualizados} registros con sus datos oficiales.`, "success");
      } else {
        addToast("Los activos de esta dependencia ya coinciden exactamente con el padrón oficial.", "info");
      }
    } catch (err) {
      console.error(err);
      addToast("Error al procesar la sincronización en la base de datos.", "error");
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const handleFileUploadFuncionarios = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingCSVImport({ type: 'funcionarios', file });
  };

  const executeProcessFuncionariosCSV = (file) => { 
    setIsProcessing({ active: true, text: 'Leyendo planilla de funcionarios...' });
    
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target.result;
        
        // FORZAR LA DECODIFICACIÓN EN UTF-8 PARA CORREGIR TILDES Y Ñ
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        
        const lines = text.split(/\r?\n/); 
        
        if (lines.length < 1) { 
            addToast("El archivo CSV está vacío.", "warning"); 
            setIsProcessing({ active: false, text: '' }); 
            return; 
        }
        
        const validos = [];
        const duplicados = [];
        const errores = [];

        // Mapeo automático de columnas por alias (acepta otros nombres, orden y sin tildes)
        const ALIAS_FUNC = {
          cedula: ['CÉDULA', 'CEDULA', 'CI', 'C.I.', 'DOCUMENTO', 'NRO DOCUMENTO', 'NÚMERO DE DOCUMENTO'],
          nombre: ['NOMBRE COMPLETO', 'NOMBRE', 'FUNCIONARIO', 'APELLIDO Y NOMBRE', 'NOMBRE Y APELLIDO', 'PERSONA'],
          cargo: ['CARGO', 'PUESTO', 'FUNCIÓN', 'FUNCION', 'ROL', 'CARGO INSTITUCIONAL'],
        };
        const normH = (s) => normalizeStr(s || '');
        let idx = { cedula: 0, nombre: 1, cargo: 2 };
        let startLine = 0;
        const primeraLinea = lines.findIndex(l => String(l).trim() !== '');
        if (primeraLinea !== -1) {
          const sep0 = lines[primeraLinea].includes(';') ? ';' : ',';
          const celdas0 = lines[primeraLinea].split(sep0).map(p => p.replace(/"/g, '').trim());
          const esCabecera = celdas0.some(c => Object.values(ALIAS_FUNC).flat().map(normH).includes(normH(c)));
          if (esCabecera) {
            ['cedula', 'nombre', 'cargo'].forEach(k => {
              const pos = celdas0.findIndex(c => ALIAS_FUNC[k].map(normH).includes(normH(c)));
              if (pos !== -1) idx[k] = pos;
            });
            startLine = primeraLinea + 1;
          }
        }

        for (let i = startLine; i < lines.length; i++) {
          const line = String(lines[i]).trim();
          if (!line) continue;

          const separator = line.includes(';') ? ';' : ',';
          const parts = line.split(separator).map(p => p.replace(/"/g, '').trim());

          if (parts.filter(p => p !== '').length < 2) {
              errores.push({ linea: i + 1, motivo: 'Estructura insuficiente (faltan columnas)' });
              continue;
          }

          const cedulaCSV = String(parts[idx.cedula] || '').replace(/\./g, '').trim();
          const nombreCSV = String(parts[idx.nombre] || '').trim();
          const cargoCSV = String(parts[idx.cargo] || '').trim();

          if (!cedulaCSV || !nombreCSV) {
              errores.push({ linea: i + 1, motivo: 'Cédula o Nombre vacíos' });
              continue;
          }

          const isDuplicateDB = funcionariosPadron.some(f => String(f.cedula || '').replace(/\D/g, '') === cedulaCSV.replace(/\D/g, '') && f.dependencia === dependenciaActual);
          const isDuplicateBatch = validos.some(f => String(f.cedula || '').replace(/\D/g, '') === cedulaCSV.replace(/\D/g, ''));
          const huerfanoExistente = funcionariosPadron.find(f => f.cedula === 'S/C' && normalizeStr(f.nombre) === normalizeStr(nombreCSV) && f.dependencia === dependenciaActual);

          const nuevoFunc = { 
              id: huerfanoExistente ? huerfanoExistente.id : generateId(), 
              cedula: cedulaCSV, 
              nombre: nombreCSV, 
              cargo: cargoCSV, 
              dependencia: dependenciaActual,
              esActualizacion: !!huerfanoExistente 
          };

          if (isDuplicateDB || isDuplicateBatch) {
              duplicados.push(nuevoFunc);
          } else {
              validos.push(nuevoFunc);
          }
        }

        setIsProcessing({ active: false, text: '' });
        setPendingFuncionariosToImport(validos);
        setCsvPreviewData({ validos, duplicados, errores, tipo: 'funcionarios' });
        setIsCSVPreviewOpen(true);
      }; 
      
      // CAMBIAR A READASARRAYBUFFER PARA PERMITIR EL DECODER UTF-8
      reader.readAsArrayBuffer(file); 
      e.target.value = null;
    }, 100);
  };
  const handleSaveManualFuncionario = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const nuevoFunc = {
          id: generateId(),
          cedula: f.get('cedula').replace(/\./g, '').trim(),
          nombre: f.get('nombre').trim(),
          cargo: f.get('cargo').trim(),
          ubicacion: String(f.get('ubicacion') || '').trim(),
          dependencia: dependenciaActual
      };

      if (!nuevoFunc.cedula || !nuevoFunc.nombre) return addToast("Cédula y Nombre son obligatorios.", "warning");

      try {
          const { error } = await supabase.from('funcionarios').insert([nuevoFunc]);
          if (error) throw error;
          setFuncionariosPadron(prev => [...prev, nuevoFunc]);
          addToast("Funcionario registrado exitosamente", "success");
          setIsNewFuncionarioModalOpen(false);
      } catch (err) {
          addToast("Error al registrar el funcionario en la base de datos.", "error");
      }
  };

  const handleDownloadTemplateFuncionarios = () => {
      const csvContent = "\uFEFFCédula;Nombre Completo;Cargo\n1234567;Juan Pérez;Asistente Administrativo\n7654321;María Gómez;Directora de Área";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, "Plantilla_Carga_Funcionarios.csv");
      addToast("Plantilla CSV del padrón descargada", "success");
  };
  const confirmCSVImportFuncionarios = async () => {
    if (pendingFuncionariosToImport.length === 0) return;
    setIsProcessing({ active: true, text: 'Sincronizando funcionarios...' });
    
    try {
        const porActualizar = pendingFuncionariosToImport.filter(f => f.esActualizacion);
        const porInsertar = pendingFuncionariosToImport.filter(f => !f.esActualizacion);

        if (porInsertar.length > 0) {
            // Limpiamos el objeto para quitar 'esActualizacion' antes de insertar
            const payloadInsert = porInsertar.map(({ esActualizacion, ...rest }) => rest);
            const { error: errIns } = await supabase.from('funcionarios').insert(payloadInsert);
            if (errIns) throw errIns;
        }

        for (const act of porActualizar) {
            const { error: errUpd } = await supabase.from('funcionarios')
                .update({ cedula: act.cedula, cargo: act.cargo, nombre: act.nombre })
                .eq('id', act.id);
            if (errUpd) throw errUpd;
        }
        
        // Actualización local dirigida (mismo efecto que la recarga, sin transferencia extra)
        setFuncionariosPadron(prev => {
            let lista = [...prev];
            porActualizar.forEach(act => {
                lista = lista.map(f => f.id === act.id ? { ...f, cedula: act.cedula, cargo: act.cargo, nombre: act.nombre } : f);
            });
            const nuevos = porInsertar.map(({ esActualizacion, ...rest }) => rest);
            return [...nuevos, ...lista];
        });
        addToast(`¡0xito! Procesados ${pendingFuncionariosToImport.length} registros (${porActualizar.length} actualizados).`, "success");
    } catch (error) {
        console.error(error);
        addToast("Error al sincronizar con la base de datos.", "error");
    } finally {
        setIsProcessing({ active: false, text: '' });
        setIsCSVPreviewOpen(false);
        setPendingFuncionariosToImport([]);
    }
  };
  const handleDeleteFuncionario = (id) => {
    const f = funcionariosPadron.find(x => x.id === id);
    if (isAdmin) {
      setItemToDelete({ type: 'funcionario', id, item: f });
    } else {
      setItemToDelete({ type: 'requestBajaFuncionario', id, item: f });
    }
  };
const handleEditFuncionario = (funcionario) => {
    setFuncionarioToEdit(funcionario);
    setIsFuncionarioModalOpen(true);
  };

  const saveFuncionarioEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nuevoNombre = formData.get('nombre').trim();
    const nuevoCargo = formData.get('cargo').trim();
    const nuevaUbicacion = String(formData.get('ubicacion') || '').trim();

    try {
        const { error } = await supabase
          .from('funcionarios')
          .update({ nombre: nuevoNombre, cargo: nuevoCargo, ubicacion: nuevaUbicacion })
          .eq('id', funcionarioToEdit.id);

        if (error) throw error;
        setFuncionariosPadron(prev => prev.map(f => f.id === funcionarioToEdit.id ? { ...f, nombre: nuevoNombre, cargo: nuevoCargo, ubicacion: nuevaUbicacion } : f));
        addToast("Funcionario actualizado exitosamente", "success");
        setIsFuncionarioModalOpen(false);
    } catch (err) {
        addToast("Error al actualizar el funcionario", "error");
    }
  };


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
  const renderPaginationFuncionarios = () => (
    <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
      <span className="text-sm text-zinc-500 font-medium">
        Mostrando <span className="font-bold text-zinc-900 dark:text-white">
          {(currentPaginaFuncionarios - 1) * itemsPorPaginaFuncs + (funcionariosPurosDependencia.length > 0 ? 1 : 0)} - {Math.min(currentPaginaFuncionarios * itemsPorPaginaFuncs, funcionariosPurosDependencia.length)}
        </span> de {funcionariosPurosDependencia.length}
      </span>
      <div className="flex gap-2">
        <button 
          disabled={currentPaginaFuncionarios <= 1} 
          onClick={() => setCurrentPaginaFuncionarios(prev => prev - 1)} 
          className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer"
        >
          Anterior
        </button>
        <button 
          disabled={currentPaginaFuncionarios >= totalPagesFuncs || totalPagesFuncs === 0} 
          onClick={() => setCurrentPaginaFuncionarios(prev => prev + 1)} 
          className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer"
        >
          Siguiente
        </button>
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
// Bypass de desarrollador (?mant=off): permite trabajar durante el mantenimiento
if (typeof window !== 'undefined') {
  try {
    if (new URLSearchParams(window.location.search).get('mant') === 'off') {
      sessionStorage.setItem('mant_bypass', '1');
    }
  } catch (e) {}
}
const mantBypass = typeof window !== 'undefined' && sessionStorage.getItem('mant_bypass') === '1';
// Auto-reparación de rol: si el mantenimiento está activo y la sesión local no
// refleja el rol desarrollador, se verifica en vivo contra la base (cubre
// cambios de rol posteriores al login y sesiones locales viejas).
useEffect(() => {
  if (!mantenimiento?.en_mantenimiento || esDesarrollador || !currentUser?.username) return;
  let vivo = true;
  (async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('cargo').eq('username', currentUser.username).maybeSingle();
      if (!vivo || error || !data) return;
      if (data.cargo === 'desarrollador') {
        const actualizado = { ...currentUser, cargo: 'desarrollador', role: 'dev' };
        setCurrentUser(actualizado);
        try {
          localStorage.setItem('is_logged_in', 'true');
          localStorage.setItem('current_user', JSON.stringify(actualizado));
        } catch (e) {}
      }
    } catch (e) {}
  })();
  return () => { vivo = false; };
}, [mantenimiento?.en_mantenimiento]);
const saveMantenimiento = async (data) => {
  setIsSavingMant(true);
  try {
    const payload = { id: 'global', ...data };
    const { error } = await supabase.from('app_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    setMantenimiento(payload);
    setIsMantenimientoModalOpen(false);
    addToast(
      data.en_mantenimiento ? 'Modo mantenimiento activado para todos.' : 'Sistema habilitado nuevamente.',
      data.en_mantenimiento ? 'warning' : 'success'
    );
  } catch (e) {
    addToast('No se pudo guardar. Crea la tabla app_config en Supabase (te pasé el SQL).', 'error');
  } finally {
    setIsSavingMant(false);
  }
};
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
                                {activeTab === 'dashboard' && (
                  <div className="space-y-5 sm:space-y-6 animate-fade-in pb-12">
                    
                    {/* 1. ENCABEZADO DE PÁGINA COMPACTO */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xl sm:text-2xl shadow-md">
                          {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 truncate">
                            Panel General · {dependenciaActual}
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight truncate mt-0.5">
                            {saludoBienvenida}, {currentUser?.nombre || 'Usuario'}!
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 rounded-2xl bg-white dark:bg-white/5 px-4 py-2.5 border border-zinc-200/80 dark:border-white/10 shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Sistema Sincronizado</span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">Conexión activa</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. TARJETAS DE MÉTRICAS ACCIONABLES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" data-tour="dash-stats">

                      {/* Bienes Activos */}
                      <button
                        onClick={() => { clearAllFilters(); setActiveTab('inventario'); }}
                        title="Ver inventario completo"
                        className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                            <i className="fa-solid fa-boxes-stacked text-lg"></i>
                          </div>
                          <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                          {isLoading ? '…' : <AnimatedNumber value={stats.totalItems} />}
                        </p>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
                          Bienes Activos
                        </p>
                        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-2 truncate">
                          Total en {dependenciaActual}
                        </p>
                      </button>

                      {/* Bienes con QR */}
                      <button
                        onClick={() => { clearAllFilters(); setFiltroQR('YES'); setActiveTab('inventario'); }}
                        title="Ver bienes con QR"
                        className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 backdrop-blur border border-violet-500/25 text-violet-600 dark:text-violet-300">
                            <i className="fa-solid fa-qrcode text-lg"></i>
                          </div>
                          <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                          {isLoading ? '…' : <><AnimatedNumber value={stats.withQR} />
                          <span className="text-base text-zinc-400 font-semibold"> / {isLoading ? '…' : Number(stats.totalItems || 0).toLocaleString('es-PY')}</span></>}
                        </p>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
                          Bienes con QR
                        </p>
                        <div className="mt-2.5 h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${stats.percQR || 0}%` }}></div>
                        </div>
                      </button>

                      {/* Sin FC-10 */}
                      <button
                        onClick={() => { clearAllFilters(); setFiltroFC10('NO'); setActiveTab('inventario'); }}
                        title="Ver bienes sin FC-10"
                        className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-amber-200/70 dark:border-amber-400/20 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
                            <i className="fa-solid fa-file-signature text-lg"></i>
                          </div>
                          <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                          {isLoading ? '…' : <AnimatedNumber value={stats.withoutFc10} />}
                        </p>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
                          Sin FC-10
                        </p>
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">
                          Pendientes de asignación
                        </p>
                      </button>

                      {/* Pendiente QR */}
                      <button
                        onClick={() => { clearAllFilters(); setFiltroQR('NO'); setActiveTab('inventario'); }}
                        title="Ver bienes sin QR"
                        className="group relative text-left bg-white dark:bg-white/[0.04] rounded-3xl border border-rose-200/70 dark:border-rose-400/20 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white">
                            <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                          </div>
                          <i className="fa-solid fa-chevron-right text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all"></i>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                          {isLoading ? '…' : <AnimatedNumber value={stats.withoutQR} />}
                        </p>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.14em]">
                          Pendiente QR
                        </p>
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-2">
                          Sin etiqueta generada
                        </p>
                      </button>

                    </div>

                    {/* 2B. BANDEJA DE PENDIENTES */}
                    <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm" data-tour="dash-pendientes">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-list-check text-zinc-400"></i> Atención requerida
                            </h2>
                            {pendientes.every(p => p.count === 0) && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <i className="fa-solid fa-circle-check"></i> Todo al día
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                            {pendientes.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { clearAllFilters(); setFiltroPendiente(p.id); setActiveTab('inventario'); }}
                                    title={`Atender: ${p.label}`}
                                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/[0.06] px-3.5 py-3 text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                >
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${p.box}`}>
                                        <i className={`fa-solid ${p.icon} text-sm`}></i>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-lg font-bold tabular-nums text-zinc-900 dark:text-white leading-tight"><AnimatedNumber value={p.count} /></span>
                                        <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">{p.label}</span>
                                    </span>
                                    <i className="fa-solid fa-chevron-right text-[10px] text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all shrink-0"></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. ACCESOS DIRECTOS */}
                    <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-3 sm:p-4 shadow-sm">
                        <p className="px-2 pb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Accesos directos</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title="Añadir nuevo registro" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-[13px] transition-all shadow-sm active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-plus text-xs"></i> Nuevo registro
                            </button>
                            <span className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1"></span>
                            <button onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i> Importar
                            </button>
                            <button onClick={handleExportInventarioCSV} title="Exportar archivo CSV" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-file-export text-sky-600 dark:text-sky-400"></i> Exportar
                            </button>
                            <button onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} title="Generar lote masivo de QRs" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-qrcode text-violet-600 dark:text-violet-400"></i> Lote QRs
                            </button>
                            <button onClick={openFC03Modal} title="Generar reporte FC-03" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-print text-amber-600 dark:text-amber-400"></i> FC-03
                            </button>
                        </div>
                    </div>

                    {/* 4. GRÁFICOS Y TENDENCIAS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      
                      {/* Estado de Regularización */}
                      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
                        <div className="flex justify-between items-center mb-8">
                          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                             <i className="fa-solid fa-chart-pie text-emerald-500"></i> Metas de Cobertura
                          </h2>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/5">Metas</span>
                        </div>
                        
                        <div className="flex flex-1 flex-col gap-8 justify-center">
                          {/* Progreso FC-10 */}
                          <div>
                            <div className="flex justify-between items-end mb-3">
                              <div>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Cobertura FC-10</p>
                                <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withFc10} de {stats.totalItems} activos asignados</p>
                              </div>
                              <span className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{stats.percFC10.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${stats.percFC10}%` }}></div>
                            </div>
                          </div>

                          {/* Progreso QR */}
                          <div>
                            <div className="flex justify-between items-end mb-3">
                              <div>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Etiquetado QR</p>
                                <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withQR} de {stats.totalItems} activos con código</p>
                              </div>
                              <span className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{stats.percQR.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-primary rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${stats.percQR}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tendencias Operativas */}
                      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
                        <div className="flex justify-between items-center mb-8">
                          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                             <i className="fa-solid fa-chart-line text-brand-primary"></i> Gestión Anual
                          </h2>
                        </div>
                        <div className="flex flex-1 flex-col sm:flex-row gap-8">
                          
                          <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-200/60 dark:border-white/10 pb-6 sm:pb-0 sm:pr-6">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Adquisiciones Anuales</h3>
                            <div className="flex-1 flex flex-col justify-center gap-5">
                              {timeStats.adqByYear.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center text-center py-4 opacity-50">
                                      <p className="text-xs font-medium text-zinc-500">Sin adquisiciones.</p>
                                  </div>
                              ) : timeStats.adqByYear.map((item, idx) => {
                                  const colors = ["bg-zinc-900 dark:bg-white", "bg-zinc-600 dark:bg-zinc-400", "bg-zinc-400 dark:bg-zinc-600", "bg-zinc-300 dark:bg-zinc-700"];
                                  return <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={colors[idx] || "bg-zinc-400"} bgClass="bg-zinc-100 dark:bg-white/5" title={`Filtrar inventario por año ${item.year}`} onClick={() => { clearAllFilters(); setFiltroAnio(item.year); setActiveTab('inventario'); }} />;
                              })}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Asignaciones (FC-10)</h3>
                            <div className="flex-1 flex flex-col justify-center gap-6">
                              <SimpleBar label={`Actual (${timeStats.currentMonthName})`} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones de este mes" onClick={() => { setFc10Year(timeStats.asigCurrent.year); setFc10Month(timeStats.asigCurrent.month); setActiveTab('fc10'); }} />
                              <SimpleBar label={`Anterior (${timeStats.prevMonthName})`} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-zinc-300 dark:bg-zinc-600" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones del mes anterior" onClick={() => { setFc10Year(timeStats.asigPrev.year); setFc10Month(timeStats.asigPrev.month); setActiveTab('fc10'); }} />
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {activeTab === 'resumen' && (<ResumenView dependenciaActual={dependenciaActual} stats={stats} pendientes={pendientes} fc10List={fc10List} />)}
                {activeTab === 'inventario' && (
  <div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-900 dark:text-slate-100">
    
    {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
    <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

      {/* Título de la Sección + Contador */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
          <i className="fa-solid fa-boxes-stacked text-lg"></i>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap">
              Inventario General
            </h2>
            <span title={hasFilters ? 'Bienes que coinciden con los filtros' : 'Incluye bienes dados de baja; los activos se miden en el Panel'} className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 whitespace-nowrap shrink-0">
              {hasFilters ? `${filteredBienes.length} resultados` : `${filteredBienes.length} registros · ${stats.totalItems} activos`}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestión integral e inventario consolidado de activos de la Universidad
          </p>
        </div>
      </div>

      {/* Barra de Acciones Rápidas: secundarias con scroll, CTA primario siempre visible */}
      <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto hide-scrollbar py-0.5 -my-0.5">
        <button 
          onClick={handleDownloadTemplateCSV} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Descargar Plantilla CSV"
        >
          <i className="fa-solid fa-file-excel text-emerald-600"></i>
          <span>Plantilla</span>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Importar archivo CSV"
        >
          <i className="fa-solid fa-file-import text-emerald-600"></i>
          <span>Importar</span>
        </button>

        <button 
          onClick={handleExportInventarioCSV} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Exportar archivo CSV"
        >
          <i className="fa-solid fa-file-export text-sky-600"></i>
          <span>Exportar</span>
        </button>

        <button 
          onClick={handleExportInventarioExcel} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Exportar Excel real (.xlsx)"
        >
          <i className="fa-solid fa-file-excel text-emerald-600 dark:text-emerald-400"></i>
          <span>Excel</span>
        </button>

        <button 
          onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Generar Lote Masivo de QRs"
        >
          <i className="fa-solid fa-qrcode text-indigo-600 dark:text-indigo-400"></i>
          <span>Lote QRs</span>
        </button>

        <button 
          onClick={openFC03Modal} 
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          title="Generar Reporte FC-03"
        >
          <i className="fa-solid fa-print text-amber-600"></i>
          <span>FC-03</span>
        </button>
      </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block shrink-0"></div>

        <button 
          onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} 
          className="inline-flex shrink-0 items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span className="whitespace-nowrap">Añadir Registro</span>
        </button>
      </div>

    </div>

    {/* 2. PANEL DE FILTROS BaSQUEDA Y SELECCIÓN EN GRID */}
    <div className="bg-white dark:bg-white/[0.04] p-4 sm:p-5 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm space-y-4">
      
      {/* Campo de Búsqueda Principal */}
      <div className="relative w-full">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
        <input 
          type="text"
          ref={searchRef}
          title="Buscar (atajo: /)"
          data-tour="inv-search"
          placeholder="Buscar por rótulo, descripción, funcionario... Ej: 1045 silla"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSearchInput(e.target.value); setCurrentPage(1); }}
          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 pl-11 pr-11 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); }}
            title="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>

      {/* Rejilla de Filtros Secundarios (4 Columnas Equilibradas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        
        {/* Responsables */}
        <select 
          value={filtroFuncionario || ''} 
          onChange={(e) => setFiltroFuncionario(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Responsables: Todos</option>
          {funcionariosUnicos.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Ubicaciones */}
        <select 
          value={filtroUbicacion || ''} 
          onChange={(e) => setFiltroUbicacion(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Ubicación: Todas</option>
          {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        {/* Año */}
        <select 
          value={filtroAnio || ''} 
          onChange={(e) => setFiltroAnio(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Año: Todos</option>
          {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Subcuenta */}
        <select 
          value={filtroSubcuenta || ''} 
          onChange={(e) => setFiltroSubcuenta(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Subcuenta: Todas</option>
          {subcuentasUnicas.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Analítico 1 */}
        <select 
          value={filtroAnalitico1 || ''} 
          onChange={(e) => setFiltroAnalitico1(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Analítico 1: Todos</option>
          {analiticos1Unicos.map(a1 => <option key={a1} value={a1}>{a1}</option>)}
        </select>

        {/* Analítico 2 */}
        <select 
          value={filtroAnalitico2 || ''} 
          onChange={(e) => setFiltroAnalitico2(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="">Analítico 2: Todos</option>
          {analiticos2Unicos.map(a2 => <option key={a2} value={a2}>{a2}</option>)}
        </select>

        {/* FC-10 */}
        <select 
          value={filtroFC10 || 'ALL'} 
          onChange={(e) => setFiltroFC10(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="ALL">FC-10: Todos</option>
          <option value="YES">Con FC-10</option>
          <option value="NO">Sin FC-10</option>
        </select>

        {/* Estado */}
        <select 
          value={filtroEstado || 'ALL'} 
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 h-10 px-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 cursor-pointer transition-all focus-visible:ring-2"
        >
          <option value="ALL">Estado: Todos</option>
          {ESTADOS_CONSERVACION.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

      </div>

      {/* Vistas guardadas + Restablecer */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {vistasGuardadas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mr-auto">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Vistas:</span>
            {vistasGuardadas.map(v => (
              <span key={v.nombre} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                <button onClick={() => aplicarVista(v)} title={`Aplicar vista "${v.nombre}"`} className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  {v.nombre}
                </button>
                <button onClick={() => eliminarVista(v.nombre)} title="Eliminar vista" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-400 transition-colors cursor-pointer">
                  <i className="fa-solid fa-xmark text-[9px]"></i>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {hasFilters && !mostrarGuardarVista && (
            <button
              onClick={() => setMostrarGuardarVista(true)}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Guardar los filtros actuales como vista"
            >
              <i className="fa-solid fa-bookmark text-xs"></i> Guardar vista
            </button>
          )}
          {mostrarGuardarVista && (
            <span className="flex items-center gap-1.5">
              <input
                type="text"
                value={nombreVista}
                onChange={(e) => setNombreVista(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') guardarVistaActual(); if (e.key === 'Escape') setMostrarGuardarVista(false); }}
                placeholder="Nombre de la vista..."
                autoFocus
                className="h-8 w-40 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              />
              <button onClick={guardarVistaActual} title="Guardar" className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer">
                <i className="fa-solid fa-check text-[11px]"></i>
              </button>
            </span>
          )}
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-xs"></i> Restablecer filtros
            </button>
          )}
        </div>
      </div>

    </div>

    {/* 3. TABLA Y LISTADO DE BIENES CON MATRIZ COMPLETA DE ACCIONES */}
      {filtroPendiente && (
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Mostrando:</span>
          <button
            onClick={() => { setFiltroPendiente(''); setCurrentPage(1); }}
            title="Quitar filtro de pendientes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
          >
            {PENDIENTE_LABELS[filtroPendiente] || filtroPendiente}
            <i className="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </div>
      )}
                    <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden" data-tour="inv-table">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                          
                                                    <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
                            <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                              <th className="py-4 pl-6 sm:pl-8 pr-4 w-[38%]">Identificación y Descripción</th>
                              <th className="px-4 py-4 w-[28%]">Localización y Custodio</th>
                              <th className="px-4 py-4 w-[18%]">Condición y Estado</th>
                              <th className="py-4 pl-4 pr-6 sm:pr-8 text-right w-[16%]">Acciones</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/30">
                            {itemsPaginados.map((item) => {
                              
                              const getCondicionBadge = (cond) => {
                                const c = (cond || '').toLowerCase();
                                if (c.includes('muy bueno') || c.includes('excelente')) 
                                  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                                if (c.includes('bueno')) 
                                  return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                              };

                              return (
                                <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                  
                                  {/* Columna 1: Identificación */}
                                  <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                                    <div className="flex items-start gap-3.5">
                                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-xs">
                                        <i className="fa-solid fa-tag text-sm"></i>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                                            {item.rotulo || 'S/R'}
                                          </span>
                                          {item.fechaAdquisicion && (
                                            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                              <i className="fa-regular fa-calendar text-[9px]"></i>
                                              {item.fechaAdquisicion}
                                            </span>
                                          )}
                                        </div>
                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-snug">
                                          {item.descripcion}
                                        </p>
                                        {item.cuenta && (
                                          <span className="inline-block text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                            #{item.cuenta}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Columna 2: Localización y Custodio */}
                                  <td className="px-4 py-4 align-top">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                        <i className="fa-solid fa-user-check text-emerald-500 text-xs shrink-0"></i>
                                        <span className="truncate">{item.funcionario || 'Sin asignación'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                        <i className="fa-solid fa-location-dot text-rose-500 text-xs shrink-0"></i>
                                        <span className="truncate">{item.ubicacion || 'Sin ubicación'}</span>
                                      </div>
                                      {(() => {
                                        const fc10 = fc10VigentePorBien.get(item.id);
                                        const fechaAsig = fc10 ? (fc10.entregadoFecha || fc10.fechaGeneracion) : null;
                                        if (!fechaAsig) return null;
                                        return (
                                          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400" title={`Asignado por FC-10 el ${formatDateText(fechaAsig)}`}>
                                            <i className="fa-solid fa-file-signature text-brand-primary dark:text-brand-accent text-xs shrink-0"></i>
                                            <span className="truncate tabular-nums">Asignado: {formatDateText(fechaAsig)}</span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>

                                  {/* Columna 3: Condición y QR (Botón interactivo) */}
                                  <td className="px-4 py-4 align-middle">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`inline-flex items-center justify-center px-2.5 py-1 min-w-[76px] text-center rounded-xl text-[11px] font-bold border uppercase tracking-wider ${getCondicionBadge(item.estadoConservacion)}`}>
                                        {item.estadoConservacion || 'Regular'}
                                      </span>

                                      <button 
                                        type="button"
                                        onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                        title={item.hasQR ? "Ver / Descargar Código QR" : "Generar Código QR"}
                                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 min-w-[76px] rounded-xl text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                                          item.hasQR 
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs hover:opacity-85' 
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-400'
                                        }`}
                                      >
                                        <i className="fa-solid fa-qrcode text-[10px]"></i>
                                        <span>{item.hasQR ? 'Con QR' : 'Sin QR'}</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* Columna 4: Matriz Completa de Acciones Restaurada */}
                                  <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                                    <div className="flex items-center justify-end gap-1.5">

                                      {/* Ficha 360 y trazabilidad */}
                                      <button
                                        onClick={() => openFichaBien(item)}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-xl transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                                        title="Ficha 360 y trazabilidad"
                                      >
                                        <i className="fa-solid fa-timeline text-xs"></i>
                                      </button>

                                      {/* Generar QR */}
                                      <button 
                                        onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        title="Generar Código QR"
                                      >
                                        <i className="fa-solid fa-qrcode text-xs"></i>
                                      </button>

                                      {/* Asignar FC-10 */}
                                      <button 
                                        onClick={() => openFC10Modal(item)}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        title="Asignación FC-10"
                                      >
                                        <i className="fa-solid fa-file-signature text-xs"></i>
                                      </button>

                                      {/* Traslado FC-11 */}
                                      <button 
                                        onClick={() => openFC11Modal(item)}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        title="Traslado FC-11"
                                      >
                                        <i className="fa-solid fa-truck-fast text-xs"></i>
                                      </button>

                                      {/* Editar Bien */}
                                      <button 
                                        onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        title="Editar Bien"
                                      >
                                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                                      </button>

                                      {/* Eliminar o Solicitar Baja */}
                                      <button 
                                        onClick={() => {
                                          if (isAdmin) {
                                            setItemToDelete({ type: 'bien', id: item.id, item }); 
                                          } else {
                                            setItemToDelete({ type: 'requestBaja', id: item.id, item });
                                          }
                                        }}
                                        className="h-8 w-8 flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        title="Eliminar o Solicitar Baja"
                                      >
                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                      </button>

                                    </div>
                                  </td>

                                </tr>
                              );
                            })}

                            {itemsPaginados.length === 0 && (
                              <tr>
                                <td colSpan="4" className="p-16 text-center">
                                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3 shadow-inner">
                                    <i className="fa-solid fa-boxes-packing text-2xl"></i>
                                  </div>
                                  <span className="text-sm font-bold text-zinc-400">No se encontraron bienes coincidentes con los filtros.</span>
                                </td>
                              </tr>
                            )}
                          </tbody>

                        </table>
                      </div>

                      {/* Paginación Integrada */}
                      {renderPagination()}
                    </div>

                  </div>
                )}

                {activeTab === 'aprobaciones' && isAdmin && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                          <i className="fa-solid fa-check-to-slot text-lg"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Solicitudes de Baja</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                              {solicitudesBaja.length} pendientes
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Gestión y aprobación de bienes dados de baja en <strong className="text-zinc-900 dark:text-white font-semibold">{dependenciaActual}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
                            <tr className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                              <th className="py-4 pl-6 sm:pl-8 pr-4">Registro Solicitado</th>
                              <th className="px-4 py-4">Solicitante</th>
                              <th className="px-4 py-4">Fecha</th>
                              <th className="py-4 pl-4 pr-6 sm:pr-8 text-right">Decisión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/30">
                            {solicitudesBaja.map((notif) => {
                              // Solicitud de padrón: fila adaptada a funcionario
                              if (notif.tipo === 'BAJA_FUNCIONARIO') {
                                return (
                                  <tr key={notif.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                                          {(notif.nombre || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{notif.nombre || 'Sin nombre'}</p>
                                          <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">CI {notif.cedula || 'S/C'} · Padrón</p>
                                        </div>
                                      </div>
                                      {notif.motivo && (
                                        <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                          <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-amber-600"></i>
                                          <div className="flex-1">
                                            <span className="font-bold">Motivo:</span> {notif.motivo}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 align-top text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                      <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-user text-zinc-400"></i>
                                        <span>{notif.solicitante || 'Funcionario'}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-xs text-zinc-500 tabular-nums">
                                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Reciente'}
                                    </td>
                                    <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => resolverSolicitudFuncionario(notif, false)}
                                          className="px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                        >
                                          Rechazar
                                        </button>
                                        <button
                                          onClick={() => resolverSolicitudFuncionario(notif, true)}
                                          className="px-4 h-10 rounded-xl text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                                        >
                                          Aprobar Baja
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                              const bienAsociado = bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || {
                                id: notif.bienId || notif.bien_id,
                                rotulo: notif.rotulo || 'S/R',
                                descripcion: notif.descripcion || 'Sin descripción',
                                bajaSolicitadaPor: notif.solicitante || 'Usuario'
                              };

                              return (
                                <tr key={notif.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                                    <div className="space-y-1">
                                      <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                                        {bienAsociado.rotulo}
                                      </span>
                                      <p className="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-2">
                                        {bienAsociado.descripcion}
                                      </p>
                                      {notif.motivo && (
                                        <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                          <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-amber-600"></i>
                                          <div className="flex-1">
                                            <span className="font-bold">Motivo:</span> {notif.motivo}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 align-top text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    <div className="flex items-center gap-2">
                                      <i className="fa-solid fa-user text-zinc-400"></i>
                                      <span>{notif.solicitante || 'Funcionario'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 align-top text-xs text-zinc-500 font-mono">
                                    {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Reciente'}
                                  </td>
                                  <td className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                                        className="px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                      >
                                        Rechazar
                                      </button>
                                      <button
                                        onClick={() => openResolucionModal(bienAsociado, 'aprobar', notif)}
                                        className="px-4 h-10 rounded-xl text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                                      >
                                        Aprobar Baja
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {solicitudesBaja.length === 0 && (
                              <tr>
                                <td colSpan="4" className="p-16 text-center">
                                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 mb-3">
                                    <i className="fa-solid fa-check-double text-2xl"></i>
                                  </div>
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Bandeja de aprobaciones al día</p>
                                  <p className="text-xs text-zinc-400 mt-1">No hay solicitudes de baja pendientes en esta dependencia.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'auditoria' && isAdmin && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                          <i className="fa-solid fa-magnifying-glass-chart text-lg"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Auditoría</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                              Solo administradores
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Trazabilidad, conciliación física y verificación por muestreo</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => fetchAuditoria(1)} title="Recargar libro de auditoría" className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                        <i className={`fa-solid fa-rotate ${isLoadingAud ? 'fa-spin' : ''}`}></i> Actualizar
                      </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="aud-kpis">
                      {[
                        { label: 'Eventos (30 días)', valor: kpisAud.total, icon: 'fa-bolt', box: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' },
                        { label: 'Altas registradas', valor: kpisAud.altas, icon: 'fa-plus', box: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                        { label: 'Modificaciones', valor: kpisAud.mods, icon: 'fa-pen-to-square', box: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border border-zinc-500/20' },
                        { label: 'Bajas y eliminaciones', valor: kpisAud.bajas, icon: 'fa-flag', box: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
                      ].map(k => (
                        <div key={k.label} className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 shadow-sm">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl mb-4 ${k.box}`}>
                            <i className={`fa-solid ${k.icon}`}></i>
                          </div>
                          <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white tracking-tight">{k.valor}</p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mt-1">{k.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-chart-line text-emerald-500"></i> Evolución del valor patrimonial
                            </h3>
                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Últimos 12 meses</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">Valor incorporado por mes · clic en una barra para filtrar el inventario.</p>
                        <div className="flex items-end gap-1.5 sm:gap-2 h-40">
                            {evolucionValor.map(e => (
                                <button
                                    key={e.key}
                                    onClick={() => { clearAllFilters(); setFiltroAnio(e.year); setFiltroMes(e.month); setActiveTab('inventario'); }}
                                    title={`${e.etiqueta}: Gs. ${Number(e.valor).toLocaleString('es-PY')} — clic para filtrar`}
                                    className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 rounded-lg group/bar focus-visible:ring-2 focus-visible:ring-brand-primary outline-none cursor-pointer"
                                >
                                    <span className="text-[10px] font-bold tabular-nums text-zinc-400 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                        {e.valor > 0 ? formatoCortoGs(e.valor) : ''}
                                    </span>
                                    <span
                                        className={`w-full rounded-t-lg transition-all ${e.valor > 0 ? 'bg-emerald-500 group-hover/bar:bg-emerald-400' : 'bg-zinc-100 dark:bg-white/10'}`}
                                        style={{ height: e.valor > 0 ? `${Math.max(6, (e.valor / maxEvolucion) * 100)}%` : '4px' }}
                                    ></span>
                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">{e.etiqueta}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-heart-pulse text-rose-500"></i> Salud de datos
                            </h3>
                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Solo lectura</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Detecta inconsistencias sin modificar nada. Toca un duplicado para revisarlo.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
                            {saludDatos.map(s => (
                                <div key={s.id} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 px-3 py-3 text-center">
                                    <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{s.count}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5 leading-tight">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        {saludDatos[0].detalle.length > 0 && (
                            <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
                                {saludDatos[0].detalle.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => { clearAllFilters(); setSearchTerm(b.rotulo || ''); setSearchInput(b.rotulo || ''); setCurrentPage(1); setActiveTab('inventario'); }}
                                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                                        title="Revisar en inventario"
                                    >
                                        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">{b.rotulo}</span>
                                        <span className="text-zinc-400 truncate">{b.descripcion}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {saludDatos[1].detalle.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar rounded-2xl border border-violet-500/20 divide-y divide-zinc-100 dark:divide-white/5">
                                {saludDatos[1].detalle.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => { setSearchFuncionarioInput(f.nombre || ''); setCurrentPaginaFuncionarios(1); setActiveTab('funcionarios'); }}
                                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                                        title="Revisar en el padrón"
                                    >
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate">{f.nombre}</span>
                                        <span className="text-zinc-400 tabular-nums truncate">CI {f.cedula} · {f.cargo}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                          <i className="fa-solid fa-clipboard-check text-emerald-500"></i> Conciliación física
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Escanea o escribe rótulos y compara contra el inventario activo del alcance elegido.</p>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <select
                            value={conteoUbicacion} onChange={(e) => setConteoUbicacion(e.target.value)}
                            title="Alcance de la conciliación"
                            className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 px-3 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary max-w-[220px] truncate"
                          >
                            <option value="">Toda la dependencia ({bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) && b.estadoConservacion !== 'De Baja').length})</option>
                            {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="relative mb-4">
                          <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
                          <input
                            type="text"
                            value={conteoInput}
                            onChange={(e) => setConteoInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCodigoConteo(conteoInput); } }}
                            placeholder="Rótulo o código QR + Enter..."
                            className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-11 pl-11 pr-10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all"
                          />
                          {conteoInput && (
                            <button onClick={() => agregarCodigoConteo(conteoInput)} title="Agregar" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer">
                              <i className="fa-solid fa-plus text-[11px]"></i>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                          <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
                            <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{resultadoConteo.hallados}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hallados</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
                            <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{resultadoConteo.faltantes.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Faltantes</p>
                          </div>
                          <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 py-3">
                            <p className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{resultadoConteo.noRegistrados.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">No registrados</p>
                          </div>
                        </div>
                        {resultadoConteo.faltantes.length > 0 && (
                          <div className="mb-3 max-h-36 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
                            {resultadoConteo.faltantes.slice(0, 50).map(b => (
                              <div key={b.id} className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs">
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">{b.rotulo}</span>
                                <span className="text-zinc-400 truncate">{b.descripcion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => { setScanParaConteo(true); setIsScannerOpen(true); }} title="Escanear etiquetas con la cámara" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                            <i className="fa-solid fa-camera"></i> Escanear con cámara
                          </button>
                          <button onClick={() => { setConteoCodigos([]); setConteoInput(''); }} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">Limpiar</button>
                          <button onClick={exportarConteoCSV} disabled={conteoCodigos.length === 0} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">Exportar CSV</button>
                          <button onClick={descargarActaConteoPDF} disabled={conteoCodigos.length === 0} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">
                            <i className="fa-solid fa-file-pdf mr-1.5 text-rose-500"></i>Acta PDF
                          </button>
                          <button onClick={guardarActaConteo} disabled={conteoCodigos.length === 0} className="h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40">Guardar acta</button>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                          <i className="fa-solid fa-shuffle text-violet-500"></i> Muestreo aleatorio
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Selección al azar para verificación física y acta del resultado.</p>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <input
                            type="number" min="1" max="200"
                            value={muestraN}
                            onChange={(e) => setMuestraN(e.target.value)}
                            title="Cantidad a muestrear"
                            className="w-20 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 px-3 text-sm font-bold tabular-nums text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10"
                          />
                          <select
                            value={muestraUbicacion} onChange={(e) => setMuestraUbicacion(e.target.value)}
                            title="Alcance del muestreo"
                            className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 px-3 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary max-w-[220px] truncate"
                          >
                            <option value="">Toda la dependencia</option>
                            {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button onClick={generarMuestra} className="h-10 px-4 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                            Generar muestra
                          </button>
                          {muestra.length > 0 && (
                            <span className="text-xs font-bold tabular-nums text-zinc-500">{Object.values(verificadosMuestra).filter(Boolean).length}/{muestra.length} verificados</span>
                          )}
                        </div>
                        {muestra.length > 0 && (
                          <>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${muestra.length ? (Object.values(verificadosMuestra).filter(Boolean).length / muestra.length) * 100 : 0}%` }}></div>
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-2xl border border-zinc-200/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5 mb-4">
                              {muestra.map(b => (
                                <label key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(verificadosMuestra[b.id])}
                                    onChange={() => setVerificadosMuestra(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                                    className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{b.rotulo}</span>
                                    <span className="block text-[11px] text-zinc-400 truncate">{b.descripcion} · {b.ubicacion || 'Sin ubicación'}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                            <button onClick={guardarActaMuestreo} className="h-10 px-5 rounded-xl text-[13px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                              Guardar acta de muestreo
                            </button>
                            <button onClick={descargarActaMuestreoPDF} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                              <i className="fa-solid fa-file-pdf mr-1.5 text-rose-500"></i>Acta PDF
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-zinc-100 dark:border-white/10">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mr-auto">
                          <i className="fa-solid fa-book-open text-zinc-400"></i> Libro de auditoría
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">{totalAud} eventos</span>
                        </h3>
                        <div className="flex rounded-xl bg-zinc-100 dark:bg-white/5 p-1 gap-1" role="tablist" aria-label="Alcance del libro">
                          {[
                            { id: 'dep', label: dependenciaActual },
                            { id: 'todas', label: 'Todas' }
                          ].map(o => (
                            <button
                              key={o.id}
                              onClick={() => setAlcanceAud(o.id)}
                              className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate max-w-[160px] ${alcanceAud === o.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                              title={o.id === 'dep' ? 'Solo eventos de esta dependencia' : 'Eventos de todas las dependencias'}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                          <input
                            type="text" value={searchAud} onChange={(e) => setSearchAud(e.target.value)} placeholder="Buscar en el libro..."
                            className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 pl-10 pr-3 text-[13px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 w-full sm:w-56"
                          />
                        </div>
                        <select
                          value={filtroAccionAud} onChange={(e) => setFiltroAccionAud(e.target.value)}
                          className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-10 px-3 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
                        >
                          <option value="">Acción: Todas</option>
                          {accionesUnicasAud.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[720px]">
                          <thead className="bg-zinc-50/70 dark:bg-white/[0.02] border-b border-zinc-200/70 dark:border-white/10">
                            <tr className="text-[10px] sm:text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.14em]">
                              <th className="py-3.5 pl-6 pr-4">Fecha</th>
                              <th className="px-4 py-3.5">Usuario</th>
                              <th className="px-4 py-3.5">Acción</th>
                              <th className="px-4 py-3.5">Evento</th>
                              <th className="py-3.5 pl-4 pr-6">Detalle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                            {isLoadingAud ? (
                              <tr><td colSpan="5" className="p-10 text-center text-xs font-semibold text-zinc-400">Cargando libro...</td></tr>
                            ) : auditoriaList.length === 0 ? (
                              <tr><td colSpan="5" className="p-10 text-center text-xs font-semibold text-zinc-400">Sin eventos para los filtros aplicados.</td></tr>
                            ) : (
                              auditoriaList.map(r => (
                                <tr key={r.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.03] transition-colors">
                                  <td className="py-3 pl-6 pr-4 align-top text-xs tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                    {r.fecha ? new Date(r.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                  </td>
                                  <td className="px-4 py-3 align-top text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{actorAud(r)}</td>
                                  <td className="px-4 py-3 align-top">
                                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tonoAccionAud(r.accion)}`}>
                                      {r.accion || 'OTROS'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 align-top text-xs font-bold text-zinc-800 dark:text-zinc-200">{r.titulo || '-'}</td>
                                  <td className="py-3 pl-4 pr-6 align-top text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] truncate" title={detalleAudCorto(r)}>{detalleAudCorto(r)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-white/10">
                        <span className="text-xs text-zinc-500 font-medium">
                          Página <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{totalAud === 0 ? 0 : paginaAud}</span> de <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{Math.max(1, Math.ceil(totalAud / 50))}</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={paginaAud <= 1 || isLoadingAud}
                            onClick={() => fetchAuditoria(paginaAud - 1)}
                            className="rounded-xl bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            Anterior
                          </button>
                          <button
                            disabled={paginaAud >= Math.ceil(totalAud / 50) || isLoadingAud}
                            onClick={() => fetchAuditoria(paginaAud + 1)}
                            className="rounded-xl bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'usuarios' && isAdmin && (<UsuariosView usuariosList={usuariosList} setUsuarioEditing={setUsuarioEditing} setIsUsuarioModalOpen={setIsUsuarioModalOpen} esDesarrollador={esDesarrollador} currentUser={currentUser} setItemToDelete={setItemToDelete} STYLES={STYLES} />)}
                {activeTab === 'funcionarios' && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-12">
                    
                    {/* CABECERA DE SECCIÓN */}
                    <div className="bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Identificación de la sección */}
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                            <i className="fa-solid fa-address-book text-lg"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Plantel de Funcionarios</h2>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                                {funcionariosPurosDependencia.length}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Directorio oficial de personal asignado a <strong className="text-zinc-900 dark:text-white font-semibold">{dependenciaActual}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Botones de Acción Principal */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={sincronizarBienesConPadron}
                            className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                            title="Sincronizar custodios con inventario"
                          >
                            <i className="fa-solid fa-rotate"></i>
                            <span>Sincronizar</span>
                          </button>

                          <button
                            onClick={handleDownloadTemplateFuncionarios}
                            className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                            title="Descargar plantilla de funcionarios"
                          >
                            <i className="fa-solid fa-file-excel text-emerald-600 dark:text-emerald-400"></i>
                            <span>Plantilla</span>
                          </button>

                          <button
                            onClick={() => fileInputFuncionariosRef.current?.click()}
                            className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                            title="Importar lista de funcionarios desde CSV"
                          >
                            <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i>
                            <span>Importar CSV</span>
                          </button>

                          {isAdmin && (
                          <button
                            onClick={() => setIsUbicacionesModalOpen(true)}
                            className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                            title="Gestionar catálogo de ubicaciones"
                          >
                            <i className="fa-solid fa-location-dot text-sky-600 dark:text-sky-400"></i>
                            <span>Ubicaciones</span>
                          </button>
                          )}

                          <span className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1"></span>

                          <button
                            onClick={() => setIsNewFuncionarioModalOpen(true)}
                            title="Registrar nuevo funcionario"
                            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                          >
                            <i className="fa-solid fa-user-plus text-xs"></i>
                            <span>Nuevo Funcionario</span>
                          </button>
                        </div>

                      </div>

                      {/* Barra de búsqueda del padrón */}
                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/10">
  <div className="relative w-full">
    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
    <input
      type="text"
      placeholder="Buscar funcionario por nombre, apellido o número de cédula..."
      value={searchFuncionarioInput}
      onChange={(e) => {
        setSearchFuncionarioInput(e.target.value);
        setCurrentPaginaFuncionarios(1); // Resetea la paginación para mostrar resultados desde la página 1
      }}
      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 h-11 pl-11 pr-4 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none transition-all"
    />
  </div>
</div>

                    </div>

                    {/* TABLA DE FUNCIONARIOS */}
                    <div className="flex-1 bg-white dark:bg-white/[0.04] shadow-sm border border-zinc-200/70 dark:border-white/10 rounded-3xl flex flex-col overflow-hidden relative min-h-[450px]">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="min-w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-10 border-b border-zinc-200/70 dark:border-white/10">
                              <tr className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.14em]">
                                <th className="py-4 pl-8 pr-4">Cédula de Identidad</th>
                                <th className="px-4 py-4 w-1/3">Nombre Completo</th>
                                <th className="px-4 py-4 w-1/3">Cargo Institucional</th>
                                <th className="relative py-4 pl-4 pr-8 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-zinc-800/60">
                              {funcionariosPaginados.map((f, idx) => {
                                if (f.esSeparador) {
                                    return (
                                        <tr key={`sep-${f.letra}-${idx}`}>
                                            <td colSpan="4" className="py-2.5 pl-8 pr-4 bg-zinc-50/70 dark:bg-white/[0.02] border-y border-zinc-100 dark:border-white/5">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold">
                                                    {f.letra}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }

                                const inicial = f.nombre ? f.nombre.charAt(0).toUpperCase() : 'F';

                                return (
                                  <tr key={f.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group">
                                      <td className="py-4 pl-8 pr-4 align-middle tabular-nums font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                                          {formatCI(f.cedula)}
                                      </td>
                                      <td className="px-4 py-4 align-middle">
                                          <div className="flex items-center gap-3">
                                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                                                  {inicial}
                                              </div>
                                              <span className="font-bold text-zinc-900 dark:text-white text-sm">{f.nombre}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 py-4 align-middle">
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                                              {f.cargo || 'Funcionario'}
                                          </span>
                                      </td>
                                      <td className="relative py-4 pl-4 pr-8 align-middle text-right">
                                          <div className="flex items-center justify-end gap-1">
                                              <button
                                                  onClick={() => handleEditFuncionario(f)}
                                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                                  title="Editar funcionario"
                                              >
                                                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                                              </button>
                                              <button
                                                  onClick={() => handleDeleteFuncionario(f.id)}
                                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                                                  title={isAdmin ? 'Eliminar funcionario' : 'Solicitar eliminación al administrador'}
                                              >
                                                  <i className={`fa-solid ${isAdmin ? 'fa-trash-can' : 'fa-paper-plane'} text-xs`}></i>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                                );
                              })}
                              {funcionariosPurosDependencia.length === 0 && (
                                <tr>
                                  <td colSpan="4" className="p-16 text-center">
                                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3 shadow-inner">
                                          <i className="fa-solid fa-users-slash text-2xl"></i>
                                      </div>
                                      <span className="text-sm font-bold text-zinc-400">No hay funcionarios registrados en esta dependencia.</span>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {renderPaginationFuncionarios()}
                    </div>
                  </div>
                )}

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




