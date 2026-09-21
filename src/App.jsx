import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import StatCard from './components/StatCard';
import FaqItem from './components/FaqItem';
import WorkflowStep from './components/WorkflowStep';
import DonutChart from './components/DonutChart';
import SimpleBar from './components/SimpleBar';
import { SelectFilter, PeriodSelector } from './components/FilterComponents';
import BienRow from './components/BienRow';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BienModal from './components/BienModal';
import FC04Modal from './components/FC04Modal';
import FC10Modal from './components/FC10Modal';
import FC11Modal from './components/FC11Modal';
import localforage from 'localforage';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';
import CSVPreviewModal from './components/CSVPreviewModal';
import { 
    formatCurrency, formatCI, generateId, parseDateInfo, 
    formatDateText, getEstadoAbbr, normalizeStr, decodeText, getPlaceholderLogo 
} from './utils/helpers';
import { generateSimpleQR, generateProfessionalLabelPNG, buildFC10PDFDoc } from './utils/pdfGenerators';
import { fetchAllRows } from './services/patrimonioService';
import LogoutModal from './components/modals/LogoutModal';
import ResolucionBajaModal from './components/modals/ResolucionBajaModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import DependenciaConfirmModal from './components/modals/DependenciaConfirmModal';
import QRModal from './components/modals/QRModal';
import ConsolidadoFC10Modal from './components/modals/ConsolidadoFC10Modal';
import UsuarioModal from './components/modals/UsuarioModal';
import NuevoFuncionarioModal from './components/modals/NuevoFuncionarioModal';
import FuncionarioModal from './components/modals/FuncionarioModal';
import ScannerModal from './components/modals/ScannerModal';

const STYLES = {
    input: "block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 sm:text-sm font-medium dark:border-darkbg-border dark:bg-darkbg-main dark:text-white transition-all outline-none",
    label: "block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2",
    btnPrimary: "inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-hover focus:outline-none transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50",
    btnSecondary: "inline-flex items-center justify-center gap-2.5 rounded-xl bg-white dark:bg-darkbg-main border-2 border-zinc-200 dark:border-darkbg-border px-5 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand-primary/50 hover:bg-zinc-50 dark:hover:bg-darkbg-hover focus:outline-none transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50",
    card: "bg-white dark:bg-darkbg-card rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-sm hover:shadow-md overflow-hidden transition-all duration-300",
    modalOverlay: "fixed inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[300] transition-opacity animate-fade-in",
    modalContent: "bg-white dark:bg-darkbg-card rounded-[24px] shadow-2xl w-full max-h-[90vh] flex flex-col border border-zinc-100 dark:border-darkbg-border overflow-hidden relative animate-slide-up",
    modalHeader: "flex justify-between items-center px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10",
    modalBody: "p-8 overflow-y-auto space-y-8 bg-zinc-50/30 dark:bg-darkbg-card custom-scrollbar",
    modalFooter: "flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-main shrink-0 z-10",
    sectionTitle: "text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-3 border-b border-zinc-100 dark:border-darkbg-border pb-4"
};

const DEPENDENCIAS_UNP = ["Rectorado", "Facultad de Ciencias Aplicadas", "Facultad de Humanidades y Ciencias de la Educación", "Facultad de Ciencias Contables, Administrativas y Económicas", "Facultad de Derecho, Ciencias Políticas y Sociales", "Facultad de Ciencias Agropecuarias y Desarrollo Rural", "Facultad de Ciencias Biomédicas", "Facultad de Ciencias, Tecnologías y Artes"];
const ESTADOS_CONSERVACION = ["Muy bueno", "Bueno", "Regular", "Malo", "Inutilizable", "De Baja"];
const MOTIVOS_FC11 = ["Traspaso", "Préstamo", "Inservible", "Faltante"];
const ORIGENES_FC04 = [{ id: "A", nombre: "Alta" }, { id: "B", nombre: "Baja" }, { id: "T", nombre: "Traspaso" }, { id: "C/D", nombre: "Compra o Donación" }];

