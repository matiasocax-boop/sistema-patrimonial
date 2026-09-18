// src/utils/pdfGenerators.js
import { formatCurrency, formatCI, formatDateText, getEstadoAbbr, getPlaceholderLogo } from './helpers';

export const generateSimpleQR = async (bien) => { 
    const cuentaCompleta = [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('-');
    const qrText = `CÓDIGO: ${bien.rotulo||''}\nCTA: ${cuentaCompleta}\nDESC: ${bien.descripcion||''}\nADQ: ${bien.fechaAdquisicion||''}\nVALOR: Gs. ${formatCurrency(bien.valorUnitario)}\nPROPIEDAD UNP - PARAGUAY`;
    try {
        if (window.QRCode) {
            return await window.QRCode.toDataURL(qrText, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
        }
        return '';
    } catch (err) { console.error("Error generando QR", err); return ''; }
};

export const generateProfessionalLabelPNG = async (bien, appLogoStr) => {
    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 732;
        canvas.height = 1181;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;

        const headerHeight = 220;
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, headerHeight);

        ctx.beginPath();
        ctx.moveTo(0, headerHeight);
        ctx.lineTo(canvas.width, headerHeight);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#cccccc';
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let textX = canvas.width / 2;
        let textSpace = canvas.width;
        const logoSize = 130;
        const logoPadding = 40;

        if (appLogoStr) {
            textX = (canvas.width + logoSize + logoPadding) / 2;
            textSpace = canvas.width - logoSize - logoPadding * 2;
        }

        ctx.font = 'bold 36px Arial';
        ctx.fillText('UNIVERSIDAD NACIONAL', textX, 70, textSpace);
        ctx.font = '900 44px Arial';
        ctx.fillText('DE PILAR', textX, 120, textSpace);

        ctx.fillStyle = '#cc0000';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('DPTO. DE BIENES PATRIMONIALES', textX, 175, textSpace);
        
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        const rotuloText = bien.rotulo || 'S/R';
        let codigoFontSize = 72;
        if (rotuloText.length > 12) codigoFontSize = 60;
        if (rotuloText.length > 16) codigoFontSize = 50;

        ctx.font = `900 ${codigoFontSize}px Arial`;
        ctx.fillText(rotuloText, canvas.width / 2, headerHeight + 80, canvas.width - 60);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText('CÓDIGO PATRIMONIAL', canvas.width / 2, headerHeight + 25);

        const qrDataUrl = await generateSimpleQR(bien);
        const qrImg = new Image();
        qrImg.crossOrigin = "Anonymous";
        qrImg.onload = () => {
            const qrSize = 560;
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;
            ctx.drawImage(qrImg, (canvas.width - qrSize) / 2, headerHeight + 140, qrSize, qrSize);
            
            ctx.shadowColor = 'transparent';

            const footerY = canvas.height - 240;
            const cuentaCompleta = [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('-');
            
            ctx.fillStyle = '#f0f2f5';
            ctx.beginPath();
            ctx.roundRect((canvas.width - 400) / 2, footerY - 10, 400, 60, 10);
            ctx.fill();

            ctx.fillStyle = '#333333';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`CTA: ${cuentaCompleta || 'N/A'}`, canvas.width / 2, footerY + 20);

            ctx.beginPath();
            ctx.moveTo(40, footerY + 80);
            ctx.lineTo(canvas.width - 40, footerY + 80);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#e0e0e0';
            ctx.stroke();

            ctx.fillStyle = '#cc0000';
            ctx.font = '900 36px Arial';
            ctx.fillText('PROPIEDAD DE LA UNP', canvas.width / 2, footerY + 130);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 26px Arial';
            ctx.fillText('Bienes del Estado Paraguayo', canvas.width / 2, footerY + 180);
            
            ctx.font = 'italic 18px Arial';
            ctx.fillStyle = '#888888';
            const today = new Date().toLocaleDateString('es-PY');
            ctx.fillText(`Emitido: ${today}`, canvas.width / 2, footerY + 220);

            if (appLogoStr) {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                logoImg.onload = () => {
                    ctx.drawImage(logoImg, logoPadding, (headerHeight - logoSize) / 2, logoSize, logoSize); 
                    resolve(canvas.toDataURL('image/png'));
                };
                logoImg.onerror = () => resolve(canvas.toDataURL('image/png'));
                logoImg.src = appLogoStr;
            } else {
                resolve(canvas.toDataURL('image/png'));
            }
        };
        qrImg.src = qrDataUrl;
    });
};

