// src/utils/pdfGenerators.js
import { formatCurrency, formatCI, formatDateText, getEstadoAbbr, getPlaceholderLogo } from './helpers';

// --- QR DINÁMICO (Apunta a la URL del sistema con el ID del bien) ---
export const generateSimpleQR = async (bien) => { 
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const qrText = `${baseUrl}/?bienId=${bien.id}`;
    
    try {
        if (window.QRCode) {
            return await window.QRCode.toDataURL(qrText, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
        }
        return '';
    } catch (err) { console.error("Error generando QR", err); return ''; }
};

// --- ETIQUETA GRANDE (62x100mm - Vertical) ---
export const generateProfessionalLabelPNG = async (bien, appLogoStr) => {
    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1290;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 16;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

        const headerHeight = 240;
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(16, 16, canvas.width - 32, headerHeight - 16);

        ctx.beginPath();
        ctx.moveTo(16, headerHeight);
        ctx.lineTo(canvas.width - 16, headerHeight);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let textX = canvas.width / 2;
        let textSpace = canvas.width - 40;
        const logoSize = 160;
        const logoPadding = 50;

        if (appLogoStr) {
            textX = (canvas.width + logoSize + logoPadding) / 2;
            textSpace = canvas.width - logoSize - logoPadding * 2;
        }

        ctx.font = '900 38px Arial';
        ctx.fillText('UNIVERSIDAD NACIONAL', textX, 80, textSpace);
        ctx.font = '900 48px Arial';
        ctx.fillText('DE PILAR', textX, 135, textSpace);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('DPTO. DE BIENES PATRIMONIALES', textX, 195, textSpace);
        
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        const rotuloText = bien.rotulo || 'S/R';
        let codigoFontSize = 90;
        if (rotuloText.length > 10) codigoFontSize = 75;
        if (rotuloText.length > 14) codigoFontSize = 60;

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#444444';
        ctx.fillText('CÓDIGO PATRIMONIAL', canvas.width / 2, headerHeight + 35);

        ctx.fillStyle = '#000000';
        ctx.font = `900 ${codigoFontSize}px Arial`;
        ctx.fillText(rotuloText, canvas.width / 2, headerHeight + 100, canvas.width - 60);

        const qrDataUrl = await generateSimpleQR(bien);
        const qrImg = new Image();
        qrImg.crossOrigin = "Anonymous";
        qrImg.onload = () => {
            const qrSize = 500;
            const qrY = headerHeight + 140;
            ctx.drawImage(qrImg, (canvas.width - qrSize) / 2, qrY, qrSize, qrSize);
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 26px Arial';
            
            let custodioTexto = `Custodio: ${bien.funcionario || 'Sin Asignar'}`;
            if (custodioTexto.length > 48) custodioTexto = custodioTexto.substring(0, 45) + '...';
            
            let ubicacionTexto = `Ubicación: ${bien.ubicacion || 'Sin Ubicación'}`;
            if (ubicacionTexto.length > 48) ubicacionTexto = ubicacionTexto.substring(0, 45) + '...';

            const textoY = qrY + qrSize + 40;
            ctx.fillText(custodioTexto, canvas.width / 2, textoY);
            ctx.fillText(ubicacionTexto, canvas.width / 2, textoY + 40);

            const ctaBoxY = textoY + 90;
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect((canvas.width - 500) / 2, ctaBoxY, 500, 70, 15);
            ctx.fill();

            const cuentaCompleta = [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('-');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`CTA: ${cuentaCompleta || 'N/A'}`, canvas.width / 2, ctaBoxY + 35);

            ctx.beginPath();
            ctx.moveTo(50, ctaBoxY + 110);
            ctx.lineTo(canvas.width - 50, ctaBoxY + 110);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.font = '900 42px Arial';
            ctx.fillText('CONTROL PATRIMONIAL', canvas.width / 2, ctaBoxY + 160);

            ctx.font = 'bold 28px Arial';
            ctx.fillText('Uso Exclusivo Institucional', canvas.width / 2, ctaBoxY + 210);
            
            if (appLogoStr) {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                logoImg.onload = () => {
                    ctx.drawImage(logoImg, logoPadding, (headerHeight - logoSize) / 2 + 10, logoSize, logoSize); 
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

// --- ETIQUETA PEQUEÑA (29x90.3mm - Horizontal) ---
export const generateSmallLabelPNG = async (bien, appLogoStr) => {
    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 903;
        canvas.height = 290;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        const qrDataUrl = await generateSimpleQR(bien);
        const qrImg = new Image();
        qrImg.crossOrigin = "Anonymous";
        qrImg.onload = () => {
            const qrSize = 250;
            ctx.drawImage(qrImg, 20, 20, qrSize, qrSize);

            // Línea separadora
            ctx.beginPath();
            ctx.moveTo(285, 20);
            ctx.lineTo(285, 270);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            const textX = 310;
            const maxW = 460;

            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            ctx.font = '900 24px Arial';
            ctx.fillText('UNIVERSIDAD NACIONAL DE PILAR', textX, 25, maxW);
            
            ctx.font = 'bold 18px Arial';
            ctx.fillText('CONTROL PATRIMONIAL', textX, 55, maxW);

            const rotuloText = bien.rotulo || 'S/R';
            let rSize = 65;
            if (rotuloText.length > 10) rSize = 50;
            ctx.font = `900 ${rSize}px Arial`;
            ctx.fillText(rotuloText, textX, 85, maxW);

            const cuentaCompleta = [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('-');
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect(textX, 160, 280, 40, 8);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(`CTA: ${cuentaCompleta || 'N/A'}`, textX + 15, 180, 250);

            ctx.fillStyle = '#000000';
            ctx.textBaseline = 'top';
            ctx.font = 'bold 20px Arial';
            
            let custodio = bien.funcionario || 'Sin Asignar';
            if(custodio.length > 35) custodio = custodio.substring(0, 32) + '...';
            ctx.fillText(`Resp: ${custodio}`, textX, 215, 560);
            
            let ubicacion = bien.ubicacion || 'Sin Ubicación';
            if(ubicacion.length > 35) ubicacion = ubicacion.substring(0, 32) + '...';
            ctx.fillText(`Ubic: ${ubicacion}`, textX, 245, 560);

            if (appLogoStr) {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                logoImg.onload = () => {
                    const logoSize = 100;
                    ctx.drawImage(logoImg, canvas.width - logoSize - 25, 25, logoSize, logoSize);
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

// --- GENERADOR DE PDF FC-10 ---
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