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

// Generar Etiqueta Profesional Completa
export const generateProfessionalLabelPNG = async (bien, logoApp, returnOnly = false) => {
  try {
    // 1. Declaración e inicialización del canvas (ESTA LÍNEA FALTABA O ESTABA ABAJO)
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // 2. Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde azul
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Encabezado
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('UNIVERSIDAD NACIONAL DE PILAR', 30, 45);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CONTROL PATRIMONIAL OFICIAL', 30, 70);

    // Rótulo
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`RÓTULO: ${bien?.rotulo || 'S/R'}`, 30, 115);

    // Descripción
    ctx.fillStyle = '#334155';
    ctx.font = '16px sans-serif';
    const desc = bien?.descripcion || 'Sin descripción';
    ctx.fillText(desc.length > 35 ? desc.substring(0, 35) + '...' : desc, 30, 150);

    // Ubicación y Custodio
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Resp: ${bien?.funcionario || 'Sin asignar'}`, 30, 185);
    ctx.fillText(`Ubic: ${bien?.ubicacion || 'Sin ubicación'}`, 30, 210);

    // Generar el código QR incrustado a la derecha
    const qrDataUrl = await window.QRCode.toDataURL(bien?.rotulo || 'SR', { width: 160, margin: 1 });
    const qrImage = new Image();
    
    await new Promise((resolve) => {
      qrImage.onload = resolve;
      qrImage.src = qrDataUrl;
    });

    ctx.drawImage(qrImage, 410, 100, 160, 160);

    const finalDataUrl = canvas.toDataURL('image/png');

    // Si solo pedimos previsualización (returnOnly = true), devolvemos la imagen sin descargar
    if (returnOnly) {
      return finalDataUrl;
    }

    // Descarga manual si se presionó el botón de descarga explícito
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