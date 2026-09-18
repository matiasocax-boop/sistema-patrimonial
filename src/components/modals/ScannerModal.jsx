// src/components/modals/ScannerModal.jsx
import React from 'react';

export default function ScannerModal({ isOpen, onClose, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md !p-0 overflow-hidden"}>
            <div className={STYLES.modalHeader}>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-camera text-brand-primary"></i> Escanear Código QR
              </h2>
              <button 
                onClick={onClose} 
                className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="p-6 bg-black flex flex-col items-center justify-center relative">
                <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
                <p className="text-xs text-zinc-400 mt-4 text-center">Enfoque el código QR de la etiqueta patrimonial dentro del recuadro.</p>
            </div>

            <div className={STYLES.modalFooter}>
                <button 
                    onClick={onClose} 
                    className={STYLES.btnSecondary}
                >
                    Cancelar
                </button>
            </div>
          </div>
        </div>
    );
}