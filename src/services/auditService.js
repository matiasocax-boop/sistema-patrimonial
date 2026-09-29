import { supabase } from '../supabaseClient';

export const registrarAuditoria = async ({ usuario, dependencia, accion, entidad, entidadId, detalles }) => {
  try {
    const payload = {
      data: {
        usuario: usuario || 'Sistema',
        dependencia: dependencia || 'General',
        accion,
        entidad,
        entidadId: String(entidadId),
        fecha: new Date().toISOString(),
        detalles: detalles || {}
      }
    };

    await supabase.from('auditoria').insert([payload]);
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};