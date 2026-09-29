// Generar QR Simple
export const generateSimpleQR = async (bien, returnOnly = false) => {
  try {
    const textData = `UNP - PATRIMONIO\nROTULO: ${bien?.rotulo || 'S/R'}\nDESC: ${bien?.descripcion || ''}`;
    
    const dataUrl = await window.QRCode.toDataURL(textData, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    if (returnOnly) {
      return dataUrl;
    }

    if (window.saveAs) {
      const cleanRotulo = String(bien?.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, '');
      window.saveAs(dataUrl, `QR_Simple_${cleanRotulo}.png`);
    }

    return dataUrl;
  } catch (error) {
    console.error("Error generando QR simple:", error);
    throw error;
  }
};

// Generar Etiqueta Profesional Completa
export const generateProfessionalLabelPNG = async (bien, logoApp, returnOnly = false) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('UNIVERSIDAD NACIONAL DE PILAR', 30, 45);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CONTROL PATRIMONIAL OFICIAL', 30, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`RÓTULO: ${bien?.rotulo || 'S/R'}`, 30, 115);

    ctx.fillStyle = '#334155';
    ctx.font = '16px sans-serif';
    const desc = bien?.descripcion || 'Sin descripción';
    ctx.fillText(desc.length > 35 ? desc.substring(0, 35) + '...' : desc, 30, 150);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Resp: ${bien?.funcionario || 'Sin asignar'}`, 30, 185);
    ctx.fillText(`Ubic: ${bien?.ubicacion || 'Sin ubicación'}`, 30, 210);

    const qrDataUrl = await window.QRCode.toDataURL(bien?.rotulo || 'SR', { width: 160, margin: 1 });
    const qrImage = new Image();
    
    await new Promise((resolve) => {
      qrImage.onload = resolve;
      qrImage.src = qrDataUrl;
    });

    ctx.drawImage(qrImage, 410, 100, 160, 160);

    const finalDataUrl = canvas.toDataURL('image/png');

    if (returnOnly) {
      return finalDataUrl;
    }

    if (window.saveAs) {
      const cleanRotulo = String(bien?.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, '');
      window.saveAs(finalDataUrl, `Etiqueta_UNP_${cleanRotulo}.png`);
    }

    return finalDataUrl;
  } catch (error) {
    console.error("Error generando etiqueta completa:", error);
    throw error;
  }
};

// Construir documento PDF para FC-10 (Resuelve el error MISSING_EXPORT)
export const buildFC10PDFDoc = (fcsData, bienesData) => {
  const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
  const bienesAListar = Array.isArray(bienesData) ? bienesData : [bienesData];
  const fc = fcs[0] || {};
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const fechaDocumento = fc.entregadoFecha || fc.fechaGeneracion || new Date().toISOString().split('T')[0];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSIDAD NACIONAL DE PILAR", 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text("ACTA DE ASIGNACIÓN Y RESPONSABILIDAD (FC-10)", 105, 25, { align: 'center' });

  const tableRows = bienesAListar.map(b => [
    b.cuenta || '-',
    b.rotulo || '-',
    b.descripcion || '-',
    b.estadoConservacion || 'Bueno',
    `Gs. ${b.valorUnitario || '0'}`
  ]);

  doc.autoTable({
    startY: 35,
    head: [["Cuenta", "Rótulo", "Descripción", "Estado", "Valor"]],
    body: tableRows,
    theme: 'grid'
  });

  return { doc, fechaDocumento, fc };
};