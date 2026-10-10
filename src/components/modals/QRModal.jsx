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
            url = await onDownloadLabel(bien, true);
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
      <div className={STYLES.modalContent + " max-w-md !rounded-[32px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 animate-slide-up"}>
        
        {/* Cabecera */}
        <div className="px-7 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-white/5">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
                {isBulk ? "Generar Lote Masivo de QRs" : "Vista Previa de Código / Etiqueta"}
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isBulk ? "Exportación comprimida en ZIP" : `Rótulo: ${bien?.rotulo || 'S/R'}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-7 space-y-5 bg-white dark:bg-zinc-950">
          
          {!isBulk ? (
            <>
              {/* Selector de Pestañas: Etiqueta vs QR Simple */}
              <div className="flex rounded-2xl bg-zinc-100 dark:bg-white/5 p-1 border border-zinc-200/60 dark:border-white/5">
                <button 
                  onClick={() => setPreviewType('label')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    previewType === 'label' 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' 
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Etiqueta Completa
                </button>
                <button 
                  onClick={() => setPreviewType('simple')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    previewType === 'simple' 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' 
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Solo Código QR
                </button>
              </div>

              {/* Visor de Previsualización */}
              <div className="flex flex-col items-center justify-center p-5 bg-zinc-950 rounded-2xl border border-zinc-800 min-h-[210px] shadow-inner relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl text-zinc-400"></i>
                    <span className="text-xs font-medium text-zinc-400">Generando vista previa...</span>
                  </div>
                ) : previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Vista previa del QR" 
                    className="max-h-[190px] object-contain rounded-xl shadow-md border border-zinc-800"
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-500">No hay vista previa disponible</span>
                )}
              </div>

              {/* Botones de Descarga */}
              <div className="pt-2 grid grid-cols-1 gap-2.5">
                <button 
                  onClick={() => onDownloadLabel(bien, false)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <i className="fa-solid fa-download"></i> Descargar Etiqueta Completa (PNG)
                </button>

                <button 
                  onClick={() => onDownloadSimpleQR(bien, false)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <i className="fa-solid fa-qrcode"></i> Descargar Solo Código QR (PNG)
                </button>
              </div>
            </>
          ) : (
            /* Lote Masivo (ZIP) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Se generará un paquete comprimido <strong>.ZIP</strong> con todos los bienes actualmente filtrados.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={onBulkLabelZip}
                  className="py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <i className="fa-solid fa-file-zipper"></i> Descargar Etiquetas ZIP
                </button>
                <button 
                  onClick={onBulkSimpleZip}
                  className="py-3.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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
