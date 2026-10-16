import { useState, useEffect, useCallback } from 'react';

// Mini i18n ES/GN para la interfaz principal. Sin dependencias: el idioma
// vive en localStorage y se propaga por evento + estado local.
const KEY = 'app_idioma';
const listeners = new Set();
const leer = () => {
  try { return localStorage.getItem(KEY) === 'gn' ? 'gn' : 'es'; } catch { return 'es'; }
};

const STRINGS = {
  es: {
    'nav.dashboard': 'Panel Principal',
    'nav.resumen': 'Mi Dependencia',
    'nav.inventario': 'Inventario General',
    'nav.funcionarios': 'Plantel de Funcionarios',
    'nav.fc04': 'Altas y Bajas (FC-04)',
    'nav.fc10': 'Asignaciones (FC-10)',
    'nav.fc11': 'Traslados (FC-11)',
    'nav.aprobaciones': 'Aprobaciones',
    'nav.auditoria': 'Auditoría',
    'nav.usuarios': 'Gestión de Usuarios',
    'nav.anuncios': 'Anuncios',
    'nav.ayuda': 'Centro de Ayuda',
    'hdr.buscar': 'Buscar...',
    'hdr.apariencia': 'Apariencia',
    'hdr.salir': 'Cerrar sesión',
    'inv.anadir': 'Añadir Registro',
    'inv.plantilla': 'Plantilla',
    'inv.importar': 'Importar',
    'inv.exportar': 'Exportar',
    'inv.excel': 'Excel',
    'inv.loteqr': 'Lote QRs',
    'inv.repetir': 'Repetir',
    'comun.cancelar': 'Cancelar',
    'comun.guardar': 'Guardar',
    'comun.cerrar': 'Cerrar',
  },
  gn: {
    'nav.dashboard': 'Mba’apo Renda',
    'nav.resumen': 'Che Dependencia',
    'nav.inventario': 'Mba’e Rysýi Guasu',
    'nav.funcionarios': 'Mba’apohárape',
    'nav.fc04': 'Altas y Bajas (FC-04)',
    'nav.fc10': 'Asignaciones (FC-10)',
    'nav.fc11': 'Traslados (FC-11)',
    'nav.aprobaciones': 'Ñemoneĩ',
    'nav.auditoria': 'Auditoría',
    'nav.usuarios': 'Puruhára Ñangareko',
    'nav.anuncios': 'Momarandu',
    'nav.ayuda': 'Pytyvõ Renda',
    'hdr.buscar': 'Heka...',
    'hdr.apariencia': 'Hechajái',
    'hdr.salir': 'Ñesẽ',
    'inv.anadir': 'Ñemoinge Registro',
    'inv.plantilla': 'Plantilla',
    'inv.importar': 'Mba’e Rysýi Mbojuapy',
    'inv.exportar': 'Mba’e Rysýi Ñemondo',
    'inv.excel': 'Excel',
    'inv.loteqr': 'Lote QRs',
    'inv.repetir': 'Jey',
    'comun.cancelar': 'Heja',
    'comun.guardar': 'Ñongatu',
    'comun.cerrar': 'Mboty',
  },
};

export function getIdioma() {
  return leer();
}

export function setIdioma(lang) {
  const v = lang === 'gn' ? 'gn' : 'es';
  try { localStorage.setItem(KEY, v); } catch {}
  listeners.forEach(fn => { try { fn(v); } catch {} });
}

export function t(key) {
  const lang = leer();
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.es[key] || key;
}

export function useIdioma() {
  const [lang, setLang] = useState(leer());
  useEffect(() => {
    const fn = (v) => setLang(v);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const cambiar = useCallback((v) => setIdioma(v), []);
  const traducir = useCallback((key) => {
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.es[key] || key;
  }, [lang]);
  return { lang, setLang: cambiar, t: traducir };
}
