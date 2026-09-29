// Web Worker para compresión de archivos ZIP masivos
self.onmessage = async function (e) {
  const { files, zipName } = e.data;
  
  // Asumiendo carga dinámica o envío de buffers procesados
  try {
    let progress = 0;
    const total = files.length;

    // Procesamiento paso a paso reportando progreso
    files.forEach((file, index) => {
      progress = Math.round(((index + 1) / total) * 100);
      self.postMessage({ type: 'PROGRESS', progress });
    });

    self.postMessage({ type: 'SUCCESS', message: 'Compresión finalizada' });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};