export const buildFC10PDFDoc = (fcs, bienesAListar, dependenciaActual, appLogo, pdfPaperSize) => {
    const fc = fcs[0]; 
    const { jsPDF } = window.jspdf; 
    const doc = new jsPDF('p', 'mm', pdfPaperSize); 
    const pageWidth = doc.internal.pageSize.width; 
    const pageHeight = doc.internal.pageSize.height;
    
    const LOGOS_DEPENDENCIAS = {
        "Rectorado": { principal: "/publiclogo_unp.png", secundario: null },
        "Facultad de Ciencias Aplicadas": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_aplicadas.png" },
        "Facultad de Humanidades y Ciencias de la Educación": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_humanidades.png" },
        "Facultad de Ciencias Contables, Administrativas y Económicas": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_contables.png" },
        "Facultad de Derecho, Ciencias Políticas y Sociales": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_derecho.png" },
        "Facultad de Ciencias Agropecuarias y Desarrollo Rural": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_agro.png" },
        "Facultad de Ciencias Biomédicas": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_biomedicas.png" },
        "Facultad de Ciencias, Tecnologías y Artes": { principal: "/publiclogo_unp.png", secundario: "/publiclogo_cta.png" }
    };
    const logosActivos = LOGOS_DEPENDENCIAS[dependenciaActual] || { principal: "/publiclogo_unp.png", secundario: null };

    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]; 
    const todayStr = new Date().toISOString().split('T')[0];
    const fechaDocumento = fc.entregadoFecha || fc.fechaGeneracion || todayStr; 
    let gYear = "2024", gMonth = "01";
    if (fechaDocumento && fechaDocumento.includes('-')) {
        const parts = fechaDocumento.split('-');
        gYear = parts[0];
        gMonth = parts[1];
    }

    doc.addImage(logosActivos.principal, 'PNG', 14, 10, 20, 20);
    if (logosActivos.secundario) {
        doc.addImage(logosActivos.secundario, 'PNG', pageWidth - 34, 10, 20, 20);
    }

    doc.setFont("helvetica", "bold"); 
    doc.setFontSize(12); 
    doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, 14, { align: 'center' }); 
    doc.setFontSize(9); 
    doc.text("DIRECCIÓN DE CONTABILIDAD — DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, 19, { align: 'center' }); 

    doc.setFontSize(11); 
    doc.text("FORMULARIO DE RESPONSABILIDAD INDIVIDUAL FC-10", pageWidth / 2, 27, { align: 'center' });
    doc.setFontSize(9); 
    doc.text(`PERIODO DE ELABORACIÓN: ${monthNames[parseInt(gMonth)-1] || ''} ${gYear}`, pageWidth / 2, 33, { align: 'center' });
    
    let finalY = 38;

    doc.autoTable({ startY: finalY, theme: 'grid', rowPageBreak: 'avoid', margin: { bottom: 30 }, body: [ [{ content: '1. DATOS DE LA DEPENDENCIA ORGANIZACIONAL', styles: { fillColor: [248, 249, 250], fontStyle: 'bold', textColor: [32,33,36] } }, { content: 'CÓDIGO', styles: { fillColor: [248, 249, 250], fontStyle: 'bold', halign: 'center', textColor: [32,33,36] } }], [`Institución (Entidad): UNIVERSIDAD NACIONAL DE PILAR`, `28`], [`Unidad Jerárquica: ${fc.unidad || ''}`, `${fc.unidadCod || ''}`], [`Repartición Administrativa: ${fc.reparticion || ''}`, `${fc.reparticionCod || ''}`], [`Dependencia Específica: ${fc.dependenciaOrg || ''}`, `${fc.dependenciaCod || ''}`], [`Área o Departamento: ${fc.area || ''}`, `${fc.areaCod || ''}`] ], styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, columnStyles: { 1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' } } }); finalY = doc.lastAutoTable.finalY + 4;

    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    doc.autoTable({ startY: finalY, theme: 'grid', rowPageBreak: 'avoid', margin: { bottom: 30 }, body: [ [{ content: '2. DATOS DEL FUNCIONARIO RESPONSABLE', colSpan: 2, styles: { fillColor: [248, 249, 250], fontStyle: 'bold', textColor: [32,33,36] } }], ["Nombre y Apellido:", fc.funcionarioNombre || ''], ["Cédula de Identidad N°:", formatCI(fc.funcionarioDoc || '')], ["Cargo que desempeña:", fc.funcionarioCargo || ''] ], styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' } } }); finalY = doc.lastAutoTable.finalY + 4;

    const tableRows = fcs.map((fcItem, idx) => { const b = bienesAListar[idx] || {}; const cuentaFull = [b.cuenta, b.subcuenta, b.analitico1, b.analitico2].filter(Boolean).join('-'); return [ cuentaFull || '-', b.rotulo || '-', b.descripcion || '-', formatDateText(b.fechaAdquisicion) || '-', (fcItem.estadoConservacion || b.estadoConservacion || '-').toUpperCase(), b.hasQR ? 'SÍ' : 'NO', formatCurrency(fcItem.valorTotal || b.valorUnitario) ]; });
    const totalGral = fcs.reduce((acc, fcItem, idx) => { const v = String(fcItem.valorTotal || bienesAListar[idx]?.valorUnitario || 0).replace(/\D/g, ''); return acc + (parseInt(v, 10) || 0); }, 0); tableRows.push([{content: `TOTAL GENERAL (${fcs.length} bienes)`, colSpan: 6, styles: {halign: 'right', fontStyle: 'bold'}}, {content: formatCurrency(totalGral), styles: {fontStyle: 'bold', halign: 'right'}}]);

    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    doc.autoTable({ startY: finalY, theme: 'grid', head: [["Cuenta Contable", "Rótulo / Código", "Descripción del Bien", "Fecha de Adquisición", "Estado Físico", "QR", "Valor Unitario (Gs.)"]], body: tableRows, rowPageBreak: 'avoid', margin: { bottom: 30 }, styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 }, headStyles: { fillColor: [248, 249, 250], fontStyle: 'bold', halign: 'center', textColor: [32,33,36] }, alternateRowStyles: { fillColor: [250, 252, 253] }, columnStyles: { 0: { halign: 'center', cellWidth: 30 }, 1: { halign: 'center', cellWidth: 24 }, 2: { cellWidth: 'auto' }, 3: { halign: 'center', cellWidth: 28 }, 4: { halign: 'center', cellWidth: 22 }, 5: { halign: 'center', cellWidth: 9 }, 6: { halign: 'right', fontStyle: 'bold', cellWidth: 28 } } }); finalY = doc.lastAutoTable.finalY + 4;

    if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text("Observaciones:", 14, finalY); finalY += 5; doc.setFont("helvetica", "normal"); doc.text(fc.observaciones || 'Ninguna.', 14, finalY, { maxWidth: pageWidth - 28, align: 'justify' }); finalY += 6;

    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    doc.autoTable({ startY: finalY, theme: 'grid', rowPageBreak: 'avoid', margin: { bottom: 30 }, head: [["TIPO DE MOVIMIENTO", "LUGAR", "FECHA", "RECEPTOR (Solo si es devolución)"]], body: [ ["ENTREGA", fc.entregadoLugar || '-', formatDateText(fc.entregadoFecha) || '-', ''], ["DEVOLUCIÓN", fc.devolucionLugar || '', formatDateText(fc.devolucionFecha) || '', fc.devolucionReceptor ? `${fc.devolucionReceptor} - ${fc.devolucionCargoReceptor}` : ''] ], styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center' }, headStyles: { fillColor: [248, 249, 250], fontStyle: 'bold', textColor: [32,33,36] }, columnStyles: { 0: { fontStyle: 'bold' } } }); finalY = doc.lastAutoTable.finalY + 8;

    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text("Con la firma del presente documento, el funcionario asume la total responsabilidad por la tenencia, uso y debida conservación del bien patrimonial detallado. Asimismo, se obliga a informar al Departamento de Bienes Patrimoniales sobre su renuncia, traslado o desvinculación del cargo, así como reportar inmediatamente cualquier daño, pérdida o hurto del bien asignado para su gestión, en estricto cumplimiento del Manual de Normas y Procedimientos para la Administración, Uso, Custodia, Clasificación y Contabilización de los Bienes del Estado del Ministerio de Economía y Finanzas.", 14, finalY, { maxWidth: pageWidth - 28, align: 'justify', lineHeightFactor: 1.5 });
    
    if (finalY > pageHeight - 60) { doc.addPage(); finalY = 30; } else { finalY += 35; }
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4); doc.line(20, finalY, 90, finalY); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("Firma del Funcionario Responsable", 55, finalY + 5, { align: 'center' }); doc.setFont("helvetica", "normal"); doc.text(`Aclaración: ${fc.funcionarioNombre || ''}`, 20, finalY + 10); doc.text(`C.I.: ${formatCI(fc.funcionarioDoc || '')}`, 20, finalY + 15);
    doc.line(120, finalY, 190, finalY); doc.setFont("helvetica", "bold"); doc.text("Visto Bueno (Jefe Inmediato)", 155, finalY + 5, { align: 'center' }); doc.setFont("helvetica", "normal"); doc.text("Aclaración:", 120, finalY + 10);

    return { doc, fechaDocumento, fc };
};