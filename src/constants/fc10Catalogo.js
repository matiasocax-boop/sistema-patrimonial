// src/constants/fc10Catalogo.js
// Estructura organizacional de la UNP para el Paso 1 del FC-10, según el
// organigrama oficial (Res. C.S.U. N° 76/2024) y los códigos patrimoniales.
//
// Antes este archivo era una lista plana y los tres campos del formulario
// (Repartición / Dependencia / Área) usaban esa misma lista completa: cualquier
// repartición aparecía también como dependencia y como área, y el código se
// completaba sin criterio. Ahora cada unidad tiene un nivel, un órgano y un
// padre, y las sugerencias filtran en cascada según lo que ya se eligió.

// Órganos (= Unidad Jerárquica del FC-10). El código del órgano es el de su
// unidad principal: no viene un código propio en el organigrama.
export const FC10_ORGANOS = [
  { nombre: "Órganos de Gobierno y Alta Dirección", codigo: "01" },
  { nombre: "Dependencias Directas del Rectorado", codigo: "01" },
  { nombre: "Dirección General de Administración y Finanzas", codigo: "02" },
  { nombre: "Dirección General Académica", codigo: "06" },
  { nombre: "Dirección General de Investigación", codigo: "08" },
  { nombre: "Dirección General de Cooperación Académica y Relaciones Internacionales", codigo: "06" },
  { nombre: "Dirección General de Postgrado", codigo: "07" },
  { nombre: "Dirección General de T.I.C.", codigo: "09" },
  { nombre: "Dirección General de Planificación", codigo: "10" },
  { nombre: "Dirección General de Extensión Universitaria", codigo: "08" },
];

const O = "Órganos de Gobierno y Alta Dirección";
const R = "Dependencias Directas del Rectorado";
const A = "Dirección General de Administración y Finanzas";
const AC = "Dirección General Académica";
const I = "Dirección General de Investigación";
const COOP = "Dirección General de Cooperación Académica y Relaciones Internacionales";
const PG = "Dirección General de Postgrado";
const TIC = "Dirección General de T.I.C.";
const PL = "Dirección General de Planificación";
const EX = "Dirección General de Extensión Universitaria";

