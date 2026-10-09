export const buildFC10PDFDoc = (fcs, bienesAListar) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const fc = fcs[0];
    
    // Fechas y formateos base
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

    let finalY = 12;

    // --- 1. CABECERA INSTITUCIONAL ---
    const logoImg = localStorage.getItem('logoOficial');
    if (logoImg) {
        try { doc.addImage(logoImg, 'PNG', 14, 10, 18, 18); } catch(e){}
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("UNIVERSIDAD NACIONAL DE PILAR", pageWidth / 2, finalY, { align: 'center' });
    finalY += 4.5;
    doc.setFontSize(8.5);
    doc.text("DIRECCIÓN DE CONTABILIDAD", pageWidth / 2, finalY, { align: 'center' });
    finalY += 4.5;
    doc.text("DEPARTAMENTO DE BIENES PATRIMONIALES", pageWidth / 2, finalY, { align: 'center' });
    finalY += 5.5;
    doc.setFontSize(10);
    doc.text("FORMULARIO DE RESPONSABILIDAD INDIVIDUAL FC-10", pageWidth / 2, finalY, { align: 'center' });
    finalY += 5;
    doc.setFontSize(8.5);
    doc.text(`PERIODO DE ELABORACIÓN: ${monthName} ${year}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 8;

    // --- 2. SECCIÓN 1: DATOS ORGANIZACIONALES ---
    doc.setFillColor(240, 240, 240);
    doc.rect(14, finalY, pageWidth - 28, 5.5, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("1. DATOS DE LA DEPENDENCIA ORGANIZACIONAL", 16, finalY + 3.8);
    doc.text("CÓDIGO", pageWidth - 32, finalY + 3.8);
    finalY += 5.5;

    doc.autoTable({
        startY: finalY,
        body: [
            [`Institución (Entidad): ${fc.entidad || 'UNIVERSIDAD NACIONAL DE PILAR'}`, fc.entidadCod || '28'],
            [`Unidad Jerárquica: ${fc.unidad || 'RECTORADO'}`, fc.unidadCod || '01'],
            [`Repartición Administrativa: ${fc.reparticion || 'DIRECCIÓN GENERAL DE ADMINISTRACIÓN Y FINANZAS'}`, fc.reparticionCod || '02'],
            [`Dependencia Específica: ${fc.dependenciaOrg || fc.dependencia || ''}`, fc.dependenciaCod || '02'],
            [`Área o Departamento: ${fc.area || 'DESPACHO'}`, fc.areaCod || '02']
        ],
        theme: 'plain',
        styles: { fontSize: 7.5, cellPadding: 1, textColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: pageWidth - 46 },
            1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 3;

    // --- 3. SECCIÓN 2: DATOS DEL FUNCIONARIO ---
    doc.setFillColor(240, 240, 240);
    doc.rect(14, finalY, pageWidth - 28, 5.5, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("2. DATOS DEL FUNCIONARIO RESPONSABLE", 16, finalY + 3.8);
    finalY += 5.5;

    doc.autoTable({
        startY: finalY,
        body: [
            ["Nombre y Apellido:", fc.funcionarioNombre || ''],
            ["Cédula de Identidad N°:", formatCI(fc.funcionarioDoc) || ''],
            ["Cargo que desempeña:", fc.funcionarioCargo || '']
        ],
        theme: 'plain',
        styles: { fontSize: 7.5, cellPadding: 1, textColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 42, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 3;

    // --- 4. TABLA DE BIENES (Formato oficial con Cuenta, SubCta, An.1, An.2) ---
    let totalValor = 0;
    const tableRows = bienesAListar.map((b) => {
        const valorNum = parseInt(String(b.valorUnitario || '0').replace(/\D/g, ''), 10) || 0;
        totalValor += valorNum;
        
        return [
            b.cuenta || '-',
            b.subcuenta || '-',
            b.analitico1 || '-',
            b.analitico2 || '-',
            b.descripcion || '-',
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
            { content: "An. 1", styles: { halign: 'center' } },
            { content: "An. 2", styles: { halign: 'center' } },
            { content: "Descripción del Bien", styles: { halign: 'center' } },
            { content: "Rótulo / Código", styles: { halign: 'center' } },
            { content: "Cant.", styles: { halign: 'center' } },
            { content: "Precio Unit.", styles: { halign: 'center' } },
            { content: "Precio Total", styles: { halign: 'center' } }
        ]],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 6.5, lineWidth: 0.1, lineColor: [150, 150, 150] },
        bodyStyles: { fontSize: 6.5, lineWidth: 0.1, lineColor: [150, 150, 150], textColor: [0, 0, 0] },
        columnStyles: {
            0: { halign: 'center', cellWidth: 16 },
            1: { halign: 'center', cellWidth: 13 },
            2: { halign: 'center', cellWidth: 10 },
            3: { halign: 'center', cellWidth: 10 },
            4: { cellWidth: 'auto' },
            5: { halign: 'center', cellWidth: 24 },
            6: { halign: 'center', cellWidth: 10 },
            7: { halign: 'right', cellWidth: 20 },
            8: { halign: 'right', cellWidth: 20 }
        },
        margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 3;

    // --- 5. BLOQUE DE FECHA DE COMPRA, ESTADO Y QR ---
    const bienRef = bienesAListar[0] || {};
    doc.autoTable({
        startY: finalY,
        head: [["FECHA DE COMPRA", "ESTADO FÍSICO DEL BIEN", "ETIQUETA QR"]],
        body: [[
            formatDateText(bienRef.fechaAdquisicion) || '-',
            (fc.estadoConservacion || bienRef.estadoConservacion || 'MUY BUENO').toUpperCase(),
            bienRef.hasQR ? 'CON CÓDIGO QR' : 'SIN CÓDIGO QR'
        ]],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 6.5, lineWidth: 0.1, lineColor: [150, 150, 150], halign: 'center' },
        bodyStyles: { fontSize: 7, halign: 'center', lineWidth: 0.1, lineColor: [150, 150, 150], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 3;

    // --- 6. OBSERVACIONES ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("OBSERVACIONES ADICIONALES:", 14, finalY);
    finalY += 3.5;
    doc.setFont("helvetica", "normal");
    const obsText = fc.observaciones || 'Ninguna.';
    const splitObs = doc.splitTextToSize(obsText, pageWidth - 28);
    doc.text(splitObs, 14, finalY);
    finalY += (splitObs.length * 3.5) + 3;

    // --- 7. TIPO DE MOVIMIENTO ---
    doc.autoTable({
        startY: finalY,
        head: [["TIPO DE MOVIMIENTO", "LUGAR", "FECHA", "RECEPTOR (Solo si es devolución)"]],
        body: [
            ["ENTREGA", fc.entregadoLugar || 'Rectorado', formatDateText(fc.entregadoFecha || dateStr), fc.receptorEntrega || ''],
            ["DEVOLUCIÓN", fc.devolucionLugar || '', fc.devolucionFecha ? formatDateText(fc.devolucionFecha) : '', fc.devolucionReceptor || '']
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 6.5, lineWidth: 0.1, lineColor: [150, 150, 150], halign: 'left' },
        bodyStyles: { fontSize: 7, lineWidth: 0.1, lineColor: [150, 150, 150], textColor: [0, 0, 0] },
        margin: { left: 14, right: 14 }
    });
    finalY = doc.lastAutoTable.finalY + 4;

    // --- 8. TEXTO LEGAL Y DECLARACIÓN ---
    doc.setFontSize(6.5);
    doc.setTextColor(50, 50, 50);
    const disclaimer = "Con la firma del presente documento, el funcionario asume la total responsabilidad por la tenencia, uso y debida conservación del bien patrimonial detallado. Asimismo, se obliga a informar al Departamento de Bienes Patrimoniales sobre su renuncia, traslado o desvinculación del cargo, así como reportar inmediatamente cualquier daño, pérdida o hurto del bien asignado para su gestión, en estricto cumplimiento del Manual de Normas y Procedimientos para la Administración, Uso, Custodia, Clasificación y Contabilización de los Bienes del Estado del Ministerio de Economía y Finanzas.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 28);
    doc.text(disclaimerLines, 14, finalY);
    finalY += (disclaimerLines.length * 3) + 14;

    // Control de salto de página para firmas
    if (finalY > pageHeight - 32) {
        doc.addPage();
        finalY = 30;
    }

    // --- 9. CUADRO DE FIRMAS ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    
    // Firma Funcionario (Izquierda)
    const leftX = 20;
    doc.line(leftX, finalY, leftX + 70, finalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Firma del Funcionario Responsable", leftX + 35, finalY + 4, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text(`Aclaración: ${fc.funcionarioNombre || ''}`, leftX, finalY + 8.5);
    doc.text(`C.I.: ${formatCI(fc.funcionarioDoc) || ''}`, leftX, finalY + 12.5);

    // Visto Bueno Jefe Inmediato (Derecha)
    const rightX = pageWidth - 90;
    doc.line(rightX, finalY, rightX + 70, finalY);
    doc.setFont("helvetica", "bold");
    doc.text("Visto Bueno (Jefe Inmediato)", rightX + 35, finalY + 4, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text("Aclaración: .....................................................", rightX, finalY + 8.5);

    return { doc, fechaDocumento: dateStr, fc };
};