import QRCode from 'qrcode';
export const buildFC10PDFDoc = (fcs, bienesAListar) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const fc = fcs[0];
    
    const dateStr = fc.entregadoFecha || fc.fechaGeneracion || new Date().toISOString().split('T')[0];
    const [year, monthNum] = dateStr.split('-');
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const monthName = monthNames[parseInt(monthNum, 10) - 1] || "ENERO";

    const formatCurrency = (val) => new Intl.NumberFormat('es-PY').format(val);
    const formatCI = (ci) => ci ? ci.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
    const formatDateText = (date) => {
        if (!date) return '';
        const parts = date.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return date;
    };

    const pages = ['ORIGINAL - DPTO. BIENES PATRIMONIALES', 'COPIA - FUNCIONARIO RESPONSABLE'];

    pages.forEach((pageTitle, index) => {
        if (index > 0) doc.addPage();
        
        let finalY = 12;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(pageTitle, pageWidth - 14, finalY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        finalY += 8;

        const logoImg = localStorage.getItem('logoOficial');
        if (logoImg) {
            try { doc.addImage(logoImg, 'PNG', 14, 13, 22, 22); } catch(e){}
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, finalY, { align: 'center' });
        finalY += 5;
        doc.setFontSize(10);
        doc.text("DIRECCIN DE CONTABILIDAD", pageWidth / 2, finalY, { align: 'center' });
        finalY += 5;
        doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, finalY, { align: 'center' });
        finalY += 8;
        doc.setFontSize(11);
        doc.text("FORMULARIO DE RESPONSABILIDAD INDIVIDUAL FC-10", pageWidth / 2, finalY, { align: 'center' });
        finalY += 6;
        doc.setFontSize(10);
        doc.text(`PERIODO DE ELABORACIN: ${monthName} ${year}`, pageWidth / 2, finalY, { align: 'center' });
        finalY += 8;

        doc.autoTable({
            startY: finalY,
            head: [[
                { content: "1. DATOS DE LA DEPENDENCIA ORGANIZACIONAL", styles: { halign: 'left' } },
                { content: "CDIGO", styles: { halign: 'center', cellWidth: 25 } }
            ]],
            body: [
                [`Institución (Entidad): UNIVERSIDAD NACIONAL DE PILAR`, fc.entidadCod || '28'],
                [`Unidad Jerárquica: ${fc.unidad || 'RECTORADO'}`, fc.unidadCod || '01'],
                [`Repartición Administrativa: ${fc.reparticion || 'DIRECCIN GENERAL DE ADMINISTRACIN Y FINANZAS'}`, fc.reparticionCod || '02'],
                [`Dependencia Específica: ${fc.dependenciaOrg || fc.dependencia || ''}`, fc.dependenciaCod || '02'],
                [`Área o Departamento: ${fc.area || 'DESPACHO DEL DIRECTOR/A'}`, fc.areaCod || '02']
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2 },
            bodyStyles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 2.5 },
            columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 4;

        doc.autoTable({
            startY: finalY,
            head: [[{ content: "2. DATOS DEL FUNCIONARIO RESPONSABLE", colSpan: 2, styles: { halign: 'left' } }]],
            body: [
                ["Nombre y Apellido:", fc.funcionarioNombre || ''],
                ["Cédula de Identidad N°:", formatCI(fc.funcionarioDoc) || ''],
                ["Cargo que desempeña:", fc.funcionarioCargo || 'Director/a']
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2 },
            bodyStyles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, cellPadding: 2.5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 4;

        const tableRows = bienesAListar.map((b) => {
            const valorNum = parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0;
            return [
                b.cuenta || '2.6.1',
                b.subcuenta || '05',
                b.analitico1 || '01',
                b.analitico2 || '01',
                b.descripcion || 'Sin descripción',
                b.rotulo || '-',
                '1',
                formatCurrency(valorNum),
                formatCurrency(valorNum)
            ];
        });

        doc.autoTable({
            startY: finalY,
            head: [[
                { content: "Cuenta", styles: { halign: 'center' } },
                { content: "SubCta.", styles: { halign: 'center' } },
                { content: "An.\n1", styles: { halign: 'center' } },
                { content: "An.\n2", styles: { halign: 'center' } },
                { content: "Descripción del Bien", styles: { halign: 'center' } },
                { content: "Rótulo / Código", styles: { halign: 'center' } },
                { content: "Cant.", styles: { halign: 'center' } },
                { content: "Precio\nUnit.", styles: { halign: 'center' } },
                { content: "Precio\nTotal", styles: { halign: 'center' } }
            ]],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7, lineColor: [0, 0, 0], lineWidth: 0.2, valign: 'middle' },
            bodyStyles: { fontSize: 7, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, valign: 'middle' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'center', cellWidth: 13 },
                2: { halign: 'center', cellWidth: 9 },
                3: { halign: 'center', cellWidth: 9 },
                4: { halign: 'left', cellWidth: 'auto' },
                5: { halign: 'center', cellWidth: 26 },
                6: { halign: 'center', cellWidth: 10 },
                7: { halign: 'center', cellWidth: 18 },
                8: { halign: 'center', cellWidth: 18, fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 4;

        const bienRef = bienesAListar[0] || {};
        doc.autoTable({
            startY: finalY,
            head: [["FECHA DE COMPRA", "ESTADO FÍSICO DEL BIEN", "ETIQUETA QR"]],
            body: [[
                formatDateText(bienRef.fechaAdquisicion) || '2025-07-31',
                (fc.estadoConservacion || bienRef.estadoConservacion || 'MUY BUENO').toUpperCase(),
                bienRef.hasQR ? 'CON CDIGO QR' : 'SIN CDIGO QR'
            ]],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center' },
            bodyStyles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center', cellPadding: 2.5 },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 4;

        doc.autoTable({
            startY: finalY,
            head: [["OBSERVACIONES ADICIONALES:"]],
            body: [[fc.observaciones || 'Ninguna.']],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'left' },
            bodyStyles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 18, valign: 'top' },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 4;

        doc.autoTable({
            startY: finalY,
            head: [["TIPO DE MOVIMIENTO", "LUGAR", "FECHA", "RECEPTOR (Solo si es devolución)"]],
            body: [
                ["ENTREGA", fc.entregadoLugar || 'Rectorado', formatDateText(fc.entregadoFecha || dateStr), fc.receptorEntrega || ''],
                ["DEVOLUCIN", fc.devolucionLugar || '', fc.devolucionFecha ? formatDateText(fc.devolucionFecha) : '', fc.devolucionReceptor || '']
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center' },
            bodyStyles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center', cellPadding: 2.5 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 6;

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        const disclaimer = "Con la firma del presente documento, el funcionario asume la total responsabilidad por la tenencia, uso y debida conservación del bien patrimonial detallado. Asimismo, se obliga a informar al Departamento de Bienes Patrimoniales sobre su renuncia, traslado o desvinculación del cargo, así como reportar inmediatamente cualquier daño, pérdida o hurto del bien asignado para su gestión, en estricto cumplimiento del Manual de Normas y Procedimientos para la Administración, Uso, Custodia, Clasificación y Contabilización de los Bienes del Estado del Ministerio de Economía y Finanzas.";
        const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 28);
        doc.text(disclaimerLines, 14, finalY);
        finalY += (disclaimerLines.length * 3.5) + 16;

        if (finalY > pageHeight - 35) {
            doc.addPage();
            finalY = 30;
        }

        const leftX = 25;
        doc.setLineWidth(0.3);
        doc.line(leftX, finalY, leftX + 70, finalY);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Firma del Funcionario Responsable", leftX + 35, finalY + 4, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.text(`Aclaración: ${fc.funcionarioNombre || ''}`, leftX, finalY + 9);
        doc.text(`C.I.: ${formatCI(fc.funcionarioDoc) || ''}`, leftX, finalY + 14);

        const rightX = pageWidth - 95;
        doc.line(rightX, finalY, rightX + 70, finalY);
        doc.setFont("helvetica", "bold");
        doc.text("Visto Bueno (Jefe Inmediato)", rightX + 35, finalY + 4, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.text("Aclaración:", rightX, finalY + 9);

    });

    return { doc, fechaDocumento: dateStr, fc };
};

// --- GENERADOR DE ETIQUETA PROFESIONAL PNG CON QR DINMICO ---
export const generateProfessionalLabelPNG = async (bien, logoUrl, returnOnly = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde exterior
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Cabecera institucional
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(14, 14, canvas.width - 28, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNIVERSIDAD NACIONAL DE PILAR', canvas.width / 2, 40);
    ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
    ctx.fillText('DEPARTAMENTO DE BIENES PATRIMONIALES', canvas.width / 2, 60);

    // Datos del bien
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.fillText(`RÓTULO: ${bien.rotulo || 'S/RÓTULO'}`, 32, 118);

    ctx.font = '11px Helvetica, Arial, sans-serif';
    const descText = bien.descripcion || 'Sin descripción';
    ctx.fillText(`DESCRIPCIÓN: ${descText.length > 42 ? descText.substring(0, 42) + '...' : descText}`, 32, 148);
    ctx.fillText(`CUENTA: ${bien.cuenta || 'N/D'}`, 32, 178);
    ctx.fillText(`ESTADO: ${(bien.estadoConservacion || 'Bueno').toUpperCase()}`, 32, 208);
    ctx.fillText(`UBICACIÓN: ${(bien.ubicacion || 'Sin asignar').substring(0, 32)}`, 32, 238);
    ctx.fillText(`RESPONSABLE: ${(bien.funcionario || 'Sin custodio').substring(0, 30)}`, 32, 268);

    // Generar e incrustar QR dinmico
    const qrTargetValue = bien.id || bien.rotulo || 'UNP';
    const qrUrl = `${window.location.origin}/?id=${encodeURIComponent(qrTargetValue)}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 140,
            color: { dark: '#000000', light: '#ffffff' }
        });

        await new Promise((resolve) => {
            const qrImg = new Image();
            qrImg.onload = () => {
                ctx.drawImage(qrImg, 420, 105, 140, 140);
                resolve();
            };
            qrImg.onerror = resolve;
            qrImg.src = qrDataUrl;
        });
    } catch (e) {
        console.error("Error al renderizar código QR en etiqueta:", e);
    }

    // Pie institucional
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(14, 322, canvas.width - 28, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SISTEMA INTEGRADO DE GESTIÓN PATRIMONIAL', canvas.width / 2, 348);

    const dataUrl = canvas.toDataURL('image/png');
    if (returnOnly) return dataUrl;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Etiqueta_${bien.rotulo || 'patrimonio'}.png`;
    link.click();
    return dataUrl;
};

// --- GENERADOR DE QR SIMPLE REAL Y DINMICO ---
export const generateSimpleQR = async (bien, returnOnly = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Marco exterior sutil
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Encabezado
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNP - PATRIMONIO', canvas.width / 2, 38);

    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.fillText(`RÓTULO: ${bien.rotulo || 'S/R'}`, canvas.width / 2, 58);

    // Generar código QR dinmico con el link real
    const qrTargetValue = bien.id || bien.rotulo || 'UNP';
    const qrUrl = `${window.location.origin}/?id=${encodeURIComponent(qrTargetValue)}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 220,
            color: { dark: '#000000', light: '#ffffff' }
        });

        await new Promise((resolve) => {
            const qrImg = new Image();
            qrImg.onload = () => {
                ctx.drawImage(qrImg, 50, 75, 220, 220);
                resolve();
            };
            qrImg.onerror = resolve;
            qrImg.src = qrDataUrl;
        });
    } catch (e) {
        console.error("Error al renderizar código QR simple:", e);
    }

    // Pie
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Escanee para verificar en el sistema', canvas.width / 2, 325);

    const dataUrl = canvas.toDataURL('image/png');
    if (returnOnly) return dataUrl;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${bien.rotulo || 'patrimonio'}.png`;
    link.click();
    return dataUrl;
};
