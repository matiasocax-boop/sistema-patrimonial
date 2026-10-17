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
export const getEstadoAbbr = (estado) => { if(!estado) return '-'; const e = String(estado).toLowerCase(); if(e.includes('muy')) return 'MB'; if(e.includes('bueno')) return 'B'; if(e.includes('regular')) return 'R'; if(e.includes('malo')) return 'M'; if(e.includes('inutilizable')) return 'I'; if(e.includes('baja')) return 'DB'; return estado; };
// Acento de color por dependencia (hash estable del nombre -> tono HSL).
// Se usa como variable CSS --dep-accent para detalles de identidad.
export const colorPorDependencia = (dependencia) => {
  const s = String(dependencia || 'UNP');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 65%, 45%)`;
};
export const normalizeStr = (str) => 
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

// Versión visible del sistema (mostrar en esquinas; subir en cada lote de mejoras)
export const APP_VERSION = '2.11.0';

// Comprime una imagen al mínimo peso razonable (objetivo ≤120KB):
// 1024px/q0.70, y si sigue pesada reintenta más agresivo. Quita metadatos EXIF.
export const comprimirImagen = (file, maxLado = 1024, calidad = 0.7, objetivoBytes = 120 * 1024) => {
  const intentar = (lado, q) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const escala = Math.min(1, lado / Math.max(width, height));
          width = Math.max(1, Math.round(width * escala));
          height = Math.max(1, Math.round(height * escala));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir'))),
            'image/jpeg',
            q
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Archivo de imagen inválido'));
      };
      img.src = url;
    });
  };
  return (async () => {
    const pasos = [
      [maxLado, calidad],
      [maxLado, 0.55],
      [800, 0.5],
    ];
    let ultimoError = null;
    for (const [lado, q] of pasos) {
      try {
        const blob = await intentar(lado, q);
        if (blob.size <= objetivoBytes) return blob;
        if (lado === 800 && q === 0.5) return blob; // último nivel: aceptar aunque supere el objetivo
      } catch (e) {
        ultimoError = e;
      }
    }
    throw ultimoError || new Error('No se pudo procesar la imagen');
  })();
};

export const matchSearchWords = (text, query) => {
  if (!query || !String(query).trim()) return true;
  const target = normalizeStr(text);
  const tokens = normalizeStr(query).split(' ').filter(Boolean);
  return tokens.every(token => target.includes(token));
};

// Formatea dígitos con separador de miles (1.234.567). Para CI y montos en vivo.
export const formatearMiles = (valor) => {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 12).replace(/^0+(?=\d)/, '');
  if (!digitos) return '';
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

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
export const getLogoPorDependencia = (dependencia, ext = 'png') => {
    if (!dependencia) return `/publiclogo_unp.${ext}`;
    const dep = String(dependencia).toLowerCase();

    if (dep.includes('agropecuarias')) return `/publiclogo_agro.${ext}`;
    if (dep.includes('aplicadas')) return `/publiclogo_aplicadas.${ext}`;
    if (dep.includes('biomédicas') || dep.includes('biomedicas')) return `/publiclogo_biomedicas.${ext}`;
    if (dep.includes('derecho')) return `/publiclogo_derecho.${ext}`;
    if (dep.includes('económicas') || dep.includes('economicas') || dep.includes('contables')) return `/publiclogo_contables.${ext}`;
    if (dep.includes('tecnolog')) return `/publiclogo_cta.${ext}`;
    if (dep.includes('humanidades')) return `/publiclogo_humanidades.${ext}`;

    return `/publiclogo_unp.${ext}`;
};