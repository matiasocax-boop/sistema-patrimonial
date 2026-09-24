// src/utils/helpers.js
export const formatCurrency = (value) => { if (!value) return "0"; const number = parseInt(value.toString().replace(/\D/g, ''), 10); return isNaN(number) ? "0" : new Intl.NumberFormat('es-PY').format(number); };
export const formatCI = (value) => { if (!value) return ""; return value.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
export const generateId = () => { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); };

export const parseDateInfo = (dateStr) => { if (!dateStr) return { year: null, month: null }; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if (p.length === 3) { if (p[0].length === 4) return { year: p[0], month: p[1].padStart(2, '0') }; if (p[2].length === 4) return { year: p[2], month: p[1].padStart(2, '0') }; } return { year: null, month: null }; };
export const formatDateText = (dateStr) => { if(!dateStr) return ''; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if(p.length === 3) { if(p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`; if(p[2].length === 4) return `${p[0]}-${p[1]}-${p[2]}`; } return str; };
export const getEstadoAbbr = (estado) => { if(!estado) return '-'; const e = estado.toLowerCase(); if(e.includes('muy')) return 'MB'; if(e.includes('bueno')) return 'B'; if(e.includes('regular')) return 'R'; if(e.includes('malo')) return 'M'; if(e.includes('inutilizable')) return 'I'; if(e.includes('baja')) return 'DB'; return estado; };
export const normalizeStr = (str) => String(str || '').trim().toUpperCase().replace(/\s+/g, ' ');

export const decodeText = (buffer) => {
    let text = new TextDecoder('utf-8').decode(buffer);
    if (text.includes('')) {
        text = new TextDecoder('iso-8859-1').decode(buffer);
    }
    return text;
};

export const getPlaceholderLogo = () => { 
    const canvas = document.createElement('canvas'); 
    canvas.width = 200; 
    canvas.height = 200; 
    const ctx = canvas.getContext('2d'); 
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0,0,200,200); 
    ctx.fillStyle = '#121212'; 
    ctx.font = 'bold 40px sans-serif'; 
    ctx.textAlign = 'center'; 
    ctx.fillText('LOGO', 100, 115); 
    ctx.lineWidth = 4; 
    ctx.strokeRect(0,0,200,200); 
    return canvas.toDataURL('image/png');
 };
export const convertirImagenABase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error al convertir logo a Base64:", error);
        return null;
    }
};
export const getLogoPorDependencia = (dependencia) => {
    if (!dependencia) return '/publiclogo_unp.png';
    const dep = dependencia.toLowerCase();
    
    if (dep.includes('agropecuarias')) return '/publiclogo_agro.png';
    if (dep.includes('aplicadas')) return '/publiclogo_aplicadas.png';
    if (dep.includes('biomédicas') || dep.includes('biomedicas')) return '/publiclogo_biomedicas.png';
    if (dep.includes('contables') || dep.includes('economicas')) return '/publiclogo_contables.png';
    if (dep.includes('tecnologías') || dep.includes('artes') || dep.includes('cta')) return '/publiclogo_cta.png';
    if (dep.includes('derecho')) return '/publiclogo_derecho.png';
    if (dep.includes('humanidades')) return '/publiclogo_humanidades.png';
    
    return '/publiclogo_unp.png';
};