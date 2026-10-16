import { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import localforage from 'localforage';
import { conSello } from '../services/syncBienes';
import { normalizeStr, formatDateText, formatCurrency, getEstadoAbbr, generateId } from '../utils/helpers';
import { numeroALetras } from '../utils/numeroLetras';
import { extraerCodigoQR } from '../utils/qr';
import { registrarAuditoria } from '../services/auditService';
import { enqueueOfflineAction } from '../services/offlineSyncService';
import { FORMATO_PDF } from '../constants/appConstants';

// Modales de fichas y formularios: apertura, guardado y borrado
// (extraído de App.jsx, Fase 6). Último dominio del split.
//
// Parámetros:
// - notify: addToast estable. setIsProcessing: indicador global.
// - Datos: bienes, setBienes, fc10List, fc11List, fc04List, dependenciaActual,
//   currentUser, isAdmin, esDesarrollador.
// - Filtros/navegación: clearAllFilters, setSearchTerm, setSearchInput,
//   setActiveTab, setCurrentPage.
// - Cross-hooks: agregarCodigoConteo (auditoría), cargarNotificaciones (sync).
// - Registrar auditoría y sellos se importan directo.
export function useFcModals({
  notify, setIsProcessing, appLogo,
  bienes, setBienes, filteredBienes, fc10List, fc11List, fc04List,
  dependenciaActual, funcionariosConDatos,
  currentUser, isAdmin, esDesarrollador,
  clearAllFilters, setSearchTerm, setSearchInput, setActiveTab, setCurrentPage,
  agregarCodigoConteo, cargarNotificaciones,
  setIsScannerOpen, setDependenciaActual, setNotificaciones, setFc10List,
  setFc11List, setFc04List, setFuncionariosPadron, setUsuariosList,
  itemToDelete, setItemToDelete, motivoSolicitudBaja, setMotivoSolicitudBaja, setPendingCSVImport,
  funcionariosPadron, notificaciones, estructurasDB, setEstructurasDB,
  setFichaBien, setEventosAuditFicha,
  resolveLogoImg: _resolveLogoImg
}) {
  // resolveLogoImg se define después en App: wrapper perezoso anti-TDZ.
  const resolveLogoImg = (...a) => _resolveLogoImg(...a);
  const [isSaving, setIsSaving] = useState(false);
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
  const [fc03FuncionarioTexto, setFc03FuncionarioTexto] = useState('');
  const [showFC03FuncDropdown, setShowFC03FuncDropdown] = useState(false);
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [usuarioEditing, setUsuarioEditing] = useState(null);
  const [confirmBackupModal, setConfirmBackupModal] = useState(false);
  const [resolucionBaja, setResolucionBaja] = useState(null);
  const [motivoResolucion, setMotivoResolucion] = useState('');
  const fileInputRef = useRef(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [scanParaConteo, setScanParaConteo] = useState(false);
  const borradoPendiente = useRef(null);
  const ejecutarBorradoPendiente = async () => {
    const plan = borradoPendiente.current;
    borradoPendiente.current = null;
    if (!plan) return;
    try {
      const res = await plan.remoto();
      if (res && res.error) throw res.error;
    } catch (e) {
      plan.revertir();
      notify('No se pudo completar. Se restauró el registro.', 'error');
    }
  };
  const programarBorrado = (plan) => {
    if (borradoPendiente.current) ejecutarBorradoPendiente();
    plan.aplicar();
    setItemToDelete(null);
    setMotivoSolicitudBaja('');
    borradoPendiente.current = plan;
    notify(plan.etiqueta, 'success', {
      duration: 6000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (borradoPendiente.current !== plan) return;
          borradoPendiente.current = null;
          plan.revertir();
          notify('Acción deshecha.', 'info');
        }
      }
    });
    setTimeout(() => { if (borradoPendiente.current === plan) ejecutarBorradoPendiente(); }, 6000);
  };

  const openFichaBien = async (bien) => {
    if (!bien) return;
    setFichaBien(bien);
    setEventosAuditFicha([]);
    try {
      const { data, error } = await supabase.from('auditoria').select('*').eq('bienid', bien.id).order('fecha', { ascending: false }).limit(100);
      if (!error && data) setEventosAuditFicha(data);
    } catch (e) {}
  };

  const openFC03Modal = () => {
      setFc03Config({ tipoFiltro: 'general', filtroValor: '', lugar: 'Pilar' });
      setFc03FuncionarioTexto('');
      setShowFC03FuncDropdown(false);
      setIsFC03ModalOpen(true);
  };

  const executeGenerateFC03 = () => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify("Cargando librerías PDF...", "warning");
    
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

    if (bienesToPrint.length === 0) return notify("No se encontraron bienes activos para los filtros aplicados.", "warning");
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
        notify("Reporte Inventario Oficial generado", "success");
      } catch(e) { 
        console.error(e); 
        notify("Error PDF: " + (e.message || "Desconocido"), "error"); 
      } finally { 
        setIsProcessing({ active: false, text: '' }); 
        setIsFC03ModalOpen(false); 
      }
    }, 100);
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
              notify(`Activo ubicado en dependencia: ${bienEncontrado.dependencia}`, "info");
            } else {
              notify(`Este bien pertenece a la dependencia: ${bienEncontrado.dependencia}`, "warning");
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
      notify(`Bien localizado: ${bienEncontrado.rotulo} - ${bienEncontrado.descripcion || ''}`, "success");
      clearAllFilters();
      const rotuloLimpio = bienEncontrado.rotulo || '';
      setSearchTerm(rotuloLimpio);
      setSearchInput(rotuloLimpio);
      setActiveTab('inventario');
      setBienEditing(bienEncontrado);
      setIsBienModalOpen(true);
    } else {
      notify(`Activo "${targetId}" no encontrado en el inventario.`, "warning");
      clearAllFilters();
      setSearchTerm(targetId);
      setSearchInput(targetId);
      setActiveTab('inventario');
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
        notify(`El rótulo "${rotuloInput}" ya está registrado en esta dependencia.`, "error"); 
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
            return notify(`Guardado localmente. Se sincronizará al recuperar la señal.`, "warning");
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
                notify(`"${rotuloInput}" guardado y sincronizado.`, "success");
                form.elements['rotulo'].value = '';
                form.elements['descripcion'].value = '';
                if(form.elements['hasQR']) form.elements['hasQR'].checked = false;
                form.elements['rotulo'].focus();
                setBienEditing(null);
            } else {
                setIsBienModalOpen(false); 
                notify("Bien guardado y actualizado con el padrón", "success"); 
            }
        } else {
            notify("Error al guardar en el servidor.", "error");
        }
    } catch (e) { 
        notify("Error al guardar.", "error"); 
    } finally {
        setIsSaving(false);
        setIsProcessing({ active: false, text: '' });
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
      return notify('Solo el Desarrollador del Sistema puede otorgar ese rol.', 'error');
    }
    // Proteger cuentas de desarrollador existentes
    if (usuarioEditing?.cargo === 'desarrollador' && !esDesarrollador) {
      return notify('Solo el Desarrollador del Sistema gestiona esa cuenta.', 'error');
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
            notify(usuarioEditing ? "Usuario actualizado" : "Usuario creado", "success");
            setIsUsuarioModalOpen(false);
            if (usuarioEditing) {
                setUsuariosList(prev => prev.map(u => u.username === usuarioEditing.username ? { ...u, nombre: userData.nombre, cargo: userData.cargo, dependencia: userData.dependencia } : u));
            } else {
                setUsuariosList(prev => [...prev, userData]);
            }
        } else {
            notify(res.error.message || "Error al procesar la solicitud", "error");
        }
    } catch (error) {
        notify("Error de conexión.", "error");
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
      if (esMovimientoInterno) { setBienes(prev => prev.map(b => b.id === updatedBien.id ? updatedBien : b)); notify(`Movimiento interno registrado en ${fc11Data.dependenciaDestinataria}.`, "warning"); } else { setBienes(prev => prev.filter(b => b.id !== updatedBien.id)); notify(`El bien fue transferido a ${fc11Data.dependenciaDestinataria}.`, "success"); } setIsFC11ModalOpen(false); return true;
    } catch (error) { console.error(error); notify("Error al registrar FC-11.", "error"); return false; }
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
              notify(`${newBienes.length} bienes inyectados.`, "success"); 
          }
          if (updatedBienes.length > 0) { 
              for (const b of updatedBienes) {
                  await supabase.from('bens').update(conSello({ data: b })).eq('id', b.id);
              }
              setBienes(prev => prev.map(old => updatedBienes.find(upd => upd.id === old.id) || old)); 
              notify(`${updatedBienes.length} bajas registradas.`, "success"); 
          }
      }
      if (fc04Editing) setFc04List(prev => prev.map(item => item.id === fc04Data.id ? fc04Data : item)); else setFc04List(prev => [fc04Data, ...prev]); setIsFC04ModalOpen(false);
      notify("Expediente FC-04 guardado", "success");
      return true;
    } catch (error) { console.error(error); notify("Error guardando FC-04.", "error"); return false; }
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
        notify(isDevuelto ? "Devolución registrada" : "FC-10 Guardado exitosamente", "success");
        return true; 
    } catch (error) { console.error(error); notify("Error al guardar.", "error"); return false; }
  };

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

          notify(accion === "aprobar" ? "Baja aprobada y notificada al usuario." : "Solicitud rechazada y notificada al usuario.", "success");
      } catch (e) {
          console.error("Error al resolver baja:", e);
          notify("Error al procesar la resolución.", "error");
      } finally {
          setIsProcessing({ active: false, text: "" });
          setResolucionBaja(null);
          setMotivoResolucion("");
      }
  };

  const confirmDeleteAction = async () => {
      if (!itemToDelete) return; 
      const { type, id, username, item } = itemToDelete;
      try { 
          let res = { error: null };
          if (type === 'requestBajaFuncionario') {
              if (!motivoSolicitudBaja.trim()) {
                  return notify('Debe ingresar el motivo de la solicitud.', 'warning');
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
                notify('Solicitud enviada con éxito al administrador.', 'success');
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
                  return notify("Debe ingresar el motivo de la baja.", "warning");
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
                notify("Solicitud de baja enviada con éxito al administrador.", "success"); 
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
              // Borrado diferido con Deshacer (6s): aplica local ya, confirma remoto después.
              const snapshot = item ? { ...item } : null;
              const esBaja = type === 'bien' && item?.estadoConservacion !== 'De Baja';
              let plan = null;
              if (type === 'bien') {
                  if (esBaja) {
                      plan = {
                          etiqueta: 'Bien dado de baja.',
                          aplicar: () => setBienes(prev => prev.map(b => b.id === id ? { ...b, estadoConservacion: 'De Baja' } : b)),
                          revertir: () => snapshot && setBienes(prev => prev.map(b => b.id === id ? snapshot : b)),
                          remoto: async () => {
                              const r = await supabase.from('bens').update(conSello({ data: { ...item, estadoConservacion: 'De Baja' } })).eq('id', id);
                              await registrarAuditoria({
                                  usuario: currentUser?.username || 'Usuario',
                                  dependencia: dependenciaActual,
                                  accion: 'ELIMINACION_O_BAJA',
                                  entidad: 'BIEN',
                                  entidadId: id,
                                  detalles: { rotulo: item?.rotulo, descripcion: item?.descripcion, estadoPrevio: item?.estadoConservacion }
                              });
                              return r;
                          }
                      };
                  } else {
                      plan = {
                          etiqueta: 'Registro eliminado.',
                          aplicar: () => setBienes(prev => prev.filter(b => b.id !== id)),
                          revertir: () => snapshot && setBienes(prev => (prev.some(b => b.id === id) ? prev : [...prev, snapshot])),
                          remoto: async () => {
                              const r = await supabase.from('bens').delete().eq('id', id);
                              await registrarAuditoria({
                                  usuario: currentUser?.username || 'Usuario',
                                  dependencia: dependenciaActual,
                                  accion: 'ELIMINACION_O_BAJA',
                                  entidad: 'BIEN',
                                  entidadId: id,
                                  detalles: { rotulo: item?.rotulo, descripcion: item?.descripcion, estadoPrevio: item?.estadoConservacion }
                              });
                              return r;
                          }
                      };
                  }
              }
              else if (type === 'fc10' || type === 'fc11' || type === 'fc04') {
                  const tabla = type;
                  const quita = type === 'fc10' ? setFc10List : type === 'fc11' ? setFc11List : setFc04List;
                  plan = {
                      etiqueta: 'Documento eliminado.',
                      aplicar: () => quita(prev => prev.filter(f => f.id !== id)),
                      revertir: () => snapshot && quita(prev => (prev.some(f => f.id === id) ? prev : [...prev, snapshot])),
                      remoto: () => supabase.from(tabla).delete().eq('id', id)
                  };
              }
              else if (type === 'usuario') {
                  if (itemToDelete.cargo === 'desarrollador' && !esDesarrollador) {
                      return notify('Solo el Desarrollador del Sistema gestiona esa cuenta.', 'error');
                  }
                  plan = {
                      etiqueta: 'Usuario eliminado.',
                      aplicar: () => setUsuariosList(prev => prev.filter(u => u.username !== username)),
                      revertir: () => snapshot && setUsuariosList(prev => (prev.some(u => u.username === snapshot.username) ? prev : [...prev, snapshot])),
                      remoto: () => supabase.from('usuarios').delete().eq('username', username)
                  };
              }
              else if (type === 'funcionario') {
                  plan = {
                      etiqueta: 'Funcionario eliminado del padrón.',
                      aplicar: () => setFuncionariosPadron(prev => prev.filter(f => f.id !== id)),
                      revertir: () => snapshot && setFuncionariosPadron(prev => (prev.some(f => f.id === id) ? prev : [...prev, snapshot])),
                      remoto: () => supabase.from('funcionarios').delete().eq('id', id)
                  };
              }
              if (plan) programarBorrado(plan);
          }
      } catch (e) { 
        notify("Error de red.", "error"); 
      } finally { 
        setItemToDelete(null); 
      }
  };

  return {
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
    isSaving, setIsSaving,
    confirmBackupModal, setConfirmBackupModal,
    resolucionBaja, setResolucionBaja, motivoResolucion, setMotivoResolucion,
    fileInputRef, showUnsavedChangesModal, setShowUnsavedChangesModal,
    scanParaConteo, setScanParaConteo,
    openFichaBien, openFC03Modal, executeGenerateFC03,
    openResolucionModal, openFC10Modal, openFC11Modal, openFC04Modal,
    handleAddFC04Item, handleRemoveFC04Item, handleFC04ItemChange,
    handleScanSuccess,
    saveBien, saveUsuario, saveFC11, saveFC04, saveFC10,
    submitResolucionBaja, confirmDeleteAction
  };
}
