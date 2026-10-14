// src/utils/helpers.js
export const formatCurrency = (value) => { if (!value) return "0"; const number = parseInt(value.toString().replace(/\D/g, ''), 10); return isNaN(number) ? "0" : new Intl.NumberFormat('es-PY').format(number); };
export const formatCI = (value) => { if (!value) return ""; return value.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback seguro usando getRandomValues
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};
export const parseDateInfo = (dateStr) => { if (!dateStr) return { year: null, month: null }; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if (p.length === 3) { if (p[0].length === 4) return { year: p[0], month: p[1].padStart(2, '0') }; if (p[2].length === 4) return { year: p[2], month: p[1].padStart(2, '0') }; } return { year: null, month: null }; };
export const formatDateText = (dateStr) => { if(!dateStr) return ''; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if(p.length === 3) { if(p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`; if(p[2].length === 4) return `${p[0]}-${p[1]}-${p[2]}`; } return str; };
export const toInputDateFormat = (val) => {
  if (!val) return '';
  const str = String(val).trim().replace(/\//g, '-');
  const clean = str.split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return '';
};
export const getEstadoAbbr = (estado) => { if(!estado) return '-'; const e = estado.toLowerCase(); if(e.includes('muy')) return 'MB'; if(e.includes('bueno')) return 'B'; if(e.includes('regular')) return 'R'; if(e.includes('malo')) return 'M'; if(e.includes('inutilizable')) return 'I'; if(e.includes('baja')) return 'DB'; return estado; };
export const normalizeStr = (str) => 
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

// Versión visible del sistema (mostrar en esquinas; subir en cada lote de mejoras)
export const APP_VERSION = '2.7.0';

export const matchSearchWords = (text, query) => {
  if (!query || !String(query).trim()) return true;
  const target = normalizeStr(text);
  const tokens = normalizeStr(query).split(' ').filter(Boolean);
  return tokens.every(token => target.includes(token));
};

// Versión visible del sistema (mostrar en esquinas; subir en cada lote de mejoras)
// Búsqueda robusta de bienes: insensible a tildes/mayúsculas, multi-palabra (AND),
// tolerante a ceros/guiones en rótulos y ampliada a más campos.
export const matchBienSearch = (bien, query) => {
  if (!query || !String(query).trim()) return true;
  const b = bien || {};
  const fields = [
    b.rotulo, b.descripcion, b.cuenta, b.subcuenta, b.analitico1, b.analitico2,
    b.ubicacion, b.funcionario, b.funcionarioDoc, b.id
  ].map(v => String(v ?? ''));
  const hayNorm = normalizeStr(fields.join(' '));
  const fieldDigits = fields.map(f => {
    const raw = String(f).replace(/\D/g, '');
    return { raw, stripped: raw.replace(/^0+/, '') || (raw ? '0' : '') };
  });
  const tokens = normalizeStr(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every(tok => {
    if (hayNorm.includes(tok)) return true;
    const tokRawDigits = String(tok).replace(/\D/g, '');
    if (!tokRawDigits) return false;
    const tokStripped = tokRawDigits.replace(/^0+/, '') || '0';
    return fieldDigits.some(fd => {
      if (!fd.raw) return false;
      return fd.stripped.includes(tokStripped) || fd.raw.includes(tokRawDigits);
    });
  });
};

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
    if (dep.includes('derecho')) return '/publiclogo_derecho.png';
    if (dep.includes('económicas') || dep.includes('economicas') || dep.includes('contables')) return '/publiclogo_contables.png';
    if (dep.includes('tecnolog')) return '/publiclogo_cta.png';
    if (dep.includes('humanidades')) return '/publiclogo_humanidades.png';
    
    return '/publiclogo_unp.png';
};