import { useRef } from 'react';
import { supabase } from '../supabaseClient';
import localforage from 'localforage';
import { conSello } from '../services/syncBienes';
import {
  normalizeStr, formatCurrency, formatDateText, formatCI
} from '../utils/helpers';
import { ORIGENES_FC04, FORMATO_PDF } from '../constants/appConstants';
import {
  generateSimpleQR, generateProfessionalLabelPNG, buildFC10PDFDoc
} from '../utils/pdfGenerators';
import { registrarAuditoria } from '../services/auditService';

// Handlers de PDFs, QR, CSV, Excel y backup (extraídos de App.jsx, Fase 6).
// Funciones de presentación: reciben todo por parámetros, sin estado propio.
//
// Parámetros principales:
// - notify: addToast estable. setIsProcessing: indicador global.
// - appLogo, bienes, filteredBienes, dependenciaActual, fc10List, fc11List,
//   funcionariosPadron, currentUser, fc10Year, fc10Month, isAdmin.
// - setBienes, setIsQRModalOpen, setIsConsolidatedFC10ModalOpen.
// - resolveLogoImg: wrapper perezoso (se define después en App).
export function usePdfHandlers({
  notify, setIsProcessing, appLogo,
  bienes, filteredBienes, dependenciaActual, fc10List, fc11List,
  funcionariosPadron, currentUser, fc10Year, isAdmin,
  setBienes, setIsQRModalOpen, setIsConsolidatedFC10ModalOpen,
  resolveLogoImg
}) {
  // Cerrojo de trabajos pesados (ZIP de etiquetas, PDFs consolidados).
  //
  // Estos handlers usan setTimeout para no bloquear el render, así que un
  // doble clic lanzaba DOS generaciones en paralelo: competían por el
  // setIsProcessing global (el progreso salta de un trabajo al otro) y el usuario
  // terminaba con descargas duplicadas o contradictorias. Con 1800 bienes por
  // dependencia eso además hunde el navegador.
  const trabajoEnCurso = useRef(false);
  const conCerrojo = async (queHacer) => {
    if (trabajoEnCurso.current) {
      notify('Ya hay una generación en curso. Esperá a que termine.', 'warning');
      return;
    }
    trabajoEnCurso.current = true;
    try {
      await queHacer();
    } finally {
      trabajoEnCurso.current = false;
    }
  };

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
      notify("Etiqueta descargada con éxito", "success");
      setIsQRModalOpen(false);
    }
    return dataUrl;
  } catch (e) {
    notify("Error al generar la etiqueta", "error");
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
      notify("Código QR simple descargado", "success");
      setIsQRModalOpen(false);
    }
    return dataUrl;
  } catch (e) {
    notify("Error al descargar el QR", "error");
  } finally {
    if (!returnOnly) setIsProcessing({ active: false, text: '' });
  }
};

  const handleBulkLabelPNGZip = async (lista) => {
    const objetivos = Array.isArray(lista) && lista.length > 0 ? lista : filteredBienes;
    if (objetivos.length === 0) return notify("No hay bienes filtrados.", "warning");
    return conCerrojo(async () => {
    setIsProcessing({ active: true, text: 'Iniciando generación masiva de etiquetas...', pct: 0 });

    setTimeout(async () => {
      try {
        const cleanDepName = dependenciaActual.replace(/\s+/g, '_');
        const zip = new window.JSZip();
        const folder = zip.folder(`Etiquetas_Completas_${cleanDepName}`);
        
        const CHUNK_SIZE = 8;
        const totalBienes = objetivos.length;

        for (let i = 0; i < totalBienes; i += CHUNK_SIZE) {
          const chunk = objetivos.slice(i, i + CHUNK_SIZE);
          
          setIsProcessing({ 
            active: true, 
            text: `Generando etiquetas: ${Math.min(i + CHUNK_SIZE, totalBienes)} de ${totalBienes}...`,
            pct: Math.round((Math.min(i + CHUNK_SIZE, totalBienes) / totalBienes) * 100)
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
          const idsToUpdate = objetivos.map(b => b.id);
          setBienes(prev => prev.map(b => idsToUpdate.includes(b.id) ? { ...b, hasQR: true } : b));
          for (const bien of objetivos) {
            if (!bien.hasQR) {
              await supabase.from("bens").update(conSello({ data: { ...bien, hasQR: true } })).eq("id", bien.id);
            }
          }
        } catch (e) { console.error("Error bulk hasQR:", e); }
        notify("Archivo ZIP de etiquetas generado con éxito", "success");
      } catch (error) {
        console.error("Error en ZIP:", error);
        notify("Hubo un error al generar el archivo ZIP.", "error");
      } finally {
        setIsProcessing({ active: false, text: '' });
        setIsQRModalOpen(false);
      }
    }, 100);
    });
  };

  const handleBulkSimpleQRZip = async (lista) => {
    const objetivos = Array.isArray(lista) && lista.length > 0 ? lista : filteredBienes;
    if (objetivos.length === 0) return notify("No hay bienes filtrados.", "warning");
    return conCerrojo(async () => {
    setIsProcessing({ active: true, text: 'Iniciando compresión de QRs simples...', pct: 0 });

    setTimeout(async () => {
      try {
        const cleanDepName = dependenciaActual.replace(/\s+/g, '_');
        const zip = new window.JSZip();
        const folder = zip.folder(`QRs_Simples_${cleanDepName}`);
        
        const CHUNK_SIZE = 10;
        const totalBienes = objetivos.length;

        for (let i = 0; i < totalBienes; i += CHUNK_SIZE) {
          const chunk = objetivos.slice(i, i + CHUNK_SIZE);
          
          setIsProcessing({ 
            active: true, 
            text: `Procesando QRs: ${Math.min(i + CHUNK_SIZE, totalBienes)} de ${totalBienes}...`,
            pct: Math.round((Math.min(i + CHUNK_SIZE, totalBienes) / totalBienes) * 100)
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
          const idsToUpdate = objetivos.map(b => b.id);
          // Escrituras masivas: se cuentan los fallos en lugar de asumir que
          // todas entraron. supabase-js resuelve con { error } y no lanza, así
          // que sin esto el ZIP se descargaba "con éxito" aunque los QR no se
          // hubieran guardado en la base.
          let fallos = 0;
          for (const bien of objetivos) {
            if (!bien.hasQR) {
              const r = await supabase.from("bens").update(conSello({ data: { ...bien, hasQR: true } })).eq("id", bien.id);
              if (r.error) fallos++;
            }
          }
          setBienes(prev => prev.map(b => idsToUpdate.includes(b.id) ? { ...b, hasQR: true } : b));
          if (fallos > 0) {
            notify(`ZIP generado, pero ${fallos} QR no se pudieron guardar en la base.`, "warning");
          } else {
            notify("Archivo ZIP de QRs generado con éxito", "success");
          }
        } catch (e) {
          console.error("Error bulk simple QR:", e);
          notify("Hubo un error al generar el ZIP de QRs.", "error");
        }
      } catch (error) {
        console.error("Error en ZIP QR:", error);
        notify("Hubo un error al generar el archivo ZIP.", "error");
      } finally {
        setIsProcessing({ active: false, text: '' });
        setIsQRModalOpen(false);
      }
    }, 100);
    });
  };

  const handleGenerateFC04PDF = (fc) => {
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify("Cargando librerías PDF...", "warning");
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
        const cleanDepName = fc.dependencia.replace(/\s+/g, '_'); doc.save(`FC04_${cleanDepName}_${fc.mes}-${fc.anio}.pdf`); notify("Reporte PDF FC-04 generado", "success");
      } catch(e) { console.error(e); notify("Error PDF: " + (e.message || "Desconocido"), "error"); } finally { setIsProcessing({ active: false, text: '' }); }
    }, 100);
  };

  const handleGenerateFC11PDF = (fcsData) => {
    const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
    if (fcs.length === 0) return notify("No hay datos para generar FC-11", "warning");
    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify("Cargando librerías PDF...", "warning");
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
        const cleanFormNum = (fc.numeroFormulario || 'S-N').replace(/[^a-zA-Z0-9]/g, '-'); doc.save(`FC11_Traslado_${cleanFormNum}_${todayStr}.pdf`); notify("Reporte FC-11 generado", "success");
      } catch(e) { console.error(e); notify("Error PDF: " + (e.message || "Desconocido"), "error"); } finally { setIsProcessing({ active: false, text: '' }); }
    }, 100);
  };

  const handleGenerateFC10PDF = (fcsData, bienesData) => {
    const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
    const bienesAListar = Array.isArray(bienesData) ? bienesData : [bienesData];
    if (fcs.length === 0) return notify("No hay datos para generar FC-10", "warning");

    if (!window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return notify("Cargando librerías PDF...", "warning");
    setIsProcessing({ active: true, text: 'Generando PDF FC-10...' });
    
    setTimeout(() => {
      try {
        const { doc, fechaDocumento, fc } = buildFC10PDFDoc(fcs, bienesAListar);
        const cleanFunc = (fc.funcionarioNombre || 'SR').replace(/\s+/g, '_'); 
        doc.save(`FC10_Asignacion_${cleanFunc}_${fechaDocumento}.pdf`); 
        notify("Reporte PDF FC-10 generado", "success");
      } catch(e) { 
        console.error(e); notify("Error PDF: " + (e.message || "Desconocido"), "error"); 
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
    
    if (bienesDelFuncionario.length === 0) return notify("No se encontraron bienes en este rango de fechas.", "warning");

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

    if (fcsAnuales.length === 0) return notify(`No hay datos FC-10 para el año ${fc10Year}`, "warning");
    
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
      notify(`Reporte Excel FC-10 (${fc10Year}) descargado`, "success");
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

    if (fcsAnuales11.length === 0) return notify(`No hay datos FC-11 para el año ${fc10Year}`, "warning");
    
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
      notify(`Reporte Excel FC-11 (${fc10Year}) descargado`, "success");
    }, 100);
  };

  const handleDownloadTemplateCSV = () => {
      const csvContent = "\uFEFFCuenta Mayor;Sub-Cuenta;Analítico 1;Analítico 2;Descripción General;Fecha Adquisición (YYYY-MM-DD);Nº Rótulo;Valor Unitario (Sin puntos);Vida atil (Años)\n" +
                          "2.6.1.01;01;01;01;\"Computadora HP i5\";2023-01-15;10001;4500000;5\n" +
                          ";;;;\"Escritorio de Madera\";2022-11-10;10002;1200000;10";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, "Plantilla_Carga_Masiva_Bienes.csv");
      notify("Plantilla Excel (CSV) base descargada", "success");
  };

  const handleExportBackupGeneral = async () => {
    if (!isAdmin) return notify("Acción permitida únicamente para administradores.", "error");
    setIsProcessing({ active: true, text: "Generando respaldo integral del sistema..." });

    try {
      // Descarga paginada: PostgREST corta cada select en 1000 filas
      // (db-max-rows). Sin esto el respaldo se guardaba truncado en silencio y
      // el usuario lo leía como "copia completa". Ahora recorre cada tabla por
      // bloques y aborta si alguna falla, para que un respaldo incompleto sea
      // visible en vez de silencioso.
      const drenar = async (tabla, columnas = "*") => {
        const LOTE = 1000;
        const filas = [];
        let desde = 0;
        for (;;) {
          const { data, error } = await supabase
            .from(tabla)
            .select(columnas)
            .range(desde, desde + LOTE - 1);
          if (error) throw new Error(`${tabla}: ${error.message}`);
          filas.push(...(data || []));
          if (!data || data.length < LOTE) break;
          desde += LOTE;
        }
        return filas;
      };

      const [bienesDb, fc10Db, fc11Db, fc04Db, estructurasDb, usuariosDb, funcionariosDb, notifDb, auditDb] = await Promise.all([
        drenar("bens"),
        drenar("fc10"),
        drenar("fc11"),
        drenar("fc04"),
        drenar("estructuras"),
        drenar("usuarios", "username, nombre, cargo, dependencia"),
        drenar("funcionarios"),
        drenar("notificaciones"),
        drenar("auditoria")
      ]);

      const backupData = {
        metadata: {
          version: "2.2",
          sistema: "Sistema de Gestión Patrimonial UNP",
          fechaGeneracion: new Date().toISOString(),
          generadoPor: currentUser?.username || "Admin",
          totalBienes: bienesDb.length,
          totalFuncionarios: funcionariosDb.length,
          warning: "Este archivo contiene datos personales de funcionarios (cedulas) y detalles de bienes patrimoniales. Tratarlo como informacion sensible.",
          notaUsuarios: "Los usuarios NO incluyen contrasena (vive en Supabase Auth). La dependencia se incluye: sin ella el usuario perderia acceso a su inventario al restaurar."
        },
        bienes: bienesDb,
        fc10: fc10Db,
        fc11: fc11Db,
        fc04: fc04Db,
        estructuras: estructurasDb,
        // 'dependencia' ES el campo que decide a qué inventario accede cada
        // usuario. Antes este mapeo guardaba 'rol' (columna que no existe) y
        // dropeaba la dependencia: un respaldo restaurado dejaba a todos los
        // usuarios sin inventario asignado.
        usuarios: usuariosDb.map(u => ({ username: u.username, nombre: u.nombre, cargo: u.cargo, dependencia: u.dependencia })),
        funcionarios: funcionariosDb,
        notificaciones: notifDb,
        auditoria: auditDb
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
        // Con margen: revocar en el mismo tick puede cancelar la descarga en
        // Safari (el blob todavía se está leyendo).
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }

      await registrarAuditoria({
        usuario: currentUser?.username || "Admin",
        dependencia: dependenciaActual,
        accion: "BACKUP_COMPLETO",
        entidad: "SISTEMA",
        entidadId: "BACKUP",
        detalles: { fecha: fechaStr, generadoPor: currentUser?.username }
      });

      notify(`Respaldo descargado: ${bienesDb.length} bienes, ${fc10Db.length} FC-10, ${auditDb.length} auditorías.`, "success");
    } catch (err) {
      console.error("Error al generar backup general:", err);
      // Un respaldo incompleto es peor que no tener respaldo: da falsa
      // confianza. Se dice qué tabla faltó para que se pueda reintentar.
      notify(`No se pudo generar el respaldo: ${err?.message || 'error desconocido'}.`, "error");
    } finally {
      setIsProcessing({ active: false, text: "" });
    }
  };

  const handleExportInventarioCSV = () => {
      if (filteredBienes.length === 0) return notify("No hay bienes para exportar", "warning");
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
          notify("Reporte Excel descargado exitosamente", "success");
      }, 100);
  };

  const handleExportInventarioExcel = () => {
      if (filteredBienes.length === 0) return notify("No hay bienes para exportar", "warning");
      if (!window.XLSX) return notify("Cargando librería Excel, intenta de nuevo...", "warning");
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
              notify("Excel generado exitosamente", "success");
          } catch (e) {
              notify("Error al generar el Excel.", "error");
          } finally {
              setIsProcessing({ active: false, text: '' });
          }
      }, 100);
  };

  const handleDownloadTemplateFuncionarios = () => {
      const csvContent = "\uFEFFCédula;Nombre Completo;Cargo\n1234567;Juan Pérez;Asistente Administrativo\n7654321;María Gómez;Directora de Área";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (window.saveAs) window.saveAs(blob, "Plantilla_Carga_Funcionarios.csv");
      notify("Plantilla CSV del padrón descargada", "success");
  };

  return {
    marcarBienConQR, handleDownloadLabelPNG, handleDownloadSimpleQR,
    handleBulkLabelPNGZip, handleBulkSimpleQRZip,
    handleGenerateFC04PDF, handleGenerateFC11PDF, handleGenerateFC10PDF,
    handleGenerateConsolidatedFC10PDF, handleExportFC10CSV, handleExportFC11CSV,
    handleDownloadTemplateCSV, handleExportBackupGeneral,
    handleExportInventarioCSV, handleExportInventarioExcel,
    handleDownloadTemplateFuncionarios
  };
}
