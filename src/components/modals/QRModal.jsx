import React, { useState, useEffect } from 'react';

export default function QRModal({
  isOpen,
  onClose,
  isBulk,
  bien,
  onDownloadLabel,
  onDownloadSimpleQR,
  onBulkLabelZip,
  onBulkSimpleZip,
  STYLES
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('label'); // 'label' o 'simple'
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && bien && !isBulk) {
      const loadPreview = async () => {
        setIsGenerating(true);
        try {
          let url = null;
          if (previewType === 'label' && onDownloadLabel) {
            url = await onDownloadLabel(bien, true); // 👈 Pasa true para solo solicitar la vista previa
          } else if (previewType === 'simple' && onDownloadSimpleQR) {
            url = await onDownloadSimpleQR(bien, true);
          }
          if (isMounted) setPreviewUrl(url);
        } catch (e) {
          console.error("Error al generar previsualización:", e);
        } finally {
          if (isMounted) setIsGenerating(false);
        }
      };

      loadPreview();
    } else {
      setPreviewUrl(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, bien, isBulk, previewType]);

  if (!isOpen) return null;

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>
        
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
                {isBulk ? "Generar Lote Masivo de QRs" : "Vista Previa de Código / Etiqueta"}
              </h3>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isBulk ? "Exportación comprimida en ZIP" : `Rótulo: ${bien?.rotulo || 'S/R'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 bg-white dark:bg-zinc-900">
          
          {!isBulk ? (
            <>
              {/* Selector de Pestañas: Etiqueta vs QR Simple */}
              <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-950 p-1.5 border border-zinc-200/80 dark:border-zinc-800">
                <button 
                  onClick={() => setPreviewType('label')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${previewType === 'label' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Etiqueta Completa
                </button>
                <button 
                  onClick={() => setPreviewType('simple')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${previewType === 'simple' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  Solo Código QR
                </button>
              </div>

              {/* Visor de Previsualización */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/90 rounded-2xl border border-zinc-800 min-h-[200px] shadow-inner relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl text-purple-500"></i>
                    <span className="text-xs font-semibold text-zinc-400">Generando vista previa...</span>
                  </div>
                ) : previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Vista previa del QR" 
                    className="max-h-[180px] object-contain rounded-lg shadow-md border border-zinc-700/50"
                  />
                ) : (
                  <span className="text-xs font-semibold text-zinc-500">No hay vista previa disponible</span>
                )}
              </div>

              {/* Botón de Descarga según la pestaña seleccionada */}
              {/* CÓDIGO NUEVO (Muestra siempre los dos botones) */}
<div className="pt-2 grid grid-cols-1 gap-2.5">
  <button 
    onClick={() => onDownloadLabel(bien, false)}
    className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
  >
    <i className="fa-solid fa-download"></i> Descargar Etiqueta Completa (PNG)
  </button>

  <button 
    onClick={() => onDownloadSimpleQR(bien, false)}
    className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-black transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
  >
    <i className="fa-solid fa-qrcode"></i> Descargar Solo Código QR (PNG)
  </button>
</div>
            </>
          ) : (
            /* Lote Masivo (ZIP) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-300 leading-relaxed">
                  Se generará un paquete comprimido <strong>.ZIP</strong> con todos los bienes actualmente filtrados.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={onBulkLabelZip}
                  className="py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-file-zipper"></i> Descargar Etiquetas ZIP
                </button>
                <button 
                  onClick={onBulkSimpleZip}
                  className="py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-qrcode"></i> Descargar QRs Simples ZIP
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}