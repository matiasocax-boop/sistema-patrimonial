// --- EN pdfGenerators.js ---

export const generateSimpleQR = async (bien, returnOnly = false) => {
  try {
    const textData = `UNP - PATRIMONIO\nROTULO: ${bien.rotulo || 'S/R'}\nDESC: ${bien.descripcion || ''}`;
    
    const dataUrl = await window.QRCode.toDataURL(textData, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    if (returnOnly) {
      return dataUrl; // Devuelve la imagen para la vista previa en el modal sin descargar
    }

    if (window.saveAs) {
      const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, '');
      window.saveAs(dataUrl, `QR_Simple_${cleanRotulo}.png`);
    }

    return dataUrl;
  } catch (error) {
    console.error("Error generando QR simple:", error);
    throw error;
  }
};

export const generateProfessionalLabelPNG = async (bien, logoApp, returnOnly = false) => {
  try {
    // ... Código de renderizado del canvas ...

    const finalDataUrl = canvas.toDataURL('image/png');

    if (returnOnly) {
      return finalDataUrl; // Devuelve la imagen para la vista previa en el modal sin descargar
    }

    if (window.saveAs) {
      const cleanRotulo = String(bien.rotulo || 'SR').replace(/[^a-zA-Z0-9]/g, '');
      window.saveAs(finalDataUrl, `Etiqueta_UNP_${cleanRotulo}.png`);
    }

    return finalDataUrl;
  } catch (error) {
    console.error("Error generando etiqueta completa:", error);
    throw error;
  }
};
// Construir documento PDF para FC-10
export const buildFC10PDFDoc = (fcsData, bienesData) => {
  const fcs = Array.isArray(fcsData) ? fcsData : [fcsData];
  const bienesAListar = Array.isArray(bienesData) ? bienesData : [bienesData];
  const fc = fcs[0] || {};
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const fechaDocumento = fc.entregadoFecha || fc.fechaGeneracion || new Date().toISOString().split('T')[0];

  // Configuración de encabezado y datos FC-10
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSIDAD NACIONAL DE PILAR", 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text("ACTA DE ASIGNACIÓN Y RESPONSABILIDAD (FC-10)", 105, 25, { align: 'center' });

  // Tabla con bienes
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