function SkeletonLoader() { 
    return (
        <div className="w-full flex-1 bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm overflow-hidden flex flex-col min-h-[550px] animate-pulse">
            {/* Cabecera del esqueleto */}
            <div className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 border-b border-zinc-200/80 dark:border-darkbg-border px-8 py-4 flex justify-between hidden md:flex">
                <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
            
            {/* Filas del esqueleto (Híbrido: Tarjetas móvil / Filas desktop) */}
            <div className="p-4 md:p-0 divide-y divide-transparent md:divide-zinc-100 md:dark:divide-darkbg-border/60">
                {[1, 2, 3, 4, 5].map(i => ( 
                    <div key={i} className="mb-4 md:mb-0 p-4 md:px-6 md:py-4 border border-zinc-200/80 md:border-0 rounded-2xl md:rounded-none flex flex-col md:flex-row md:items-center gap-4"> 
                        {/* Columna 1 */}
                        <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 shrink-0 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded w-2/3"></div>
                            </div>
                        </div>
                        {/* Columna 2 */}
                        <div className="flex-1 space-y-2 mt-2 md:mt-0 pt-2 border-t border-dashed md:border-none md:pt-0 border-zinc-100 dark:border-darkbg-border">
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                            <div className="h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3"></div>
                        </div>
                        {/* Columna 3 (Acciones) */}
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t md:border-none md:pt-0 border-zinc-100 dark:border-darkbg-border shrink-0">
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                        </div>
                    </div> 
                ))} 
            </div>
        </div>
    );
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => { 
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type }]); 
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500); 
  };
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState(() => { const saved = localStorage.getItem('current_user'); return saved ? JSON.parse(saved) : null; });
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('logoOficial'));
  
  const isAdmin = useMemo(() => currentUser?.role === 'admin' || currentUser?.cargo === 'admin', [currentUser]);
  
  const [loginUser, setLoginUser] = useState(''); 
  const [loginPass, setLoginPass] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => { const saved = localStorage.getItem('theme'); if (saved !== null) return saved === 'dark'; return true; });
  const [pdfPaperSize, setPdfPaperSize] = useState(() => localStorage.getItem('pdf_size') || 'a4');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(false);
  const [systemConfig, setSystemConfig] = useState({ version: 'v1.0.0', notes: '' });
  const [showChangelog, setShowChangelog] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState({ active: false, text: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // NUEVOS ESTADOS: Confirmación de cambio de dependencia
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
  // AÑADE ESTA LÍNEA JUNTO AL RESTO DE TUS ESTADOS:
  const [todasDependencias] = useState(DEPENDENCIAS_UNP);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBulkQR, setIsBulkQR] = useState(false);
  const [qrTargetBien, setQrTargetBien] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
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

  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioEditing, setUsuarioEditing] = useState(null);

  const [isCSVPreviewOpen, setIsCSVPreviewOpen] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState({ validos: [], duplicados: [], errores: [] });
  const [pendingFuncionariosToImport, setPendingFuncionariosToImport] = useState([]);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [resolucionBaja, setResolucionBaja] = useState(null);
  const [motivoResolucion, setMotivoResolucion] = useState('');

  const [dbError, setDbError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        addToast("Conexión a la red restablecida.", "success"); 
    };
    
    const handleOffline = () => { 
        setIsOnline(false); 
        addToast("Sin conexión. Operando en modo local.", "warning"); 
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificación activa cada 10 segundos para detectar caídas reales al instante
    const intervalCheck = setInterval(async () => {
        try {
            // Hacemos una consulta ultraligera a Supabase para comprobar conectividad real
            const { error } = await supabase.from('bens').select('id').limit(1);
            if (error) throw error;
            
            if (!isOnline) {
                setIsOnline(true);
                addToast("Conexión a la red restablecida.", "success");
            }
        } catch (err) {
            if (isOnline) {
                setIsOnline(false);
                addToast("Sin conexión. Operando en modo local.", "warning");
            }
        }
    }, 10000);

    return () => { 
        window.removeEventListener('online', handleOnline); 
        window.removeEventListener('offline', handleOffline);
        clearInterval(intervalCheck);
    };
  }, [isOnline]);

  const fileInputRef = useRef(null);
  const fileInputFuncionariosRef = useRef(null);

  // DECLARACIÓN DE ESTADOS DE LISTAS Y BÚSQUEDA (COLOCADOS ANTES DE SER USADOS)
  const [fc10List, setFc10List] = useState([]); 
  const [fc11List, setFc11List] = useState([]); 
  const [fc04List, setFc04List] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]); 
  const [funcionariosPadron, setFuncionariosPadron] = useState([]); 
  const [estructurasDB, setEstructurasDB] = useState([]);


  const [searchFuncionarioInput, setSearchFuncionarioInput] = useState('');
  const [searchInput, setSearchInput] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filtroFuncionario, setFiltroFuncionario] = useState(''); 
  const [filtroUbicacion, setFiltroUbicacion] = useState(''); 
  const [filtroAnio, setFiltroAnio] = useState(''); 
  const [filtroMes, setFiltroMes] = useState(''); 
  const [filtroSubcuenta, setFiltroSubcuenta] = useState(''); 
  const [filtroAnalitico1, setFiltroAnalitico1] = useState(''); 
  const [filtroAnalitico2, setFiltroAnalitico2] = useState('');
  const [filtroQR, setFiltroQR] = useState('ALL'); 
  const [filtroFC10, setFiltroFC10] = useState('ALL'); 
  const [filtroEstado, setFiltroEstado] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [fc10Year, setFc10Year] = useState(new Date().getFullYear().toString()); 
  const [fc10Month, setFc10Month] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchConsolidadoModal, setSearchConsolidadoModal] = useState('');
  // AHORA SÍ PODEMOS DECLARAR ESTAS CONSTANTES SIN ERRORES:
  const hasFilters = Boolean(
    searchInput || filtroFuncionario || filtroUbicacion || filtroAnio || 
    filtroMes || filtroSubcuenta || filtroAnalitico1 || filtroAnalitico2 || 
    filtroQR !== 'ALL' || filtroFC10 !== 'ALL' || filtroEstado !== 'ALL'
  );

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
  
  // 1. Filtramos solo los registros que son funcionarios (excluyendo los separadores de la paginación)
  const funcionariosPurosDependencia = useMemo(() => {
      let lista = funcionariosPadron.filter(f => f.dependencia === dependenciaActual);
      
      if (searchFuncionarioInput.trim() !== '') {
          const termino = searchFuncionarioInput.toLowerCase().trim();
          lista = lista.filter(f => 
              String(f.cedula || '').toLowerCase().includes(termino) || 
              String(f.nombre || '').toLowerCase().includes(termino) ||
              String(f.cargo || '').toLowerCase().includes(termino)
          );
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

 const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);

      // Creamos un timeout de seguridad de 8 segundos por si Supabase no responde
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de red')), 8000)
      );

      const fetchPromise = (async () => {
        let todosLosNuevosBienes = [];
        let rangeSize = 1000;
        let from = 0;
        let to = rangeSize - 1;
        let keepFetchingBienes = true;

        while (keepFetchingBienes) {
          let query = supabase.from('bens').select('id, data, updated_at');
          const { data: batch, error } = await query.range(from, to);

          if (error || !batch || batch.length === 0) {
            keepFetchingBienes = false;
          } else {
            todosLosNuevosBienes = [...todosLosNuevosBienes, ...batch];
            if (batch.length < rangeSize) {
              keepFetchingBienes = false;
            } else {
              from += rangeSize;
              to += rangeSize;
            }
          }
        }

        if (todosLosNuevosBienes.length > 0) {
          const mapaBienes = new Map();
          todosLosNuevosBienes.forEach(item => {
              const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              mapaBienes.set(item.id, { id: item.id, updated_at: item.updated_at, ...parsedData });
          });
          const inventarioFinal = Array.from(mapaBienes.values());
          await localforage.setItem('bienes_cache', inventarioFinal);
          setBienes(inventarioFinal);
        }

        const [resFc10, resFc11, resFc04, resEstructuras, resAuditoria, resUsuarios, resFuncionarios] = await Promise.all([ 
            fetchAllRows('fc10'), fetchAllRows('fc11'), fetchAllRows('fc04'), 
            fetchAllRows('estructuras'), fetchAllRows('auditoria'), fetchAllRows('usuarios'), fetchAllRows('funcionarios')
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
        setNotificaciones(parseDirect(resAuditoria.data));
        setUsuariosList(parseDirect(resUsuarios.data));
        setFuncionariosPadron(parseDirect(resFuncionarios.data));
        setDbError(false);
      })();

      await Promise.race([fetchPromise, timeoutPromise]);

    } catch (error) { 
        console.error("Error crítico de datos:", error);
        if (!isSilent) setDbError(true);
        
        try {
            const cachedBienes = await localforage.getItem('bienes_cache');
            if (cachedBienes && cachedBienes.length > 0) {
                setBienes(cachedBienes);
            }
        } catch (e) {}
    } finally { 
        // Aseguramos que el estado de carga se apague sí o sí
        setIsLoading(false); 
    }
  }, []);

  const clearAllFilters = () => { 
      setFiltroFuncionario(''); setFiltroUbicacion(''); setFiltroAnio(''); 
      setFiltroMes(''); setFiltroSubcuenta(''); setFiltroAnalitico1(''); 
      setFiltroAnalitico2(''); setFiltroQR('ALL'); setFiltroFC10('ALL'); 
      setFiltroEstado('ALL'); setSearchInput(''); setSearchTerm(''); setCurrentPage(1); 
  };
  // --- MOTOR DE ARRANQUE DE DATOS ---
  useEffect(() => { 
      if (isAuthenticated) {
          fetchData(false); 
          cargarNotificaciones();
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);
  // -----------------------------------
  const handleLogin = async (e) => { 
    e.preventDefault(); 
    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', loginUser.trim())
            .maybeSingle();

        if (error || !usuario || usuario.password !== loginPass.trim()) {
            setLoginError(true);
            addToast("Credenciales incorrectas. Verifique su usuario y contraseña.", "error");
            return;
        }

        const userSession = {
            ...usuario,
            role: usuario.cargo === 'admin' ? 'admin' : 'user',
            dependencia: usuario.dependencia || 'Rectorado' // <--- Asegura capturar la dependencia
        };

        localStorage.setItem('is_logged_in', 'true'); 
        localStorage.setItem('current_user', JSON.stringify(userSession)); 
        
        setLoginError(false); 
        setCurrentUser(userSession); 
        setIsAuthenticated(true); 
        setDependenciaActual(userSession.dependencia); // <--- Establece el entorno del usuario
        
        addToast(`Bienvenido, ${usuario.nombre} (${userSession.dependencia})`, "success"); 
    } catch (error) {
        setLoginError(true);
        addToast("Error al conectar con la base de datos", "error");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };
  const handleLogoUpload = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
     new FileReader(); 
    const reader = new FileReader(); 
reader.onload = (event) => { 
    const img = new Image(); 
    img.onload = () => { 
        const canvas = document.createElement('canvas'); 
        const maxSize = 300; 
        let width = img.width; 
        let height = img.height; 
        if (width > height) { 
            if (width > maxSize) { height *= maxSize / width; width = maxSize; } 
        } else { 
            if (height > maxSize) { width *= maxSize / height; height = maxSize; } 
        } 
        canvas.width = width; 
        canvas.height = height; 
        const ctx = canvas.getContext('2d'); 
        
        ctx.clearRect(0, 0, width, height); 
        ctx.drawImage(img, 0, 0, width, height); 
        
        const compressedLogo = canvas.toDataURL('image/png'); 
        localStorage.setItem('logoOficial', compressedLogo); 
        setAppLogo(compressedLogo); 
        addToast("Logo oficial actualizado sin fondo opaco", "success"); 
    }; 
    img.src = event.target.result; 
};
    reader.readAsDataURL(file); 
    e.target.value = null; 
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

  const funcionariosUnicos = useMemo(() => { 
      const funcMap = new Map(); 
      bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && String(b.funcionario).trim() !== "").forEach(b => { 
          const val = String(b.funcionario).trim(); 
          const key = normalizeStr(val); 
          if(!funcMap.has(key)) funcMap.set(key, val); 
      }); 
      return Array.from(funcMap.values()).sort(); 
  }, [bienes, dependenciaActual]);

  const ubicacionesUnicas = useMemo(() => { 
      const ubiMap = new Map(); 
      bienes.filter(b => b.dependencia === dependenciaActual && b.ubicacion && String(b.ubicacion).trim() !== "").forEach(b => { 
          const val = String(b.ubicacion).trim(); 
          const key = normalizeStr(val); 
          if(!ubiMap.has(key)) ubiMap.set(key, val); 
      }); 
      fc10List.filter(fc => fc.dependencia === dependenciaActual && fc.entregadoLugar).forEach(fc => { 
          const val = String(fc.entregadoLugar).trim(); 
          const key = normalizeStr(val); 
          if(!ubiMap.has(key)) ubiMap.set(key, val); 
      }); 
      return Array.from(ubiMap.values()).sort(); 
  }, [bienes, fc10List, dependenciaActual]);

  const aniosUnicos = useMemo(() => { const years = bienes.filter(b => b.dependencia === dependenciaActual && b.fechaAdquisicion).map(b => parseDateInfo(b.fechaAdquisicion).year).filter(y => y && !isNaN(parseInt(y))); return [...new Set(years)].sort((a, b) => b - a); }, [bienes, dependenciaActual]);
  
  const subcuentasUnicas = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.subcuenta||'').trim() !== '').map(b => String(b.subcuenta).trim()))].sort(), [bienes, dependenciaActual]);
  const analiticos1Unicos = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.analitico1||'').trim() !== '').map(b => String(b.analitico1).trim()))].sort(), [bienes, dependenciaActual]);
  const analiticos2Unicos = useMemo(() => [...new Set(bienes.filter(b => b.dependencia === dependenciaActual && String(b.analitico2||'').trim() !== '').map(b => String(b.analitico2).trim()))].sort(), [bienes, dependenciaActual]);

  const stats = useMemo(() => { 
      const depBienes = bienes.filter(b => b.dependencia === dependenciaActual && b.estadoConservacion !== 'De Baja'); 
      const totalItems = depBienes.length; 
      const totalValue = depBienes.reduce((acc, curr) => {
          const valStr = String(curr.valorUnitario || '0').replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
          const valorNum = parseInt(valStr, 10) || 0;
          return acc + valorNum;
      }, 0); 
      const withFc10 = depBienes.filter(b => b.hasFC10).length; 
      const withQR = depBienes.filter(b => b.hasQR).length; 
      const estados = { bueno: depBienes.filter(b => b.estadoConservacion === 'Bueno' || b.estadoConservacion === 'Muy bueno').length, regular: depBienes.filter(b => b.estadoConservacion === 'Regular').length, malo: depBienes.filter(b => b.estadoConservacion === 'Malo' || b.estadoConservacion === 'Inutilizable').length }; 
      const percFC10 = totalItems === 0 ? 0 : (withFc10 / totalItems) * 100; 
      const percQR = totalItems === 0 ? 0 : (withQR / totalItems) * 100; 
      const cuentasCounts = {}; 
      depBienes.forEach(b => { if (b.cuenta) cuentasCounts[b.cuenta] = (cuentasCounts[b.cuenta] || 0) + 1; }); 
      const topCuentas = Object.entries(cuentasCounts).sort((a, b) => b[1] - a[1]).slice(0, 3); 
      return { totalItems, totalValue, withFc10, withoutFc10: totalItems - withFc10, withQR, withoutQR: totalItems - withQR, percFC10, percQR, estados, topCuentas }; 
  }, [bienes, dependenciaActual]);

  const timeStats = useMemo(() => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const depBienes = bienes.filter(b => b.dependencia === dependenciaActual); const adqCounts = {}; let adqMax = 0; depBienes.forEach(b => { const { year } = parseDateInfo(b.fechaAdquisicion); if (year) { const parsedYear = parseInt(year); if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) { adqCounts[year] = (adqCounts[year] || 0) + 1; } } }); const adqByYear = Object.keys(adqCounts).sort((a, b) => b - a).map(year => { if(adqCounts[year] > adqMax) adqMax = adqCounts[year]; return { year, count: adqCounts[year] }; }).slice(0, 4); let asigCurrentMonth = 0; let asigPreviousMonth = 0; const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1; const yearOfPrevMonth = currentMonth === 0 ? currentYear - 1 : currentYear; const depFC10 = fc10List.filter(fc => fc.dependencia === dependenciaActual); depFC10.forEach(fc => { const fechaAUsar = fc.entregadoFecha || fc.fechaGeneracion; if (fechaAUsar) { const parts = fechaAUsar.split('-'); if (parts.length >= 2) { const year = parseInt(parts[0]); const month = parseInt(parts[1]) - 1; if (year === currentYear && month === currentMonth) { asigCurrentMonth++; } else if (year === yearOfPrevMonth && month === prevMonth) { asigPreviousMonth++; } } } }); const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; return { adqByYear, adqMax: adqMax === 0 ? 1 : adqMax, asigCurrentMonth, asigPreviousMonth, asigMax: Math.max(asigCurrentMonth, asigPreviousMonth) === 0 ? 1 : Math.max(asigCurrentMonth, asigPreviousMonth), currentMonthName: monthNames[currentMonth], prevMonthName: monthNames[prevMonth] }; }, [bienes, fc10List, dependenciaActual]);
  
 const filteredBienes = useMemo(() => { 
    // Compara ignorando mayúsculas y espacios extra
    let filtered = bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual));
    if (filtroFuncionario) filtered = filtered.filter(b => String(b.funcionario||'').trim() === filtroFuncionario); 
    if (filtroUbicacion) filtered = filtered.filter(b => String(b.ubicacion||'').trim() === filtroUbicacion); 
    if (filtroAnio) filtered = filtered.filter(b => parseDateInfo(b.fechaAdquisicion).year === filtroAnio); 
    if (filtroMes) filtered = filtered.filter(b => parseDateInfo(b.fechaAdquisicion).month === filtroMes);
    if (filtroSubcuenta) filtered = filtered.filter(b => String(b.subcuenta||'').trim() === filtroSubcuenta);
    if (filtroAnalitico1) filtered = filtered.filter(b => String(b.analitico1||'').trim() === filtroAnalitico1);
    if (filtroAnalitico2) filtered = filtered.filter(b => String(b.analitico2||'').trim() === filtroAnalitico2);
    if (filtroEstado !== 'ALL') filtered = filtered.filter(b => b.estadoConservacion === filtroEstado); 
    if (filtroQR === 'YES') filtered = filtered.filter(b => b.hasQR === true); 
    if (filtroQR === 'NO') filtered = filtered.filter(b => b.hasQR !== true); 
    if (filtroFC10 === 'YES') filtered = filtered.filter(b => b.hasFC10 === true); 
    if (filtroFC10 === 'NO') filtered = filtered.filter(b => b.hasFC10 !== true); 
    
    // CORRECCIÓN: Unificar búsqueda con searchInput y searchTerm
    const activeSearch = searchTerm || searchInput;
    if (activeSearch) { 
        const term = String(activeSearch).toLowerCase().trim(); 
        filtered = filtered.filter(b => 
            String(b.rotulo || '').toLowerCase().includes(term) || 
            String(b.descripcion || '').toLowerCase().includes(term) || 
            String(b.cuenta || '').toLowerCase().includes(term) || 
            String(b.ubicacion || '').toLowerCase().includes(term) || 
            String(b.funcionario || '').toLowerCase().includes(term) ||
            String(b.funcionarioDoc || '').toLowerCase().includes(term)
        ); 
    } 

    filtered.sort((a, b) => { 
        const getSuffixNum = (rot) => { const str = String(rot || '').trim(); const match = str.match(/\d+$/); return match ? parseInt(match[0], 10) : 0; }; 
        const numA = getSuffixNum(a.rotulo); 
        const numB = getSuffixNum(b.rotulo); 
        if (numA !== numB) return numA - numB; 
        return String(a.rotulo || '').localeCompare(String(b.rotulo || '')); 
    }); 
    
    return filtered; 
  }, [bienes, dependenciaActual, filtroFuncionario, filtroUbicacion, filtroAnio, filtroMes, filtroSubcuenta, filtroAnalitico1, filtroAnalitico2, filtroEstado, filtroQR, filtroFC10, searchTerm, searchInput]);
  
  const paginatedBienes = useMemo(() => { const start = (currentPage - 1) * itemsPerPage; return filteredBienes.slice(start, start + itemsPerPage); }, [filteredBienes, currentPage]);
  const totalPages = Math.ceil(filteredBienes.length / itemsPerPage);
  const [isConsolidatedFC10ModalOpen, setIsConsolidatedFC10ModalOpen] = useState(false);
  const filteredFC10 = useMemo(() => { return fc10List.filter(fc => { if (fc.dependencia !== dependenciaActual) return false; const genDate = fc.entregadoFecha || fc.fechaGeneracion || ''; const devDate = fc.devolucionFecha || ''; const [gYear, gMonth] = genDate.split('-'); const matchGen = (gYear === fc10Year && gMonth === fc10Month); let matchDev = false; if (devDate) { const [dYear, dMonth] = devDate.split('-'); matchDev = (dYear === fc10Year && dMonth === fc10Month); } return matchGen || matchDev; }).sort((a, b) => new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()); }, [fc10List, dependenciaActual, fc10Year, fc10Month]);
  const filteredFC11 = useMemo(() => { return fc11List.filter(fc => { const rem = fc.dependenciaRemitente || fc.remitente || ''; const dest = fc.dependenciaDestinataria || fc.destinatario || ''; if (rem !== dependenciaActual && dest !== dependenciaActual) return false; const [year, month] = String(fc.fecha || '').split('-'); return year === fc10Year && month === fc10Month; }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); }, [fc11List, dependenciaActual, fc10Year, fc10Month]);
  const filteredFC04 = useMemo(() => { return fc04List.filter(fc => { return fc.dependencia === dependenciaActual && fc.anio === fc10Year && fc.mes === fc10Month; }).sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()); }, [fc04List, dependenciaActual, fc10Year, fc10Month]);
  const solicitudesBaja = useMemo(() => { 
      return notificaciones.filter(
          n => n.tipo === 'BAJA_BIEN' && n.estado === 'PENDIENTE' && n.dependencia === dependenciaActual
      );
  }, [notificaciones, dependenciaActual]);

  const handleDownloadLabelPNG = async (bien) => { setIsProcessing({ active: true, text: 'Generando Etiqueta...' }); setTimeout(async () => { try { const dataUrl = await generateProfessionalLabelPNG(bien, appLogo); if (dataUrl && window.saveAs) { const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, ''); window.saveAs(dataUrl, `Etiqueta_UNP_${cleanRotulo}.png`); addToast("Etiqueta descargada con éxito", "success"); } } catch (e) { addToast("Error al generar la etiqueta", "error"); } finally { setIsProcessing({ active: false, text: '' }); setIsQRModalOpen(false); } }, 100); };
  const handleDownloadSimpleQR = async (bien) => { setIsProcessing({ active: true, text: 'Procesando imagen QR...' }); try { const dataUrl = await generateSimpleQR(bien); if(dataUrl && window.saveAs) { const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, ''); window.saveAs(dataUrl, `QR_${cleanRotulo}.png`); addToast("Código QR simple descargado", "success"); } } catch (e) { addToast("Error al descargar el QR", "error"); } finally { setIsProcessing({ active: false, text: '' }); setIsQRModalOpen(false); } };
  const handleBulkLabelPNGZip = async () => { if (filteredBienes.length === 0) return addToast("No hay bienes filtrados.", "warning"); setIsProcessing({ active: true, text: 'Generando Lote de Etiquetas...' }); setTimeout(async () => { try { const cleanDepName = dependenciaActual.replace(/\s+/g, '_'); const zip = new window.JSZip(); const folder = zip.folder(`Etiquetas_Completas_${cleanDepName}`); for (let i = 0; i < filteredBienes.length; i++) { const bien = filteredBienes[i]; const dataUrl = await generateProfessionalLabelPNG(bien, appLogo); if(dataUrl) { const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, ''); folder.file(`Etiqueta_${cleanRotulo}.png`, dataUrl.replace(/^data:image\/png;base64,/, ""), {base64: true}); } } const content = await zip.generateAsync({type:"blob"}); if(window.saveAs) window.saveAs(content, `Etiquetas_Patrimoniales_${cleanDepName}_${new Date().toISOString().split('T')[0]}.zip`); addToast("Archivo ZIP de etiquetas generado", "success"); } catch (error) { addToast("Hubo un error al generar el archivo ZIP.", "error"); } finally { setIsProcessing({ active: false, text: '' }); setIsQRModalOpen(false); } }, 100); };
  const handleBulkSimpleQRZip = async () => { if (filteredBienes.length === 0) return addToast("No hay bienes filtrados.", "warning"); setIsProcessing({ active: true, text: 'Comprimiendo ZIP de QRs simples...' }); setTimeout(async () => { try { const cleanDepName = dependenciaActual.replace(/\s+/g, '_'); const zip = new window.JSZip(); const folder = zip.folder(`QRs_Simples_${cleanDepName}`); for (let i = 0; i < filteredBienes.length; i++) { const bien = filteredBienes[i]; const dataUrl = await generateSimpleQR(bien); if(dataUrl) { const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, ''); folder.file(`QR_${cleanRotulo}.png`, dataUrl.replace(/^data:image\/png;base64,/, ""), {base64: true}); } } const content = await zip.generateAsync({type:"blob"}); if(window.saveAs) window.saveAs(content, `QRs_Simples_${cleanDepName}_${new Date().toISOString().split('T')[0]}.zip`); addToast("Archivo ZIP generado con éxito", "success"); } catch (error) { addToast("Hubo un error al generar el archivo ZIP.", "error"); } finally { setIsProcessing({ active: false, text: '' }); setIsQRModalOpen(false); } }, 100); };

  const handleGenerateFC04PDF = (fc) => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return addToast("Cargando librerías PDF...", "warning");
    setIsProcessing({ active: true, text: 'Generando PDF FC-04...' });
    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', pdfPaperSize); const pageWidth = doc.internal.pageSize.width; const pageHeight = doc.internal.pageSize.height;
        const logoImg = appLogo || getPlaceholderLogo(); doc.addImage(logoImg, 'PNG', 14, 12, 22, 22); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, 18, { align: 'center' }); doc.setFontSize(11); doc.text("DIRECCIÓN DE CONTABILIDAD", pageWidth / 2, 24, { align: 'center' }); doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, 29, { align: 'center' }); doc.setFontSize(14); doc.text("MOVIMIENTO DE BIENES DE USO (FC-04)", pageWidth / 2, 40, { align: 'center' });
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const mesNombre = monthNames[parseInt(fc.mes) - 1]; doc.setFontSize(10); doc.text(`Dependencia: ${fc.dependencia}`, 14, 50); doc.text(`Periodo: ${mesNombre.toUpperCase()} ${fc.anio}`, pageWidth - 14, 50, { align: 'right' }); const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento); doc.text(`Origen de Movimiento: ${origenObj ? `${origenObj.id} - ${origenObj.nombre}` : fc.origenMovimiento}`, 14, 56);
        let finalY = 62;
        if (fc.sinMovimiento) { doc.setFontSize(16); doc.setTextColor(100, 100, 100); doc.text("NO SE REGISTRA MOVIMIENTO ESTE MES", pageWidth / 2, finalY + 30, { align: 'center' }); finalY += 60; } 
        else { 
            const tableRows = fc.bienesSnapshot.map(b => [b.cuenta || '-', b.subcuenta || '-', b.analitico1 || '-', b.analitico2 || '-', b.rotulo || '-', b.descripcion || '-', formatCurrency(b.valorUnitario), formatDateText(b.fechaAdquisicion) || '-', b.vidaUtil || '-']); 
            doc.autoTable({ startY: finalY, theme: 'grid', head: [["Cuenta", "Subcuenta", "Analítico 1", "Analítico 2", "Rótulo / Código", "Descripción del Bien", "Valor Unitario (Gs.)", "Fecha Adquisición", "Vida Útil"]], body: tableRows, rowPageBreak: 'avoid', margin: { bottom: 30 }, styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, headStyles: { fillColor: [248, 249, 250], fontStyle: 'bold', halign: 'center', textColor: [32,33,36] }, alternateRowStyles: { fillColor: [250, 252, 253] }, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 6: { halign: 'right', fontStyle: 'bold' }, 7: { halign: 'center' }, 8: { halign: 'center' } } }); finalY = doc.lastAutoTable.finalY + 10; 
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
    setTimeout(() => {
      try {
        const fc = fcs[0]; const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', pdfPaperSize); const pageWidth = doc.internal.pageSize.width; const pageHeight = doc.internal.pageSize.height;
        const logoImg = appLogo || getPlaceholderLogo(); const dateParts = (fc.fecha || '').split('-'); let formattedDate = ''; if(dateParts.length === 3) { const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]; formattedDate = `Pilar, ${dateParts[2]} de ${months[parseInt(dateParts[1])-1]} de ${dateParts[0]}`; }
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
  const handleGenerateConsolidatedFC10PDF = (funcionarioNombreSeleccionado) => {
    const vigentes = bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && b.estadoConservacion !== 'De Baja');
    const bienesDelFuncionario = vigentes.filter(b => normalizeStr(b.funcionario) === normalizeStr(funcionarioNombreSeleccionado));
    
    if (bienesDelFuncionario.length === 0) return addToast("No se encontraron bienes activos para este funcionario.", "warning");

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
    
    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('l', 'mm', pdfPaperSize); 
        const pageWidth = doc.internal.pageSize.width; 
        const pageHeight = doc.internal.pageSize.height;
        const logoImg = appLogo || getPlaceholderLogo(); 

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

        const numeroALetras = (num) => {
            if (num === 0) return 'cero';
            const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
            const decenas = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
            const decenas2 = ['', '', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
            const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
            const getDecenas = (n) => { if (n < 10) return unidades[n]; if (n < 20) return decenas[n - 10]; if (n === 20) return 'veinte'; if (n < 30) return decenas2[2] + (n % 10 === 0 ? '' : unidades[n % 10]); const u = n % 10; return decenas2[Math.floor(n / 10)] + (u > 0 ? ' y ' + unidades[u] : ''); };
            const getCentenas = (n) => { if (n === 100) return 'cien'; const d = n % 100; return centenas[Math.floor(n / 100)] + (d > 0 ? ' ' + getDecenas(d) : ''); };
            const getMiles = (n) => { if (n < 1000) return getCentenas(n); if (n === 1000) return 'mil'; const m = Math.floor(n / 1000); const c = n % 1000; return (m === 1 ? '' : getCentenas(m) + ' ') + 'mil' + (c > 0 ? ' ' + getCentenas(c) : ''); };
            const getMillones = (n) => { if (n < 1000000) return getMiles(n); if (n === 1000000) return 'un millon'; const m = Math.floor(n / 1000000); const rest = n % 1000000; return (m === 1 ? 'un millon' : getMiles(m) + ' millones') + (rest > 0 ? ' ' + getMiles(rest) : ''); };
            const getMilMillones = (n) => { if (n < 1000000000) return getMillones(n); const m = Math.floor(n / 1000000000); const rest = n % 1000000000; return (m === 1 ? 'mil millones' : getMiles(m) + ' mil millones') + (rest > 0 ? ' ' + getMillones(rest) : ''); };
            return getMilMillones(num).trim();
        };

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
                    { content: 'FECHA\nADQUISI.', styles: { halign: 'center' } },
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
          await supabase.from('bens').update({ data: updatedBien }).eq('id', updatedBien.id);
          
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
      const csvContent = "\uFEFFCuenta Mayor;Sub-Cuenta;Analítico 1;Analítico 2;Descripción General;Fecha Adquisición (YYYY-MM-DD);Nº Rótulo;Valor Unitario (Sin puntos);Vida Útil (Años)\n" +
                          "2.6.1.01;01;01;01;\"Computadora HP i5\";2023-01-15;10001;4500000;5\n" +
                          ";;;;\"Escritorio de Madera\";2022-11-10;10002;1200000;10";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, "Plantilla_Carga_Masiva_Bienes.csv");
      addToast("Plantilla Excel (CSV) base descargada", "success");
  };
 
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return; setIsProcessing({ active: true, text: 'Procesando Planilla Excel (CSV)...' });
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target.result;
        const text = decodeText(buffer);
        const lines = text.split(/\r?\n/); if (lines.length < 2) { addToast("El archivo CSV está vacío o mal formateado.", "warning"); setIsProcessing({active:false, text:''}); return; }
        const delimiter = lines[0].includes(';') ? ';' : ','; const newBienes = []; let duplicatesSkipped = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const line = String(lines[i]).trim(); if (!line) continue; const row = []; let inQuotes = false; let val = "";
          for (let char of line) { if (char === '"') inQuotes = !inQuotes; else if (char === delimiter && !inQuotes) { row.push(val); val = ""; } else val += char; } row.push(val);
          
          if (row.length >= 8) {
            const rotuloCSV = String(row[6]||'').replace(/"/g, '').trim(); 
            const isDuplicateDB = bienes.some(b => String(b.rotulo).trim().toLowerCase() === rotuloCSV.toLowerCase() && b.dependencia === dependenciaActual); 
            const isDuplicateCSV = newBienes.some(b => String(b.rotulo).trim().toLowerCase() === rotuloCSV.toLowerCase());
            
            if (isDuplicateDB || isDuplicateCSV) { duplicatesSkipped++; continue; }
            
            newBienes.push({ 
                id: generateId(), 
                dependencia: dependenciaActual, 
                cuenta: String(row[0]||'').replace(/"/g, ''), 
                subcuenta: String(row[1]||'').replace(/"/g, ''), 
                analitico1: String(row[2]||'').replace(/"/g, ''), 
                analitico2: String(row[3]||'').replace(/"/g, ''), 
                descripcion: String(row[4]||'').replace(/"/g, ''), 
                fechaAdquisicion: String(row[5]||'').replace(/"/g, ''), 
                rotulo: rotuloCSV, 
                valorUnitario: String(row[7]||'').replace(/"/g, ''), 
                vidaUtil: String(row[8]||'').replace(/"/g, ''), 
                funcionario: '', 
                ubicacion: '', 
                hasFC10: false, 
                hasQR: false, 
                estadoConservacion: 'Muy bueno' 
            });
          }
        }
        if (newBienes.length > 0) { 
            try { 
                const payloadNewBienes = newBienes.map(b => ({ id: b.id, data: b }));
                await supabase.from('bens').insert(payloadNewBienes);
                await fetchData(); 
                setActiveTab('inventario'); 
                addToast(`¡Éxito! Se guardaron ${newBienes.length} bienes nuevos.${duplicatesSkipped > 0 ? ` Se omitieron ${duplicatesSkipped} duplicados.` : ''}`, "success"); 
            } catch (error) { addToast("Error al subir a la BD.", "error"); } 
        } else { addToast(`No se importó ningún bien. Se omitieron ${duplicatesSkipped} duplicados.`, "warning"); }
        setIsProcessing({ active: false, text: '' });
      }; reader.readAsArrayBuffer(file); e.target.value = null;
    }, 100);
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
  const sincronizarBienesConPadron = async () => {
    let actualizados = 0;
    const nuevosBienes = bienes.map(b => {
        if (b.funcionario && String(b.funcionario).trim() !== "") {
            const match = funcionariosPadron.find(f => 
                normalizeStr(f.nombre) === normalizeStr(b.funcionario) && 
                (f.dependencia === b.dependencia || !f.dependencia)
            );
            if (match) {
                actualizados++;
                return { ...b, funcionarioDoc: match.cedula, funcionarioCargo: match.cargo };
            }
        }
        return b;
    });

    if (actualizados > 0) {
        setBienes(nuevosBienes);
        try {
            for (const b of nuevosBienes) {
                const payload = { id: b.id, data: b };
                await supabase.from('bens').update(payload).eq('id', b.id);
            }
            await localforage.setItem('bienes_cache', nuevosBienes);
            addToast(`Se sincronizaron y guardaron ${actualizados} bienes con el padrón.`, "success");
            await fetchData(true);
        } catch (err) {
            console.error(err);
            addToast("Error al guardar la sincronización en la base de datos.", "error");
        }
    } else {
        addToast("No se encontraron coincidencias de nombres entre los bienes y el padrón.", "warning");
    }
  };
  const handleFileUploadFuncionarios = (e) => {
    const file = e.target.files[0]; if (!file) return; 
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
        
        for (let i = 0; i < lines.length; i++) {
          const line = String(lines[i]).trim(); 
          if (!line) continue;
          
          const separator = line.includes(';') ? ';' : ',';
          const parts = line.split(separator).map(p => p.replace(/"/g, '').trim());
          
          if (i === 0 && (parts[0].toLowerCase().includes('cedula') || parts[0].toLowerCase().includes('c.i.'))) {
              continue;
          }
          
          if (parts.length < 2) {
              errores.push({ linea: i + 1, motivo: 'Estructura insuficiente (faltan columnas)' });
              continue;
          }

          const cedulaCSV = parts[0].replace(/\./g, '');
          const nombreCSV = parts[1]; // Aquí ya se leerá correctamente "Delcy Maximina Amarilla Fernández"
          const cargoCSV = parts[2] || '';

          if (!cedulaCSV || !nombreCSV) {
              errores.push({ linea: i + 1, motivo: 'Cédula o Nombre vacíos' });
              continue;
          }

          const isDuplicateDB = funcionariosPadron.some(f => String(f.cedula).trim() === cedulaCSV && f.dependencia === dependenciaActual);
          const isDuplicateBatch = validos.some(f => String(f.cedula).trim() === cedulaCSV);
          const huérfanoExistente = funcionariosPadron.find(f => f.cedula === 'S/C' && normalizeStr(f.nombre) === normalizeStr(nombreCSV) && f.dependencia === dependenciaActual);

          const nuevoFunc = { 
              id: huérfanoExistente ? huérfanoExistente.id : generateId(), 
              cedula: cedulaCSV, 
              nombre: nombreCSV, 
              cargo: cargoCSV, 
              dependencia: dependenciaActual,
              esActualizacion: !!huérfanoExistente 
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
          dependencia: dependenciaActual
      };

      if (!nuevoFunc.cedula || !nuevoFunc.nombre) return addToast("Cédula y Nombre son obligatorios.", "warning");

      try {
          const { error } = await supabase.from('funcionarios').insert([nuevoFunc]);
          if (error) throw error;
          await fetchData();
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
        
        await fetchData();
        addToast(`¡Éxito! Procesados ${pendingFuncionariosToImport.length} registros (${porActualizar.length} actualizados).`, "success");
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
    setItemToDelete({ type: 'funcionario', id });
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

    try {
        const { error } = await supabase
          .from('funcionarios')
          .update({ nombre: nuevoNombre, cargo: nuevoCargo })
          .eq('id', funcionarioToEdit.id);
        
        if (error) throw error;
        await fetchData();
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
    
    try {
        let res;
        if (usuarioEditing) {
            const updateData = { nombre: userData.nombre, cargo: userData.cargo, dependencia: userData.dependencia };
            if (userData.password) updateData.password = userData.password;
            res = await supabase.from('usuarios').update(updateData).eq('username', usuarioEditing.username);
        } else {
            res = await supabase.from('usuarios').insert([userData]);
        }
        
        if (!res.error) {
            addToast(usuarioEditing ? "Usuario actualizado" : "Usuario creado", "success");
            setIsUsuarioModalOpen(false);
            fetchData();
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

    // Autocompletar desde el padrón si existe coincidencia exacta por nombre o cédula
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
        hasQR: formData.get('hasQR') === 'on' 
    };
    
    try { 
        let res;
        const payload = { id: bienData.id, data: bienData };
        if (bienEditing) {
            res = await supabase.from('bens').update(payload).eq('id', bienData.id);
        } else {
            res = await supabase.from('bens').insert([payload]);
        }

        if (!res.error) {
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

            const cacheActual = await localforage.getItem('bienes_cache') || [];
            let nuevoCache = [...cacheActual];
            const idxCache = nuevoCache.findIndex(b => b.id === bienData.id);
            if (idxCache !== -1) {
                nuevoCache[idxCache] = bienData;
            } else {
                nuevoCache.push(bienData);
            }
            await localforage.setItem('bienes_cache', nuevoCache);

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

      await supabase.from('bens').update({ data: updatedBien }).eq('id', updatedBien.id);
      
      if (fc11Editing) setFc11List(prev => prev.map(item => item.id === fc11Data.id ? fc11Data : item)); else setFc11List(prev => [fc11Data, ...prev]);
      if (esMovimientoInterno) { setBienes(prev => prev.map(b => b.id === updatedBien.id ? updatedBien : b)); addToast(`Movimiento interno registrado en ${fc11Data.dependenciaDestinataria}.`, "warning"); } else { setBienes(prev => prev.filter(b => b.id !== updatedBien.id)); addToast(`El bien fue transferido a ${fc11Data.dependenciaDestinataria}.`, "success"); } setIsFC11ModalOpen(false);
      fetchData();
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
              const payloadNewBienes = newBienes.map(b => ({ id: b.id, data: b }));
              await supabase.from('bens').insert(payloadNewBienes);
              setBienes(prev => [...newBienes, ...prev]); 
              addToast(`${newBienes.length} bienes inyectados.`, "success"); 
          }
          if (updatedBienes.length > 0) { 
              for (const b of updatedBienes) {
                  await supabase.from('bens').update({ data: b }).eq('id', b.id);
              }
              setBienes(prev => prev.map(old => updatedBienes.find(upd => upd.id === old.id) || old)); 
              addToast(`${updatedBienes.length} bajas registradas.`, "success"); 
          }
      }
      if (fc04Editing) setFc04List(prev => prev.map(item => item.id === fc04Data.id ? fc04Data : item)); else setFc04List(prev => [fc04Data, ...prev]); setIsFC04ModalOpen(false);
      fetchData();
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

        await supabase.from('bens').update({ data: updatedBien }).eq('id', updatedBien.id);

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
        fetchData();
        addToast(isDevuelto ? "Devolución registrada" : "FC-10 Guardado exitosamente", "success"); 
    } catch (error) { console.error(error); addToast("Error al guardar.", "error"); }
  };
  const markAsRead = async (notif) => {
      if(notif.leido) return;
      const updated = {...notif, leido: true};
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
      try { 
          await supabase.from('auditoria').update({ data: updated }).eq('id', notif.id);
      } catch(e) {}
  };

  const openResolucionModal = (bien, accion) => { setResolucionBaja({ bien, accion }); setMotivoResolucion(''); };
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

  const handleRowAction = (action, item, extraData) => { 
      switch(action) { 
          case 'toggleQR': toggleQR(item); break; 
          case 'openQRDownload': setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); break; 
          case 'openFC10': openFC10Modal(item); break; 
          case 'openFC11': openFC11Modal(item); break; 
          case 'editBien': setBienEditing(item); setIsBienModalOpen(true); break; 
          case 'deleteBien': 
              if (isAdmin) {
                  setItemToDelete({ type: 'bien', id: item.id, item }); 
              } else {
                  setItemToDelete({ type: 'requestBaja', id: item.id, item });
              }
              break; 
          case 'requestBaja': 
              setItemToDelete({ type: 'requestBaja', id: item.id, item });
              break;
          case 'printFC10': handleGenerateFC10PDF([extraData], [item]); break; 
          default: break; 
      } 
  };

  const handleScanSuccess = (decodedText) => {
      setIsScannerOpen(false);
      let codigoLimpio = decodedText;
      if (decodedText.includes('CÓDIGO:')) {
          const partes = decodedText.split('CTA:')[0];
          codigoLimpio = partes.replace('CÓDIGO:', '').trim();
      }
      addToast(`Bien escaneado: ${codigoLimpio}`, "success");
      setSearchInput(codigoLimpio);
      setActiveTab('inventario');
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

  const misNotificaciones = useMemo(() => { return notificaciones.filter(n => n.tipoRegistro === 'NOTIFICACION' && n.usuarioDestino === currentUser?.username).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); }, [notificaciones, currentUser]);
  const unreadCount = misNotificaciones.filter(n => !n.leido).length;
  const saludoBienvenida = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "¡Buenos días";
    if (hora < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }, []);

  const renderPagination = () => (
    <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
      <span className="text-sm text-zinc-500 font-medium">Mostrando <span className="font-bold text-zinc-900 dark:text-white">{(currentPage - 1) * itemsPerPage + (filteredBienes.length > 0 ? 1 : 0)} - {Math.min(currentPage * itemsPerPage, filteredBienes.length)}</span> de {filteredBienes.length}</span>
      <div className="flex gap-2">
        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">Anterior</button>
        <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer">Siguiente</button>
      </div>
    </div>
  );
  const renderPaginationFuncionarios = () => (
    <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
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
      const { bien, accion } = resolucionBaja;
      setIsProcessing({ active: true, text: 'Procesando resolución...' });

      try {
          const notifPendiente = notificaciones.find(
              n => n.tipo === 'BAJA_BIEN' && (n.bienId === bien.id || n.bien_id === bien.id) && n.estado === 'PENDIENTE'
          );

          if (notifPendiente) {
              const notifActualizada = { ...notifPendiente, estado: accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO' };
              await supabase.from('notificaciones').update({ data: notifActualizada }).eq('id', notifPendiente.id);
          }

          if (accion === 'aprobar') {
              const bienReal = bienes.find(b => b.id === bien.id);
              if (bienReal) {
                  const updatedBien = { ...bienReal, estadoConservacion: 'De Baja' };
                  await supabase.from('bens').update({ data: updatedBien }).eq('id', bien.id);
                  setBienes(prev => prev.map(b => b.id === bien.id ? updatedBien : b));
                  
                  const cacheActual = await localforage.getItem('bienes_cache') || [];
                  await localforage.setItem('bienes_cache', cacheActual.map(b => b.id === bien.id ? updatedBien : b));
              }
          }
          
          addToast(accion === 'aprobar' ? "Baja aprobada exitosamente." : "Solicitud rechazada.", "success");
          await fetchData(true);
      } catch (e) { 
          addToast("Error al procesar la resolución.", "error"); 
      } finally {
          setIsProcessing({ active: false, text: '' });
          setResolucionBaja(null);
      }
  };

  // --- INICIO DE CÓDIGO RESTAURADO ---
  const cargarNotificaciones = async () => {
      const { data, error } = await supabase.from('notificaciones').select('*');
      if (!error && data) {
          const parsed = data.map(item => {
              const d = item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item;
              return { id: item.id, ...d };
          });
          setNotificaciones(parsed);
      }
  };

  const solicitarBajaBien = async (bien) => {
      const solicitudId = generateId();
      const nuevaSolicitud = { id: solicitudId, bienId: bien.id, rotulo: bien.rotulo, descripcion: bien.descripcion, ubicacion: bien.ubicacion, funcionario: bien.funcionario, solicitante: currentUser?.username || 'Usuario', dependencia: bien.dependencia, tipo: 'BAJA_BIEN', estado: 'PENDIENTE', created_at: new Date().toISOString() };
      const { error } = await supabase.from('notificaciones').insert([{ id: solicitudId, data: nuevaSolicitud }]);
      if (!error) { addToast("Solicitud enviada.", "success"); cargarNotificaciones(); }
  };

  const confirmDeleteAction = async () => {
      if (!itemToDelete) return; 
      const { type, id, username, item } = itemToDelete;
      try { 
          let res = { error: null };
          if (type === 'requestBaja') {
              const solicitudId = generateId();
              const nuevaSolicitud = { id: solicitudId, bienId: item.id || id, rotulo: item.rotulo, descripcion: item.descripcion, ubicacion: item.ubicacion, funcionario: item.funcionario, solicitante: currentUser?.username || 'Usuario', dependencia: item.dependencia, tipo: 'BAJA_BIEN', estado: 'PENDIENTE', created_at: new Date().toISOString() };
              res = await supabase.from('notificaciones').insert([{ id: solicitudId, data: nuevaSolicitud }]);
              if (!res.error) { addToast("Solicitud enviada.", "success"); cargarNotificaciones(); }
          } else {
              if (type === 'bien') {
                  if (item.estadoConservacion === 'De Baja') { res = await supabase.from('bens').delete().eq('id', id); } 
                  else { res = await supabase.from('bens').update({ data: { ...item, estadoConservacion: 'De Baja' } }).eq('id', id); }
              }
              else if (type === 'fc10') res = await supabase.from('fc10').delete().eq('id', id);
              else if (type === 'fc11') res = await supabase.from('fc11').delete().eq('id', id);
              else if (type === 'fc04') res = await supabase.from('fc04').delete().eq('id', id);
              else if (type === 'usuario') res = await supabase.from('usuarios').delete().eq('username', username);
              else if (type === 'funcionario') res = await supabase.from('funcionarios').delete().eq('id', id);

              if (!res.error) addToast("Acción completada", "success");
          }
          fetchData(false);
      } catch (e) { addToast("Error de red.", "error"); } 
      finally { setItemToDelete(null); }
  };

  useEffect(() => {
      if (isAuthenticated) {
          fetchData(false);
          cargarNotificaciones();
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);
  // --- FIN DE CÓDIGO RESTAURADO ---

  if (isCheckingMaintenance) {
      return (
          <div className="min-h-screen bg-zinc-50 dark:bg-darkbg-main flex items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-brand-primary"></i>
          </div>
      );
  }

  if (isMaintenanceMode) {
      return (
          <div className="min-h-screen bg-zinc-50 dark:bg-darkbg-main flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-24 h-24 bg-brand-light dark:bg-brand-primary/20 text-brand-primary rounded-3xl flex items-center justify-center mb-8 animate-pulse shadow-sm">
                  <i className="fa-solid fa-screwdriver-wrench text-5xl"></i>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">Sistema en Mantenimiento</h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto font-medium leading-relaxed">
                  {systemConfig.notes || "Estamos aplicando actualizaciones y mejoras en la plataforma para garantizar su seguridad y rendimiento. Por favor, intente acceder nuevamente en unos minutos."}
              </p>
          </div>
      );
  }

  if (!isAuthenticated) {
      return (
          <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} appLogo={appLogo} toasts={toasts} />
      );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen overflow-hidden bg-zinc-50 dark:bg-darkbg-main transition-colors duration-300 text-base`}>
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" className="hidden" ref={fileInputFuncionariosRef} onChange={handleFileUploadFuncionarios} />
      
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        
        {!isOnline && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] rounded-2xl shadow-xl text-xs font-black bg-amber-500/90 text-white backdrop-blur-md border border-amber-400/30 transition-all animate-slide-up">
            <i className="fa-solid fa-wifi-slash text-base"></i>
            <span className="flex-1">Sin conexión a red (Modo Local)</span>
          </div>
        )}

        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3.5 px-5 py-4 min-w-[320px] max-w-md rounded-[20px] shadow-2xl text-xs font-bold bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 transition-all animate-slide-up">
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
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} appLogo={appLogo} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} solicitudesBaja={solicitudesBaja} />
      
      <div className="flex flex-1 flex-col min-w-0 bg-zinc-50 dark:bg-darkbg-main relative">
          {dbError && (
            <div className="flex items-center justify-center gap-x-6 bg-red-50 px-6 py-2.5 sm:px-3.5 border-b border-red-200 dark:bg-red-900/30 dark:border-red-900/50 shadow-sm z-50">
              <p className="text-sm leading-6 text-red-700 dark:text-red-400 font-medium">
                <i className="fa-solid fa-wifi mr-2"></i> Error de sincronización con Supabase. Verifique su conexión.
              </p>
            </div>
          )}

          <Header setIsSidebarOpen={setIsSidebarOpen} activeTab={activeTab} setIsScannerOpen={setIsScannerOpen} pdfPaperSize={pdfPaperSize} setPdfPaperSize={setPdfPaperSize} dependenciaActual={dependenciaActual} setDependenciaActual={requestDependenciaChange} todasDependencias={todasDependencias} clearAllFilters={clearAllFilters} darkMode={darkMode} setDarkMode={setDarkMode} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} unreadCount={unreadCount} misNotificaciones={misNotificaciones} markAsRead={markAsRead} currentUser={currentUser} isAdmin={isAdmin} handleLogout={() => setShowLogoutConfirm(true)} />

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 min-h-full flex flex-col">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in pb-8">
                    
                    {/* ENCABEZADO MEJORADO (Sin borde duro, con degradado sutil) */}
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-zinc-50 to-white dark:from-darkbg-main dark:to-darkbg-card px-8 py-6 rounded-[24px] shadow-sm shrink-0 overflow-hidden group gap-4 border border-zinc-100/50 dark:border-darkbg-border/30">
                      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-gradient-to-br from-brand-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                      
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover text-white font-black text-2xl shadow-lg shadow-brand-primary/20 ring-4 ring-brand-primary/10">
                          {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{saludoBienvenida}, {currentUser?.nombre || 'Usuario'}!</h3>
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                              <i className="fa-solid fa-building-columns text-brand-primary/70"></i>
                              Dependencia activa: <span className="text-brand-primary dark:text-brand-accent">{dependenciaActual}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-start sm:justify-end gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white/80 dark:bg-darkbg-main/80 px-4 py-2.5 rounded-xl shadow-sm relative z-10 backdrop-blur-sm border border-zinc-100 dark:border-darkbg-border">
                        {isOnline ? (
                          <>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span> 
                            Sistema sincronizado
                          </>
                        ) : (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span> 
                            Operando en local
                          </>
                        )}
                      </div>
                    </div>

                    {/* MÉTRICAS PRINCIPALES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard title="Bienes Activos" value={isLoading ? '...' : stats.totalItems} subtitle="Registrados en inventario" icon="fa-boxes-stacked" colorClass="text-brand-primary" bgIconClass="bg-brand-light/80 dark:bg-brand-primary/20" />
                      <StatCard title="Bienes con QR" value={isLoading ? '...' : `${stats.withQR} / ${stats.totalItems}`} subtitle="Etiquetados y verificados" icon="fa-qrcode" colorClass="text-purple-600 dark:text-purple-400" bgIconClass="bg-purple-100/80 dark:bg-purple-900/30" />
                      <StatCard title="Sin FC-10" value={isLoading ? '...' : stats.withoutFc10} subtitle="Bienes sin asignación" icon="fa-file-signature" colorClass="text-amber-600 dark:text-amber-400" bgIconClass="bg-amber-100/80 dark:bg-amber-900/30" />
                      <StatCard title="Pendiente QR" value={isLoading ? '...' : stats.withoutQR} subtitle="Sin etiqueta declarada" icon="fa-triangle-exclamation" colorClass="text-rose-600 dark:text-rose-400" bgIconClass="bg-rose-100/80 dark:bg-rose-900/30" />
                    </div>

                    {/* ACCESOS DIRECTOS REDISEÑADOS (Mayor contraste) */}
                    <div className="bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm p-6 sm:p-8 relative overflow-hidden group transition-all">
                        <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
                            
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-darkbg-main text-amber-500 border border-zinc-200/60 dark:border-darkbg-border/60 shadow-inner">
                                    <i className="fa-solid fa-bolt text-xl drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Acciones Rápidas</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Atajos operativos para tu gestión diaria</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto">
                                <button onClick={() => { setActiveTab('fc04'); openFC04Modal(null); }} className="flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-darkbg-main border-2 border-zinc-100 dark:border-darkbg-border px-5 py-3.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand-primary hover:bg-brand-light/30 hover:text-brand-primary dark:hover:border-brand-primary/50 dark:hover:text-brand-accent shadow-sm hover:shadow-md transition-all active:scale-95 group/btn">
                                    <i className="fa-solid fa-calendar-plus text-brand-primary group-hover/btn:scale-110 transition-transform"></i> Ingreso FC-04
                                </button>
                                <button onClick={() => { setActiveTab('inventario'); setIsBulkQR(true); setIsQRModalOpen(true); }} className="flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-darkbg-main border-2 border-zinc-100 dark:border-darkbg-border px-5 py-3.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600 dark:hover:border-purple-500/50 dark:hover:bg-purple-900/10 dark:hover:text-purple-400 shadow-sm hover:shadow-md transition-all active:scale-95 group/btn">
                                    <i className="fa-solid fa-file-zipper text-purple-500 group-hover/btn:scale-110 transition-transform"></i> Paquete QRs
                                </button>
                                <button onClick={() => { setActiveTab('inventario'); fileInputRef.current?.click(); }} className="flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-darkbg-main border-2 border-zinc-100 dark:border-darkbg-border px-5 py-3.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-400 shadow-sm hover:shadow-md transition-all active:scale-95 group/btn">
                                    <i className="fa-solid fa-file-import text-emerald-500 group-hover/btn:scale-110 transition-transform"></i> Importar CSV
                                </button>
                                <div className="relative flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-darkbg-main border-2 border-zinc-100 dark:border-darkbg-border px-5 py-3.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600 dark:hover:border-sky-500/50 dark:hover:bg-sky-900/10 dark:hover:text-sky-400 shadow-sm hover:shadow-md transition-all active:scale-95 overflow-hidden group/btn">
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Actualizar Escudo Institucional" />
                                    <i className="fa-solid fa-image text-sky-500 group-hover/btn:scale-110 transition-transform"></i> Subir Logo
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN INFERIOR DE GRÁFICOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* ESTADO DE REGULARIZACIÓN */}
                      <div className="bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-80"></div>
                        <div className="border-b border-zinc-100 dark:border-darkbg-border px-8 py-5 flex items-center justify-between bg-zinc-50/50 dark:bg-darkbg-main/30">
                          <h2 className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                             <i className="fa-solid fa-chart-pie text-emerald-500"></i> Estado de Regularización
                          </h2>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:block bg-zinc-100 dark:bg-darkbg-main px-2 py-1 rounded-md">Metas de cobertura</span>
                        </div>
                        
                        <div className="flex flex-1 flex-col p-8 gap-8 justify-center">
                          {/* Progreso FC-10 */}
                          <div className="group/bar">
                            <div className="flex justify-between items-end mb-3">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shadow-inner group-hover/bar:scale-110 transition-transform duration-300">
                                  <i className="fa-solid fa-file-contract text-base drop-shadow-sm"></i>
                                </div>
                                <div>
                                  <p className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Cobertura FC-10</p>
                                  <p className="text-[11px] text-zinc-500 font-bold mt-0.5">{stats.withFc10} de {stats.totalItems} activos</p>
                                </div>
                              </div>
                              <span className="text-2xl font-black text-emerald-500 tracking-tighter drop-shadow-sm">{stats.percFC10.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner p-0.5">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 relative shadow-sm" style={{ width: `${stats.percFC10}%` }}>
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                          </div>

                          {/* Progreso QR */}
                          <div className="group/bar">
                            <div className="flex justify-between items-end mb-3">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary flex items-center justify-center shadow-inner group-hover/bar:scale-110 transition-transform duration-300">
                                  <i className="fa-solid fa-qrcode text-base drop-shadow-sm"></i>
                                </div>
                                <div>
                                  <p className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Etiquetado QR</p>
                                  <p className="text-[11px] text-zinc-500 font-bold mt-0.5">{stats.withQR} de {stats.totalItems} activos</p>
                                </div>
                              </div>
                              <span className="text-2xl font-black text-brand-primary tracking-tighter drop-shadow-sm">{stats.percQR.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner p-0.5">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 relative shadow-sm" style={{ width: `${stats.percQR}%` }}>
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* TENDENCIAS OPERATIVAS */}
                      <div className="bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-primary to-purple-600 opacity-80"></div>
                        <div className="border-b border-zinc-100 dark:border-darkbg-border px-8 py-5 bg-zinc-50/50 dark:bg-darkbg-main/30">
                          <h2 className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                             <i className="fa-solid fa-chart-line text-brand-primary"></i> Tendencias Operativas
                          </h2>
                        </div>
                        <div className="flex flex-1 flex-col sm:flex-row p-8 gap-10">
                          
                          <div className="flex-1 flex flex-col border-b border-zinc-100 dark:border-darkbg-border pb-8 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-8">
                            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">Adquisiciones Anuales</h3>
                            <div className="flex-1 flex flex-col justify-center gap-5">
                              {timeStats.adqByYear.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center text-center py-4 opacity-50">
                                      <i className="fa-solid fa-box-open text-3xl text-zinc-400 mb-2"></i>
                                      <p className="text-xs font-bold text-zinc-400">Sin adquisiciones.</p>
                                  </div>
                              ) : timeStats.adqByYear.map((item, idx) => {
                                  const colors = ["bg-brand-primary shadow-brand-primary/40", "bg-purple-500 shadow-purple-500/40", "bg-zinc-400 shadow-zinc-400/40", "bg-zinc-300 shadow-none"];
                                  return <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={`${colors[idx] || "bg-zinc-400"} shadow-sm`} bgClass="bg-zinc-100 dark:bg-darkbg-main" />;
                              })}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col">
                            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">Asignaciones (FC-10)</h3>
                            <div className="flex-1 flex flex-col justify-center gap-7">
                              <SimpleBar label={`Actual (${timeStats.currentMonthName})`} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500 shadow-sm shadow-emerald-500/40" bgClass="bg-zinc-100 dark:bg-darkbg-main" />
                              <SimpleBar label={`Anterior (${timeStats.prevMonthName})`} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-zinc-400 dark:bg-zinc-600 shadow-sm" bgClass="bg-zinc-100 dark:bg-darkbg-main" />
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                )}
                {activeTab === 'inventario' && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-8">
                    
                    {/* CABECERA Y HERRAMIENTAS */}
                    <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm shrink-0 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-gradient-to-bl from-brand-primary/20 to-sky-500/20 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-darkbg-border/60 relative z-10">
                        <div className="flex items-center gap-5">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover text-white shadow-lg shadow-brand-primary/20 ring-4 ring-brand-primary/10">
                            <i className="fa-solid fa-boxes-stacked text-2xl"></i>
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Directorio Patrimonial
                            </h2>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Gestión integral e inventario consolidado de activos institucionales</p>
                          </div>
                        </div>

                        <button onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} className={STYLES.btnPrimary + " !rounded-2xl !px-7 !py-3.5 shadow-md shrink-0"}>
                            <i className="fa-solid fa-plus text-sm"></i> Añadir Registro
                        </button>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-6 relative z-10">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-50 dark:bg-darkbg-main p-2 rounded-2xl border border-zinc-200/60 dark:border-darkbg-border">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3">Datos</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button disabled={isProcessing.active} onClick={handleDownloadTemplateCSV} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 shadow-sm transition-all cursor-pointer">
                                <i className="fa-solid fa-file-excel text-emerald-500"></i> Plantilla
                            </button>
                            <button disabled={isProcessing.active} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand-primary hover:text-brand-primary shadow-sm transition-all cursor-pointer">
                                <i className="fa-solid fa-file-import text-brand-primary"></i> Importar CSV
                            </button>
                            <button disabled={isProcessing.active} onClick={handleExportInventarioCSV} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-sky-500 hover:text-sky-600 shadow-sm transition-all cursor-pointer">
                                <i className="fa-solid fa-download text-sky-500"></i> Exportar CSV
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-50 dark:bg-darkbg-main p-2 rounded-2xl border border-zinc-200/60 dark:border-darkbg-border">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3">Salidas</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button disabled={isProcessing.active} onClick={() => { setIsBulkQR(true); setIsQRModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-purple-500 hover:text-purple-600 shadow-sm transition-all cursor-pointer">
                                <i className="fa-solid fa-file-zipper text-purple-500"></i> Lote QRs
                            </button>
                            <button onClick={openFC03Modal} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-card border border-zinc-200 dark:border-darkbg-border px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-600 shadow-sm transition-all cursor-pointer">
                                <i className="fa-solid fa-print text-amber-500"></i> Reporte FC-03
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* BUSCADOR Y FILTROS */}
                    <div className="bg-white dark:bg-darkbg-card rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm p-6 space-y-5 shrink-0 z-20">
                      <div className="flex flex-col xl:flex-row gap-5 items-center justify-between">
                        
                        <div className="w-full xl:w-[400px] shrink-0 relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-sky-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                          <div className="relative">
                              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary text-sm"></i>
                              <input 
                                type="text" 
                                placeholder="Buscar por rótulo, cuenta, responsable..." 
                                className="block w-full rounded-2xl border border-zinc-200/80 bg-zinc-50/80 py-3.5 pl-12 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 sm:text-sm font-bold dark:border-darkbg-border dark:bg-darkbg-main dark:text-white transition-all outline-none shadow-inner" 
                                value={searchInput} 
                                onChange={(e) => setSearchInput(e.target.value)} 
                              />
                              {searchInput && (
                                <button onClick={() => setSearchInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer">
                                  <i className="fa-solid fa-circle-xmark text-sm"></i>
                                </button>
                              )}
                          </div>
                        </div>

                        <div className="w-full flex flex-wrap items-center gap-2.5 justify-start xl:justify-end">
                          <SelectFilter icon="fa-user-tie" value={filtroFuncionario} onChange={e => {setFiltroFuncionario(e.target.value); setCurrentPage(1);}} options={funcionariosUnicos} defaultText="Responsable" />
                          <SelectFilter icon="fa-door-open" value={filtroUbicacion} onChange={e => {setFiltroUbicacion(e.target.value); setCurrentPage(1);}} options={ubicacionesUnicas} defaultText="Ubicación" />
                          <SelectFilter icon="fa-calendar-days" value={filtroAnio} onChange={e => {setFiltroAnio(e.target.value); setCurrentPage(1);}} options={aniosUnicos} defaultText="Año" />
                          <SelectFilter icon="fa-layer-group" value={filtroSubcuenta} onChange={e => {setFiltroSubcuenta(e.target.value); setCurrentPage(1);}} options={subcuentasUnicas} defaultText="Subcuenta" />
                          <SelectFilter icon="fa-layer-group" value={filtroAnalitico1} onChange={e => {setFiltroAnalitico1(e.target.value); setCurrentPage(1);}} options={analiticos1Unicos} defaultText="Analítico 1" />
                          <SelectFilter icon="fa-layer-group" value={filtroAnalitico2} onChange={e => {setFiltroAnalitico2(e.target.value); setCurrentPage(1);}} options={analiticos2Unicos} defaultText="Analítico 2" />
                          <SelectFilter icon="fa-file-signature" value={filtroFC10} onChange={e => {setFiltroFC10(e.target.value); setCurrentPage(1);}} options={[{label:'Asignado', value:'YES'}, {label:'Sin Asignar', value:'NO'}]} defaultText="FC-10" />
                          
                          <button onClick={() => { setFiltroEstado(filtroEstado === 'De Baja' ? 'ALL' : 'De Baja'); setCurrentPage(1); }} className={`inline-flex items-center gap-x-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap border cursor-pointer shrink-0 ${filtroEstado === 'De Baja' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-darkbg-main dark:text-zinc-400 dark:border-darkbg-border dark:hover:bg-darkbg-hover dark:hover:text-white shadow-sm hover:shadow-md'}`}>
                            <i className={`fa-solid fa-ban ${filtroEstado === 'De Baja' ? 'text-white' : 'text-rose-500'}`}></i> Bajas
                          </button>
                        </div>
                      </div>
                      
                      {hasFilters && (
                          <div className="pt-4 border-t border-zinc-100 dark:border-darkbg-border flex flex-wrap items-center gap-2 animate-fade-in">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                                <i className="fa-solid fa-filter"></i> Filtros activos:
                            </span>
                            {searchInput && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setSearchInput('')}>Búsqueda: {searchInput} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroFuncionario && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroFuncionario('')}>{filtroFuncionario} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroUbicacion && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroUbicacion('')}>{filtroUbicacion} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroAnio && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroAnio('')}>Año: {filtroAnio} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroSubcuenta && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroSubcuenta('')}>Subcta: {filtroSubcuenta} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroAnalitico1 && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroAnalitico1('')}>An.1: {filtroAnalitico1} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroAnalitico2 && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroAnalitico2('')}>An.2: {filtroAnalitico2} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            {filtroEstado === 'De Baja' && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white cursor-pointer hover:bg-rose-700 transition-colors shadow-sm" onClick={() => setFiltroEstado('ALL')}>Solo Bajas <i className="fa-solid fa-xmark"></i></span>}
                            {filtroFC10 !== 'ALL' && <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200 dark:border-darkbg-border cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setFiltroFC10('ALL')}>FC-10: {filtroFC10 === 'YES' ? 'Sí' : 'No'} <i className="fa-solid fa-xmark text-zinc-400 hover:text-red-500"></i></span>}
                            <button onClick={clearAllFilters} className="text-xs font-bold text-brand-primary hover:text-brand-dark ml-auto px-4 py-2 rounded-xl hover:bg-brand-light dark:hover:bg-brand-primary/10 transition-colors cursor-pointer border border-transparent hover:border-brand-primary/20">Limpiar Todos</button>
                          </div>
                      )}
                    </div>

                    {/* TABLA PRINCIPAL */}
                    <div className="flex-1 bg-white dark:bg-darkbg-card shadow-sm border border-zinc-200/80 dark:border-darkbg-border rounded-[24px] flex flex-col overflow-hidden relative min-h-[550px]">
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                          <table className="min-w-full text-left">
                            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 backdrop-blur-md z-10 border-b border-zinc-200/80 dark:border-darkbg-border">
                              <tr className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                <th className="py-4 pl-8 pr-4">Identificación y Descripción</th>
                                <th className="px-4 py-4">Localización y Custodio</th>
                                <th className="px-4 py-4">Condición Física</th>
                                <th className="relative py-4 pl-4 pr-8 text-right"><span className="sr-only">Acciones</span></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                              {paginatedBienes.map(b => (
                                <BienRow key={b.id} b={b} fcRecord={fc10Map.get(b.id)} onAction={handleRowAction} isAdmin={isAdmin} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      {renderPagination()} {/* <--- ESTA ES LA LÍNEA CORREGIDA */}
                    </div>
                  </div>
                )}
                {activeTab === 'aprobaciones' && isAdmin && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-2xs">
                          <i className="fa-solid fa-check-to-slot text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Centro de Aprobaciones</h2>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Revisión de solicitudes de exclusión de patrimonio enviadas por funcionarios</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-darkbg-card shadow-2xs border border-zinc-200/80 dark:border-darkbg-border rounded-2xl flex flex-col overflow-hidden relative">
                        {solicitudesBaja.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[380px]">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 mb-5 text-emerald-500 ring-1 ring-emerald-500/20 shadow-2xs">
                                    <i className="fa-solid fa-check-double text-3xl"></i>
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Todo al día</h3>
                                <p className="mt-1.5 text-xs font-semibold text-zinc-400 max-w-sm">No existen solicitudes de baja pendientes de revisión para esta dependencia.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto custom-scrollbar">
                              <table className="min-w-full text-left">
                                <thead className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 backdrop-blur-md z-10 border-b border-zinc-200/80 dark:border-darkbg-border">
                                  <tr className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                    <th className="py-3.5 pl-6 pr-4 w-1/3">Bien Solicitado</th>
                                    <th className="px-4 py-3.5 w-1/3">Custodio Actual</th>
                                    <th className="relative py-3.5 pl-4 pr-6 text-right">Acción de Revisión</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                                  {solicitudesBaja.map(b => (
                                    <tr key={b.id} className="hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover/60 transition-colors group">
                                        <td className="py-4 pl-6 pr-4 align-middle">
                                            <div className="font-extrabold text-zinc-900 dark:text-white text-sm font-mono">{b.rotulo}</div>
                                            <div className="text-xs font-medium text-zinc-500 mt-1 line-clamp-1">{b.descripcion}</div>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{b.funcionario || 'No asignado'}</div>
                                            <div className="text-[11px] text-zinc-400 mt-0.5">{b.ubicacion || 'Sin ubicación'}</div>
                                        </td>
                                        <td className="relative py-4 pl-4 pr-6 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openResolucionModal(b, 'rechazar')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 dark:bg-darkbg-main dark:text-zinc-300 dark:border-darkbg-border shadow-2xs hover:shadow-xs transition-all cursor-pointer">
                                                    <i className="fa-solid fa-xmark text-red-500"></i> Rechazar
                                                </button>
                                                <button onClick={() => openResolucionModal(b, 'aprobar')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-xs hover:shadow-md cursor-pointer">
                                                    <i className="fa-solid fa-check"></i> Aprobar Baja
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === 'usuarios' && isAdmin && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent shadow-2xs">
                          <i className="fa-solid fa-users-gear text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Directorio de Usuarios</h2>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Gestión de cuentas y roles de acceso al sistema</p>
                        </div>
                      </div>
                      
                      <button onClick={() => { setUsuarioEditing(null); setIsUsuarioModalOpen(true); }} className={STYLES.btnPrimary}>
                        <i className="fa-solid fa-user-plus"></i> Nuevo Usuario
                      </button>
                    </div>

                    <div className="flex-1 bg-white dark:bg-darkbg-card shadow-2xs border border-zinc-200/80 dark:border-darkbg-border rounded-2xl flex flex-col overflow-hidden relative">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="min-w-full text-left">
                            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 backdrop-blur-md z-10 border-b border-zinc-200/80 dark:border-darkbg-border">
                              <tr className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                <th className="py-3.5 pl-6 pr-4 w-1/3">Usuario y Nombre</th>
                                <th className="px-4 py-3.5 w-1/3">Rol de Sistema</th>
                                <th className="relative py-3.5 pl-4 pr-6 text-right"><span className="sr-only">Acciones</span></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                              {usuariosList.map(u => (
                                <tr key={u.username} className="hover:bg-zinc-50 dark:hover:bg-darkbg-hover/50 transition-colors border-b border-zinc-50 dark:border-darkbg-border/30">
                                    <td className="py-3 pl-6 pr-4 align-middle">
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-brand-primary dark:text-brand-accent font-bold text-sm border border-zinc-200/60 dark:border-darkbg-border/60 shadow-sm">
                                              {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                                          </div>
                                          <div>
                                              <div className="font-semibold text-zinc-900 dark:text-white text-sm">{u.nombre}</div>
                                              <div className="text-xs text-zinc-500 mt-0.5">@{u.username}</div>
                                          </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        {u.cargo === 'admin' 
                                            ? <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm"><i className="fa-solid fa-shield-halved text-[10px]"></i> Administrador</span>
                                            : <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 shadow-sm"><i className="fa-solid fa-user text-[10px]"></i> Funcionario</span>
                                        }
                                    </td>
                                    <td className="relative py-3 pl-4 pr-6 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => { setUsuarioEditing(u); setIsUsuarioModalOpen(true); }} className="text-zinc-400 hover:text-brand-primary transition-colors cursor-pointer" title="Editar">
                                              <i className="fa-solid fa-pen-to-square"></i>
                                          </button>
                                          {u.username !== currentUser.username && (
                                              <button onClick={() => setItemToDelete({type:'usuario', username: u.username, cargo: u.cargo})} className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
                                                  <i className="fa-solid fa-trash-can"></i>
                                              </button>
                                          )}
                                        </div>
                                    </td>
                                </tr>
                              ))}
                              {usuariosList.length === 0 && (
                                <tr>
                                  <td colSpan="3" className="p-12 text-center text-sm font-medium text-zinc-400 italic">No hay usuarios registrados en el sistema.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                    </div>
                  </div>
                )}
                {activeTab === 'funcionarios' && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6 pb-8">
                    
                    {/* ENCABEZADO Y ACCIONES UNIFICADAS */}
                    <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-[24px] border border-zinc-200/80 dark:border-darkbg-border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      
                      {/* TÍTULO E INFORMACIÓN */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
                          <i className="fa-solid fa-address-book text-2xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Padrón de Funcionarios</h2>
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                            <span>Directorio oficial de personal de <span className="text-brand-primary dark:text-brand-accent">{dependenciaActual}</span></span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                              {funcionariosPurosDependencia.length} registrados
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* BARRA DE ACCIONES Y BUSCADOR */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative w-full sm:w-56">
                          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                          <input 
                            type="text"
                            placeholder="Buscar C.I. o nombre..."
                            value={searchFuncionarioInput}
                            onChange={(e) => {
                                setSearchFuncionarioInput(e.target.value);
                                setCurrentPaginaFuncionarios(1);
                            }}
                            className="block w-full rounded-xl border border-zinc-200 dark:border-darkbg-border bg-zinc-50 dark:bg-darkbg-main py-2.5 pl-10 pr-3 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card outline-none transition-all shadow-inner"
                          />
                        </div>

                        <button onClick={sincronizarBienesConPadron} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-main border border-zinc-200 dark:border-darkbg-border px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand-primary hover:text-brand-primary shadow-2xs transition-all cursor-pointer">
                          <i className="fa-solid fa-rotate text-brand-primary"></i> Sincronizar
                        </button>

                        <button onClick={handleDownloadTemplateFuncionarios} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-main border border-zinc-200 dark:border-darkbg-border px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 shadow-2xs transition-all cursor-pointer">
                          <i className="fa-solid fa-file-excel text-emerald-500"></i> Plantilla
                        </button>

                        <button onClick={() => fileInputFuncionariosRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-darkbg-main border border-zinc-200 dark:border-darkbg-border px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 shadow-2xs transition-all cursor-pointer">
                          <i className="fa-solid fa-file-import text-emerald-600"></i> Importar
                        </button>

                        <button onClick={() => setIsNewFuncionarioModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-user-plus"></i> Nuevo
                        </button>
                      </div>

                    </div>

                    {/* TABLA DE FUNCIONARIOS ESTILIZADA */}
                    <div className="flex-1 bg-white dark:bg-darkbg-card shadow-sm border border-zinc-200/80 dark:border-darkbg-border rounded-[28px] flex flex-col overflow-hidden relative min-h-[450px]">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="min-w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-darkbg-main/95 backdrop-blur-md z-10 border-b border-zinc-200/80 dark:border-darkbg-border">
                              <tr className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                <th className="py-4 pl-8 pr-4">Cédula de Identidad</th>
                                <th className="px-4 py-4 w-1/3">Nombre Completo</th>
                                <th className="px-4 py-4 w-1/3">Cargo Institucional</th>
                                <th className="relative py-4 pl-4 pr-8 text-right"><span className="sr-only">Acciones</span></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-darkbg-card divide-y divide-zinc-100 dark:divide-zinc-800/60">
                              {funcionariosPaginados.map((f, idx) => {
                                if (f.esSeparador) {
                                    return (
                                        <tr key={`sep-${f.letra}-${idx}`} className="bg-zinc-100/80 dark:bg-zinc-950/80 border-y border-zinc-200/60 dark:border-zinc-800">
                                            <td colSpan="4" className="py-3 pl-8 pr-4 font-black text-xs text-brand-primary dark:text-brand-accent uppercase tracking-widest">
                                                <span className="inline-flex items-center gap-2.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shadow-sm"></span>
                                                    Sección {f.letra}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }

                                const inicial = f.nombre ? f.nombre.charAt(0).toUpperCase() : 'F';

                                return (
                                  <tr key={f.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group">
                                      <td className="py-4 pl-8 pr-4 align-middle font-mono font-bold text-zinc-700 dark:text-zinc-300 text-sm">
                                          {formatCI(f.cedula)}
                                      </td>
                                      <td className="px-4 py-4 align-middle">
                                          <div className="flex items-center gap-3.5">
                                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-xs shadow-inner border border-zinc-200/60 dark:border-zinc-700/60">
                                                  {inicial}
                                              </div>
                                              <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{f.nombre}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 py-4 align-middle text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wide">
                                          <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                                              {f.cargo || 'Funcionario'}
                                          </span>
                                      </td>
                                      <td className="relative py-4 pl-4 pr-8 align-middle text-right">
                                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                              <button 
                                                  onClick={() => handleEditFuncionario(f)} 
                                                  className="h-9 w-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-xl transition-colors cursor-pointer shadow-2xs"
                                                  title="Editar funcionario"
                                              >
                                                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                                              </button>
                                              <button 
                                                  onClick={() => handleDeleteFuncionario(f.id)} 
                                                  className="h-9 w-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded-xl transition-colors cursor-pointer shadow-2xs"
                                                  title="Eliminar funcionario"
                                              >
                                                  <i className="fa-solid fa-trash-can text-xs"></i>
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

                {activeTab === 'fc04' && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent shadow-2xs">
                          <i className="fa-solid fa-file-invoice text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Registro Mensual FC-04</h2>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Gestión contable de altas y bajas patrimoniales</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 items-center">
                        <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
                        <button onClick={() => openFC04Modal(null)} className={STYLES.btnPrimary}>
                            <i className="fa-solid fa-plus"></i> Redactar Planilla
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs min-h-[400px]">
                      {isLoading ? ( <SkeletonLoader /> ) : filteredFC04.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                              <i className="fa-solid fa-folder-open text-2xl"></i>
                            </div>
                            <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin expedientes registrados</h3>
                            <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen formularios FC-04 generados en el ciclo seleccionado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredFC04.map(fc => {
                            const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento);
                            const isAlta = fc.origenMovimiento !== 'B';
                            return (
                              <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand-primary/50 transition-all group`}>
                                <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-2xs ${isAlta ? 'bg-zinc-100 text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300' : 'bg-brand-light text-brand-dark dark:bg-brand-primary/20 dark:text-brand-accent'}`}>
                                        <i className={`fa-solid ${isAlta ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-zinc-900 dark:text-white text-lg leading-snug">{origenObj?.nombre || fc.origenMovimiento}</p>
                                        <p className="text-xs text-zinc-400 font-bold mt-0.5 uppercase tracking-wider">Periodo: {fc.mes} / {fc.anio}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={()=>handleGenerateFC04PDF(fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Imprimir PDF"><i className="fa-solid fa-print text-xs"></i></button>
                                    <button onClick={()=>openFC04Modal(fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/20 transition cursor-pointer" title="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                    {isAdmin && (
                                        <button onClick={()=>setItemToDelete({type:'fc04', id:fc.id})} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-darkbg-border">
                                  {fc.sinMovimiento ? (
                                    <span className="inline-flex items-center rounded-xl bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-darkbg-main dark:text-zinc-400 border border-zinc-200 dark:border-darkbg-border">Sin Movimiento</span>
                                  ) : (
                                    <div>
                                        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Activos ({fc.bienesSnapshot?.length || 0})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {fc.bienesSnapshot?.slice(0, 3).map(b => ( <span key={b.id} className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-mono font-bold text-zinc-800 dark:bg-darkbg-main dark:text-zinc-300 border border-zinc-200/60 dark:border-darkbg-border">{b.rotulo}</span> ))}
                                          {fc.bienesSnapshot?.length > 3 && <span className="text-xs font-bold text-brand-primary self-center ml-1">+{fc.bienesSnapshot.length - 3}</span>}
                                        </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'fc10' && (
                <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent shadow-2xs">
                          <i className="fa-solid fa-file-signature text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Actas de Responsabilidad (FC-10)</h2>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Delegación y custodia legal de los bienes institucionales</p>
                        </div>
                      </div>

                      {/* CONTENEDOR DE CONTROLES SUPERIOR */}
                      <div className="flex flex-wrap gap-3 items-center">
                        <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />                       
                        {/* NUEVO BOTÓN CONSOLIDADO */}
                        <button onClick={() => setIsConsolidatedFC10ModalOpen(true)} className={STYLES.btnPrimary + " !bg-brand-primary flex items-center gap-2"}>
                            <i className="fa-solid fa-file-lines text-xs"></i> FC-10 Consolidado
                        </button>
                      </div>
                    </div>                    
                    <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs min-h-[400px]">
                      {isLoading ? (
                        <SkeletonLoader />
                      ) : filteredFC10.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                            <i className="fa-solid fa-folder-open text-2xl"></i>
                          </div>
                          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin asignaciones en el ciclo</h3>
                          <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen actas FC-10 generadas en el periodo seleccionado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredFC10.map(fc => {
                            const bien = bienes.find(b=>b.id === fc.bienId) || {};
                            const isDevuelto = !!fc.devolucionFecha;
                            return (
                              <div key={fc.id} className="bg-white dark:bg-darkbg-card rounded-xl border border-zinc-200 dark:border-darkbg-border shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-full h-1 ${isDevuelto ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-brand-primary'}`}></div>                           
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1.5">
                                            {isDevuelto ? (
                                                <span className="inline-flex w-fit items-center rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                                    Devuelto
                                                </span>
                                            ) : (
                                                <span className="inline-flex w-fit items-center rounded-md bg-brand-light/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent border border-brand-primary/20 shadow-sm">
                                                    Vigente
                                                </span>
                                            )}
                                            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                                                <i className="fa-regular fa-calendar"></i> {formatDateText(fc.entregadoFecha || fc.fechaGeneracion)}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-darkbg-card rounded-lg shadow-sm border border-zinc-100 dark:border-darkbg-border p-1">
                                            <button onClick={()=>handleGenerateFC10PDF([fc], [bien])} className="text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50 p-1.5 rounded-md transition cursor-pointer" title="Imprimir"><i className="fa-solid fa-print"></i></button>
                                            <button onClick={() => openFC10Modal(bien, fc)} className="text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50 p-1.5 rounded-md transition cursor-pointer" title="Editar / Cerrar"><i className="fa-solid fa-pen-to-square"></i></button>
                                            {isAdmin && (
                                                <button onClick={()=>setItemToDelete({type:'fc10', id:fc.id, bienId:bien.id})} className="text-zinc-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition cursor-pointer" title="Eliminar"><i className="fa-solid fa-trash-can"></i></button>
                                            )}
                                        </div>
                                    </div>                                   
                                    <div className="mt-2">
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-tight">{fc.funcionarioNombre}</h4>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">{fc.funcionarioCargo}</p>
                                    </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                </div>
            )}
                {activeTab === 'fc11' && (
                  <div className="animate-fade-in flex flex-col flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-6 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent shadow-2xs">
                          <i className="fa-solid fa-truck-fast text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Autorizaciones de Traslado (FC-11)</h2>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Movilidad interna institucional de bienes entre dependencias</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
                        <button onClick={handleExportFC11CSV} className={STYLES.btnSecondary}>
                            <i className="fa-solid fa-file-csv text-emerald-500"></i> Exportar CSV
                        </button>
                      </div>
                    </div>                    
                    <div className="bg-white dark:bg-darkbg-card p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-2xs min-h-[400px]">
                      {isLoading ? ( <SkeletonLoader /> ) : filteredFC11.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-darkbg-main/50 rounded-2xl border border-dashed border-zinc-300 dark:border-darkbg-border">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-darkbg-main text-zinc-400 mb-4 shadow-2xs">
                            <i className="fa-solid fa-boxes-packing text-2xl"></i>
                          </div>
                          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">Sin traslados registrados</h3>
                          <p className="text-xs font-medium text-zinc-400 max-w-xs mt-1">No existen expedientes FC-11 procesados en el periodo seleccionado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredFC11.map(fc => {
                            const depRemitente = fc.dependenciaRemitente || fc.remitente || '';
                            const depDestinataria = fc.dependenciaDestinataria || fc.destinatario || '';
                            const esSalida = depRemitente === dependenciaActual;
                            return (
                              <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand-primary/50 transition-all group relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${esSalida ? 'bg-zinc-500' : 'bg-brand-primary'}`}></div>
                                <div className="flex justify-between items-start mb-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-2xs ${esSalida ? 'bg-zinc-100 text-zinc-700 dark:bg-darkbg-main dark:text-zinc-300' : 'bg-brand-light text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent'}`}>
                                        <i className={`fa-solid ${esSalida ? 'fa-arrow-right-from-bracket' : 'fa-arrow-right-to-bracket'}`}></i>
                                    </div>
                                    <div className="flex flex-col">
                                        {esSalida ? <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black text-zinc-700 border border-zinc-200 dark:bg-darkbg-main dark:text-zinc-300 dark:border-darkbg-border uppercase tracking-wider">Despacho</span> : <span className="inline-flex items-center rounded-lg bg-brand-light px-2.5 py-0.5 text-[10px] font-black text-brand-primary border border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-accent uppercase tracking-wider">Recepción</span>}
                                        <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1 uppercase">Nº {fc.numeroFormulario}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={()=>handleGenerateFC11PDF([fc])} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Re-imprimir"><i className="fa-solid fa-print text-xs"></i></button>
                                    <button onClick={()=>openFC11Modal(bienes.find(b => b.id === fc.bienId) || fc.bienSnapshot, fc)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-brand-primary hover:bg-brand-light dark:hover:bg-brand-primary/20 transition cursor-pointer" title="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                    {isAdmin && (
                                        <button onClick={()=>setItemToDelete({type:'fc11', id:fc.id})} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 flex-1 flex flex-col">
                                  <div className="flex flex-col gap-1.5 mb-4 border-l-2 border-zinc-200 dark:border-darkbg-border pl-3 py-1">
                                     <p className="text-xs text-zinc-500 dark:text-zinc-400"><span className="font-bold text-zinc-900 dark:text-zinc-100">{esSalida ? 'Hacia:' : 'Desde:'}</span> {esSalida ? depDestinataria : depRemitente}</p>
                                  </div>
                                  <div className="mt-auto bg-zinc-50/80 dark:bg-darkbg-main/80 p-3.5 rounded-xl border border-zinc-200/60 dark:border-darkbg-border">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-mono"><i className="fa-solid fa-tag text-zinc-400 mr-1.5"></i> {fc.bienSnapshot?.rotulo}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{fc.bienSnapshot?.descripcion || 'Especificación omitida'}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}                
                {activeTab === 'ayuda' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="relative rounded-2xl overflow-hidden bg-brand-primary dark:bg-brand-dark px-6 py-12 sm:px-12 sm:py-16 shadow-lg">
                        <div className="absolute inset-0 bg-white opacity-5 mix-blend-overlay"></div>
                        <div className="relative z-10 max-w-3xl">
                            <span className="inline-flex items-center gap-x-2 rounded-md bg-white/20 px-3 py-1 text-xs font-bold text-white mb-6 backdrop-blur-sm">
                                <i className="fa-solid fa-book-open"></i> Guía Operativa
                            </span>
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-5">Soporte y Normativa</h2>
                            <p className="text-lg font-medium leading-8 text-brand-light">Documentación oficial para la correcta administración y trazabilidad del ciclo de vida de los bienes institucionales dentro de la universidad.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5">
                            <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                                <i className="fa-solid fa-network-wired text-brand-primary"></i> Procedimiento Lógico
                            </h2>
                            <div className={`${STYLES.card} p-6 sm:p-8 relative overflow-hidden`}>
                                <div className="absolute left-[56px] top-12 bottom-12 w-0.5 bg-zinc-200 dark:bg-darkbg-border hidden sm:block z-0"></div>
                                <div className="space-y-2 relative z-10">
                                    <WorkflowStep number="1" title="Alta (FC-04)" description="La incorporación inicial exige la creación de un FC-04 de Alta. Esto registra contablemente el ítem en la base de datos principal." icon="fa-arrow-trend-up" color="bg-zinc-500" />
                                    <WorkflowStep number="2" title="Delegación (FC-10)" description="La entrega física requiere el levantamiento de un FC-10 nominal. Este instrumento legal transfiere la responsabilidad civil del objeto." icon="fa-file-signature" color="bg-brand-primary" />
                                    <WorkflowStep number="3" title="Movilidad (FC-11)" description="Toda reubicación entre facultades debe ampararse en un FC-11, el cual extingue automáticamente la responsabilidad del custodio anterior." icon="fa-dolly" color="bg-zinc-600" />
                                    <WorkflowStep number="4" title="Extinción (FC-04)" description="El desuso o rotura definitiva obliga a tramitar un FC-04 de Baja para remover contablemente el valor del patrimonio activo." icon="fa-ban" color="bg-red-500" />
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                                <i className="fa-solid fa-clipboard-question text-brand-primary"></i> Preguntas Frecuentes
                            </h2>
                            <div className="space-y-4">
                                <FaqItem question="Explicación de la alerta crítica 'Req. Acción'" answer="Este indicador previene discrepancias en el inventario. Se activa bajo dos escenarios: 1) Ingreso de un nuevo bien sin ubicación física definida. 2) Recepción de un bien trasladado (FC-11) que no ha sido re-asignado legalmente mediante un nuevo FC-10." />
                                <FaqItem question="Protocolo para exclusión de inventario (Baja)" answer="La normativa exige generar un expediente FC-04 de cierre, seleccionando 'Baja' como origen. El sistema procesará el descargo contable e inhabilitará el registro. La modificación manual del estado en el inventario solo se admite para correcciones de digitación." />
                                <FaqItem question="Autocompletado de la estructura organizacional" answer="El formulario FC-10 emplea aprendizaje histórico. Al procesar las primeras asignaciones, el sistema mapea la jerarquía (Unidad, Repartición, etc.) permitiendo el despliegue automático en procesos futuros, reduciendo la carga administrativa." />
                                <FaqItem question="Recuperación de registros históricos (Bajas)" answer="A fines de precisión contable, los ítems dados de baja no participan de las métricas principales. Para auditar este histórico, acceda a 'Directorio Patrimonial' y ejecute el filtro 'Bajas' en el panel de herramientas." />
                                <FaqItem question="Exportación masiva de código de barras (QR)" answer="A través de la vista de Inventario, usted puede aplicar segmentaciones por ubicación o custodio. Ejecute el comando 'Lote QRs' para compilar un archivo comprimido (.zip) estructurado para impresión industrial." />
                            </div>
                        </div>
                    </div>
                  </div>
               )}
            </div>
          </main>
      </div>

      {/* Modales y componentes flotantes */}
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
    STYLES={STYLES}
/>
      <ScannerModal 
    isOpen={isScannerOpen}
    onClose={() => {
        setIsScannerOpen(false);
        if (window.html5QrCode && window.html5QrCode.isScanning) {
            window.html5QrCode.stop().catch(() => {});
        }
    }}
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
          <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>           
            {/* CABECERA LIMPIA */}
            <div className="relative px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                   <i className="fa-solid fa-file-pdf text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Generar Inventario FC-03</h2>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Configura los parámetros del reporte</p>
                </div>
              </div>
              <button onClick={() => setIsFC03ModalOpen(false)} className="rounded-2xl p-2.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                 <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            {/* CUERPO DEL MODAL */}
            <div className="p-8 space-y-6 bg-white dark:bg-zinc-900">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tipo de Reporte</label>
                    <div className="relative">
                        <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.tipoFiltro} onChange={e => setFc03Config({...fc03Config, tipoFiltro: e.target.value})}>
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
                            <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.filtroValor} onChange={e => setFc03Config({...fc03Config, filtroValor: e.target.value})}>
                                <option value="">Seleccione una ubicación...</option>
                                {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                        </div>
                    </div>
                )}               
                {fc03Config.tipoFiltro === 'funcionario' && (
    <div className="space-y-2 animate-fade-in">
        <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Seleccionar Funcionario</label>
        <div className="relative">
            <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.filtroValor} onChange={e => setFc03Config({...fc03Config, filtroValor: e.target.value})}>
                <option value="">Seleccione por Cédula o Nombre...</option>
                {/* APLICAR .filter AQUÍ */}
                {funcionariosPadron.filter(f => f.dependencia === dependenciaActual).map(f => (
                    <option key={f.id || f.cedula} value={f.nombre}>
                        {f.cedula !== 'S/C' ? `${formatCI(f.cedula)} - ${f.nombre}` : `S/C - ${f.nombre}`}
                    </option>
                ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
        </div>
    </div>
)}
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lugar de Emisión</label>
                    <input type="text" className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all shadow-inner" value={fc03Config.lugar} onChange={e => setFc03Config({...fc03Config, lugar: e.target.value})} placeholder="Ej: Pilar" />
                </div>
            </div>
            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 rounded-b-[32px]">
              <button onClick={() => setIsFC03ModalOpen(false)} className="py-3.5 px-6 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all cursor-pointer">Cancelar</button>
              <button onClick={executeGenerateFC03} className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-2xl text-sm font-black text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50" disabled={fc03Config.tipoFiltro !== 'general' && !fc03Config.filtroValor}>
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
        funcionariosPadron={funcionariosPadron.filter(f => f.dependencia === dependenciaActual)}
    />
)}
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
      {itemToDelete && (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md !rounded-[32px] p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
                
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-4 ${itemToDelete.type === 'requestBaja' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
                    <i className={`fa-solid ${itemToDelete.type === 'requestBaja' ? 'fa-paper-plane' : 'fa-triangle-exclamation'} text-2xl`}></i>
                </div>

                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">
                    {itemToDelete.type === 'requestBaja' ? '¿Solicitar baja de este bien?' : '¿Eliminar o dar de baja el registro?'}
                </h3>

                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                    {itemToDelete.type === 'requestBaja' 
                        ? `Se enviará una notificación formal al administrador para que evalúe la exclusión del bien con rótulo: "${itemToDelete.item?.rotulo || 'S/Rótulo'}".`
                        : `Esta acción modificará el estado del activo "${itemToDelete.item?.rotulo || ''}" a De Baja o lo removerá del inventario activo.`
                    }
                </p>

                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setItemToDelete(null)}
                        className="flex-1 py-3.5 px-5 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteAction}
                        className={`flex-1 py-3.5 px-5 rounded-2xl text-xs font-black text-white transition-all shadow-md cursor-pointer ${itemToDelete.type === 'requestBaja' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'}`}
                    >
                        {itemToDelete.type === 'requestBaja' ? 'Sí, enviar solicitud' : 'Confirmar Acción'}
                    </button>
                </div>

            </div>
        </div>
      )}
      {showChangelog && (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden"}>
                <div className="bg-brand-primary p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur-md shadow-sm mb-4 uppercase tracking-widest">
                            ¡Nueva Actualización!
                        </span>
                        <h2 className="text-3xl font-black text-white tracking-tight">{systemConfig.version}</h2>
                    </div>
                </div>
                <div className="p-8 bg-white dark:bg-darkbg-card">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">Novedades y Mejoras</h3>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed whitespace-pre-wrap">
                        {systemConfig.notes}
                    </div>
                </div>
                <div className={STYLES.modalFooter + " justify-center !border-none !pt-0 bg-white dark:bg-darkbg-card"}>
                    <button 
                        onClick={() => {
                            localStorage.setItem('unp_last_version', systemConfig.version);
                            setShowChangelog(false);
                        }} 
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all shadow-md hover:bg-brand-hover active:scale-95 cursor-pointer"
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
    STYLES={STYLES}
/>
      <DependenciaConfirmModal 
          showDependenciaConfirm={showDependenciaConfirm}
          setShowDependenciaConfirm={setShowDependenciaConfirm}
          confirmDependenciaChange={confirmDependenciaChange}
          pendingDependencia={pendingDependencia}
          STYLES={STYLES}
      />
    </div>
  );
}
