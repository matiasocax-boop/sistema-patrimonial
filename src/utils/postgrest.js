/**
 * Valores interpolados en filtros `.or()` de PostgREST deben ir entre comillas
 * y escapados: un `.` o `eq.` en el texto puede ampliar o romper la consulta.
 */
export function escaparFiltroPostgrest(valor) {
  const s = String(valor ?? '');
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function rolDesdeCargo(cargo) {
  if (cargo === 'admin') return 'admin';
  if (cargo === 'desarrollador') return 'dev';
  return 'user';
}

export function rolEsPrivilegiado(roleOCargo) {
  return roleOCargo === 'admin' || roleOCargo === 'dev' || roleOCargo === 'desarrollador';
}
