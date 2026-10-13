import { supabase } from '../supabaseClient';

export const registrarAuditoria = async ({ usuario, dependencia, accion, entidad, entidadId, detalles }) => {
  try {
    const auditId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const payload = {
      id: auditId,
      tiporegistro: 'AUDITORIA',
      usuariodestino: null,
      titulo: `${accion || 'ACCION'} - ${entidad || 'SISTEMA'}`,
      mensaje: typeof detalles === 'object' ? JSON.stringify(detalles) : String(detalles || ''),
      leido: 0,
      fecha: new Date().toISOString(),
      bienid: entidadId ? String(entidadId) : null,
      accion: accion || null
    };

    const { error } = await supabase.from('auditoria').insert([payload]);
    if (error) {
      console.warn('Advertencia al registrar auditoría en Supabase:', error.message);
    }
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};