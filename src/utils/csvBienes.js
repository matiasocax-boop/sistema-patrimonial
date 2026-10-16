import { normalizeStr, generateId } from './helpers';

// Mapeo de columnas del CSV de bienes (extraído de App.jsx, UI Lote 4).
// Acepta encabezados con otros nombres, sin tildes o abreviaturas.
export const ALIAS_COLUMNAS_BIENES = {
  rotulo: ['Nº RÓTULO', 'N ROTULO', 'ROTULO', 'RÓTULO', 'CÓDIGO', 'CODIGO'],
  cuenta: ['CUENTA MAYOR', 'CUENTA'],
  subcuenta: ['SUB-CUENTA', 'SUBCUENTA', 'SUB CUENTA'],
  analitico1: ['ANALÍTICO 1', 'ANALITICO 1', 'AN 1', 'AN. 1'],
  analitico2: ['ANALÍTICO 2', 'ANALITICO 2', 'AN 2', 'AN. 2'],
  descripcion: ['DESCRIPCIÓN GENERAL', 'DESCRIPCION GENERAL', 'DESCRIPCIÓN', 'DESCRIPCION', 'DETALLE'],
  fechaAdquisicion: ['FECHA ADQUISICIÓN (YYYY-MM-DD)', 'FECHA ADQUISICION', 'FECHA ADQUISICIÓN', 'FECHA'],
  valorUnitario: ['VALOR UNITARIO (SIN PUNTOS)', 'VALOR UNITARIO', 'VALOR', 'PRECIO', 'COSTO'],
  vidaUtil: ['VIDA ATIL (AÑOS)', 'VIDA ÚTIL', 'VIDA UTIL', 'VIDA'],
};

// Mapeo seguro de filas ya parseadas a bienes + clasificación.
// rows: array de objetos (header:true). fields: encabezados detectados.
// Devuelve { validos, duplicados, errores } con la MISMA lógica que el import.
export const mapearFilasBienes = (rows, fields, bienes, dependenciaActual) => {
  const buscarColumna = (aliases) => {
    const normas = aliases.map(a => normalizeStr(a));
    return (fields || []).find(h => normas.includes(normalizeStr(h))) || null;
  };
  const COL = {};
  Object.keys(ALIAS_COLUMNAS_BIENES).forEach(k => { COL[k] = buscarColumna(ALIAS_COLUMNAS_BIENES[k]); });
  const val = (row, c) => (c ? String(row[c] ?? '').trim() : '');

  const validos = [];
  const duplicados = [];
  const errores = [];
  (rows || []).forEach((row, idx) => {
    const rotuloCSV = val(row, COL.rotulo);
    if (!rotuloCSV) {
      errores.push({ linea: idx + 2, motivo: 'Sin rótulo' });
      return;
    }
    const nuevo = {
      id: generateId(),
      dependencia: dependenciaActual,
      cuenta: val(row, COL.cuenta),
      subcuenta: val(row, COL.subcuenta),
      analitico1: val(row, COL.analitico1),
      analitico2: val(row, COL.analitico2),
      descripcion: val(row, COL.descripcion),
      fechaAdquisicion: val(row, COL.fechaAdquisicion),
      rotulo: rotuloCSV,
      valorUnitario: (val(row, COL.valorUnitario) || '0').replace(/\D/g, ''),
      vidaUtil: val(row, COL.vidaUtil),
      funcionario: '',
      ubicacion: '',
      hasFC10: false,
      hasQR: false,
      estadoConservacion: 'Muy bueno'
    };
    const esDuplicado = (bienes || []).some(b =>
      normalizeStr(b.rotulo) === normalizeStr(rotuloCSV) &&
      b.dependencia === dependenciaActual
    );
    if (esDuplicado) duplicados.push(nuevo);
    else validos.push(nuevo);
  });
  return { validos, duplicados, errores };
};
