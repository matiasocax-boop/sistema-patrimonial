// Normalización del bien para la vista pública de escaneo QR (extraído de
// App.jsx, Fase 1). Funciones puras: unifican fila cruda (con o sin columna
// JSON 'data') y detectan si trae valor monetario.

// Fusiona { id, data } en un solo objeto plano con valorUnitario garantizado.
export const normalizarBien = (raw) => {
  if (!raw) return null;
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item) return null;
  let d = item;
  if (item.data) {
    d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
  }
  const merged = { ...item, ...d };
  const valorRaw = merged.valorUnitario || merged.valor || merged.valorAdquisicion || merged.precio || merged.costo || '0';
  merged.valorUnitario = valorRaw;
  return merged;
};

// ¿El bien trae algún valor monetario distinto de cero?
export const tieneValor = (b) => {
  if (!b) return false;
  const v = b.valorUnitario ?? b.valor ?? b.valorAdquisicion ?? b.precio ?? b.costo;
  return v !== undefined && v !== null && String(v).trim() !== '' && String(v).replace(/\D/g, '') !== '' && parseInt(String(v).replace(/\D/g, ''), 10) !== 0;
};
