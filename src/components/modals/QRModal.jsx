// src/components/modals/QRModal.jsx
import React from 'react';

export default function QRModal({ isOpen, onClose, isBulk, bien, onDownloadLabel, onDownloadSimpleQR, onBulkLabelZip, onBulkSimpleZip, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md"}>
            <div className={STYLES.modalHeader}>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  <i className="fa-solid fa-qrcode mr-2 text-brand-primary"></i> 
                  {isBulk ? 'Descarga Masiva de Códigos' : 'Descargar Etiqueta'}
              </h2>
              <button onClick={onClose} className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className={STYLES.modalBody}>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Seleccione el formato de descarga deseado para {isBulk ? 'los bienes filtrados' : `el bien ${bien?.rotulo}`}.
              </p>
              
              <div className="space-y-4">
                  <button 
                      onClick={() => isBulk ? onBulkLabelZip() : onDownloadLabel(bien)} 
                      className="w-full flex items-center p-4 border-2 border-zinc-200 dark:border-darkbg-border rounded-xl hover:border-brand-primary hover:bg-brand-light/30 dark:hover:bg-brand-primary/10 transition-all text-left group cursor-pointer"
                  >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm">
                          <i className="fa-solid fa-print text-xl"></i>
                      </div>
                      <div className="ml-4">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Formato Etiqueta (PNG)</h3>
                          <p className="text-xs text-zinc-500 mt-1">62mm x 100mm. Diseñado para impresoras térmicas Brother (Rojo/Negro).</p>
                      </div>
                  </button>

                  <button 
                      onClick={() => isBulk ? onBulkSimpleZip() : onDownloadSimpleQR(bien)} 
                      className="w-full flex items-center p-4 border-2 border-zinc-200 dark:border-darkbg-border rounded-xl hover:border-brand-primary hover:bg-brand-light/30 dark:hover:bg-brand-primary/10 transition-all text-left group cursor-pointer"
                  >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-darkbg-main text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm">
                          <i className="fa-solid fa-file-image text-xl"></i>
                      </div>
                      <div className="ml-4">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Código Simple (PNG)</h3>
                          <p className="text-xs text-zinc-500 mt-1">Solo el gráfico QR en alta resolución (1024x1024 px).</p>
                      </div>
                  </button>
              </div>
            </div>
            <div className={STYLES.modalFooter}>
              <button onClick={onClose} className={STYLES.btnSecondary}>Cancelar</button>
            </div>
          </div>
        </div>
    );
}