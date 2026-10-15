// Extracción del código de bien desde un QR escaneado (extraído de App.jsx).
// Acepta URL con ?id= / ?bienId=, formato "CTA:...DIGO:..." o código directo.

export const extraerCodigoQR = (decodedText) => {
  let targetId = String(decodedText || '').trim();
  if (targetId.startsWith('http://') || targetId.startsWith('https://')) {
    try {
      const parsedUrl = new URL(targetId);
      targetId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('bienId') || targetId;
    } catch (e) {}
  } else if (targetId.includes('CTA:') || targetId.includes('DIGO:')) {
    const partes = targetId.split('CTA:')[0];
    targetId = partes.replace(/.*DIGO:/i, '').trim();
  }
  return targetId;
};
