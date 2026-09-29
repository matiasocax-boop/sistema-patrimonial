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