// organigrama: [nombre, código, padre]
// padre = "" cuando cuelga directamente del órgano.
const ORGANIGRAMA = {
  [O]: {
    reparticion: [
      ["Asamblea Universitaria", "01"],
      ["Consejo Superior Universitario", "01"],
      ["Rectorado / Despacho del Rector", "01"],
      ["Vice Rectorado", "01"],
      ["Secretaría General", "03"],
    ],
    dependencia: [
      ["Archivo Central / Secretaría General", "03", "Secretaría General"],
    ],
  },
  [R]: {
    reparticion: [
      ["Protocolo Lila", "01"],
      ["Comité Políticas Conocimiento", "01"],
      ["Dirección General de Auditoría", "01"],
      ["Secretaría Privada", "01"],
      ["Dirección de Gestión de Talento Humano", "02"],
      ["Dirección General del Gabinete del Rector", "01"],
      ["Recepción", "02"],
      ["Dirección de Aseguramiento de la Calidad", "01"],
      ["M.E.C.I.P", "02"],
      ["Asesoría Legal", "01"],
    ],
  },
  [A]: {
    reparticion: [
      ["Dirección General de Administración y Finanzas", "02"],
      ["Dirección de Gabinete Técnico", "02"],
      ["Dirección Financiera", "04"],
      ["Dirección de Contabilidad", "05"],
      ["Dirección de U.O.C.", "02"],
      ["Dirección de Presupuesto", "02"],
      ["Dirección Administrativa", "02"],
    ],
    dependencia: [
      ["Gestión de Proyectos", "02", "Dirección de Gabinete Técnico"],
      ["Control Interno", "02", "Dirección de Gabinete Técnico"],
      ["Enlace de Gestiones Administrativas y Financieras", "02", "Dirección de Gabinete Técnico"],
      ["Departamento de Tesorería", "04", "Dirección Financiera"],
      ["Departamento de Perceptoría", "04", "Dirección Financiera"],
      ["Departamento de Recursos Financieros", "04", "Dirección Financiera"],
      ["Departamento de Control y Registros Contables", "05", "Dirección de Contabilidad"],
      ["Departamento de Rendición Contable", "05", "Dirección de Contabilidad"],
      ["Departamento de Contabilidad Presupuestaria", "05", "Dirección de Contabilidad"],
      ["Departamento de Gestión y Evaluación Contable", "05", "Dirección de Contabilidad"],
      ["Departamento de Bienes Patrimoniales", "05", "Dirección de Contabilidad"],
      ["Departamento de Contratos y Garantías", "02", "Dirección de U.O.C."],
      ["Departamento de Planificación y Ejecuciones de Convocatorias", "02", "Dirección de U.O.C."],
      ["Departamento de Planificación Presupuestaria", "02", "Dirección de Presupuesto"],
      ["Departamento de Ejecución, Control y Evaluación Presupuestaria", "02", "Dirección de Presupuesto"],
      ["Departamento de Enlace y Monitoreo de Gestión de las Unidades Académicas", "02", "Dirección de Presupuesto"],
      ["Departamento de Salarios y Beneficios", "02", "Dirección Administrativa"],
      ["Departamento de Control y Ejecución de Viáticos", "02", "Dirección Administrativa"],
      ["Departamento de Servicios Generales", "02", "Dirección Administrativa"],
      ["Departamento de Transporte", "02", "Dirección Administrativa"],
    ],
  },
  [AC]: {
    reparticion: [
      ["Dirección General Académica", "06"],
    ],
    dependencia: [
      ["Secretaría Académica", "06"],
      ["Evaluación y Seguimiento SNCA - PY", "06"],
      ["Currículum y Proyectos Educativos", "06"],
      ["Departamento de Estadísticas", "06"],
    ],
    area: [
      ["C.R.A.I", "06"],
      ["Aulas", "06"],
    ],
  },
  [I]: {
    reparticion: [
      ["Dirección General de Investigación", "08"],
    ],
    dependencia: [
      ["Secretaría de Investigación", "08"],
    ],
    area: [
      ["Centro Multidisciplinario de Investigación y Tecnología (CEMIT)", "08"],
      ["Transferencia de Tecnología y Resultados de Investigación", "08"],
      ["Gestión de la Investigación Científica y la Innovación", "08"],
    ],
  },
  [COOP]: {
    reparticion: [
      ["Dirección General de Cooperación Académica y Relaciones Internacionales", "06"],
    ],
    dependencia: [
      ["Departamento de Intercambio y Movilidad", "06"],
      ["Departamento de Cooperación al Desarrollo", "06"],
      ["Departamento de Relaciones Internacionales", "06"],
    ],
  },
  [PG]: {
    reparticion: [
      ["Dirección General de Postgrado", "07"],
    ],
    dependencia: [
      ["Dirección de Educación Virtual", "01"],
      ["Dirección de Posgrado", "01"],
    ],
  },
  [TIC]: {
    reparticion: [
      ["Dirección General de T.I.C.", "09"],
    ],
    dependencia: [
      ["Desarrollo y Soporte de Sistemas", "09"],
      ["Soporte Técnico e Infraestructura", "09"],
      ["Digitalización, Información y Comunicación", "09"],
      ["Seguridad de Sistemas", "09"],
    ],
  },
  [PL]: {
    reparticion: [
      ["Dirección General de Planificación", "10"],
    ],
    dependencia: [
      ["Dirección de Planificación y Estadísticas", "10"],
      ["Evaluación y Seguimiento del P.E. / P.O.A.", "10"],
    ],
  },
  [EX]: {
    reparticion: [
      ["Dirección General de Extensión Universitaria", "08"],
    ],
    dependencia: [
      ["Secretaría de Extensión", "02"],
      ["Centros de Extensión", "03"],
      ["Dirección de Extensión", "01"],
      ["Dirección de Programas y Proyectos", "04"],
      ["Unidad de Monitoreo", "05"],
    ],
  },
};

// Catálogo plano y normalizado: cada unidad con nivel, órgano y padre.
export const FC10_ESTRUCTURA = Object.entries(ORGANIGRAMA).flatMap(([organo, niveles]) =>
  ['reparticion', 'dependencia', 'area'].flatMap(nivel =>
    (niveles[nivel] || []).map(([nombre, codigo, padre = '']) => ({
      nombre, codigo, organo, padre, nivel,
    }))
  )
);

// Los órganos también son opciones de "Unidad Jerárquica". "Rectorado" se
// agrega aparte: es la unidad de trabajo del Despacho del Rector y en el FC-10
// se registra con código 03 (así lomaneja la dependencia Rectorado).
export const FC10_UNIDADES = [
  { nombre: 'Rectorado', codigo: '03', organo: 'Rectorado', padre: '', nivel: 'unidad' },
  ...FC10_ORGANOS.map(o => ({
    nombre: o.nombre,
    codigo: o.codigo,
    organo: o.nombre,
    padre: '',
    nivel: 'unidad',
  })),
];

export const TODAS_LAS_UNIDADES = [...FC10_UNIDADES, ...FC10_ESTRUCTURA];

import { normalizeStr } from '../utils/helpers';

// Campo de memoria (tabla `estructuras`) → nivel del formulario.
const TIPO_DE_MEMORIA = {
  unidad: 'unidad',
  reparticion: 'reparticion',
  dependencia: 'dependencia',
  area: 'area',
};

// ¿El valor es un órgano del organigrama (y por lo tanto filtra la cascada)?
function esOrganoDelCatalogo(nombre) {
  if (!nombre) return false;
  return FC10_ORGANOS.some(o => normalizeStr(o.nombre) === normalizeStr(nombre));
}

// Devuelve las unidades del nivel pedido dentro del contexto elegido:
// - `nivel: 'unidad'`      → todos los órganos.
// - nivel de unidad        → las que cuelgan del órgano elegido.
// - nivel de repartición   → las que cuelgan de esa repartición; si la
//                            repartición no tiene subunits, las del órgano.
// - nivel de dependencia   → idem con la dependencia elegida.
// Se mezclan primero las unidades ya usadas por esta dependencia (memoria del
// sistema: tabla `estructuras`), porque son las que convienen aquí, y después
// el catálogo oficial. Filtra por texto en nombre o código.
export function opcionesCatalogoFC10({
  nivel = 'reparticion', organo = '', padre = '', texto = '', memoria = [], limite = 40,
} = {}) {
  const q = normalizeStr(texto).trim();

  // 1) Lo que esta dependencia ya usó (tabla `estructuras`), solo para marcarlo
  //    como conocido y agregar las unidades que no están en el catálogo oficial.
  const aprendidas = new Map();
  (memoria || [])
    .filter(e => e && e.nombre && TIPO_DE_MEMORIA[e.tipoEstructura] === nivel)
    .forEach(e => aprendidas.set(normalizeStr(String(e.nombre).trim()), String(e.codigo || '').trim()));

  // 2) Catálogo oficial dentro del contexto elegido.
  const mapa = new Map();
  TODAS_LAS_UNIDADES
    .filter(u => u.nivel === nivel)
    // "Rectorado" es la unidad de trabajo de varias dependencias pero no es un
    // órgano del organigrama: no debe filtrar la cascada (si no, no listaría nada).
    .filter(u => (nivel === 'unidad' || !esOrganoDelCatalogo(organo)) ? true : u.organo === organo)
    .filter(u => {
      if (nivel === 'unidad') return true;
      if (!padre) return true;
      const delPadre = u.padre === padre;
      // Si el nivel no tiene descendencia directa del padre, se ofrece todo lo
      // del órgano: hay ramas del organigrama que terminan antes (ej. DGAF).
      const hayHijos = TODAS_LAS_UNIDADES.some(x => x.padre === padre);
      return hayHijos ? delPadre : true;
    })
    .forEach(u => {
      const clave = normalizeStr(u.nombre);
      if (!mapa.has(clave)) {
        // El código del catálogo manda: lo aprendido puede venir de un alta vieja.
        mapa.set(clave, { ...u, aprendida: aprendidas.has(clave) });
      }
    });

  // 3) Unidades propias de la dependencia que no están en el catálogo.
  aprendidas.forEach((codigo, clave) => {
    if (mapa.has(clave)) return;
    mapa.set(clave, {
      nombre: [...memoria].find(e => normalizeStr(String(e.nombre).trim()) === clave)?.nombre || clave,
      codigo,
      organo: '',
      padre: '',
      nivel,
      aprendida: true,
    });
  });

  const lista = [...mapa.values()];
  const filtrada = q
    ? lista.filter(u => normalizeStr(u.nombre).includes(q) || normalizeStr(u.codigo).includes(q))
    : lista;

  return filtrada
    .sort((a, b) => (b.aprendida ? 1 : 0) - (a.aprendida ? 1 : 0)
      || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, limite);
}

// Órgano al que pertenece una unidad (para precargar el selector al editar).
// Acepta nombres parciales porque la dependencia del usuario puede venir
// como "Rectorado" y en el organigrama figura "Rectorado / Despacho del Rector".
export function organoDeUnidad(nombre) {
  if (!nombre) return '';
  const q = normalizeStr(nombre);
  const exacto = TODAS_LAS_UNIDADES.find(u => normalizeStr(u.nombre) === q);
  if (exacto) return exacto.organo;
  const previo = TODAS_LAS_UNIDADES.find(u => normalizeStr(u.nombre).startsWith(q));
  if (previo) return previo.organo;
  const contiene = TODAS_LAS_UNIDADES.find(u => normalizeStr(u.nombre).includes(q));
  return contiene ? contiene.organo : '';
}

// Busca una unidad por nombre exacto (tolerante a tildes) en cualquier nivel.
export function buscarUnidad(nombre) {
  if (!nombre) return null;
  const q = normalizeStr(nombre);
  return TODAS_LAS_UNIDADES.find(u => normalizeStr(u.nombre) === q) || null;
}