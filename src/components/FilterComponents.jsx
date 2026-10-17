import React from 'react';
import FiltroCombo from './FiltroCombo';

const MESES = [
  { val: '01', name: 'Enero' }, { val: '02', name: 'Febrero' }, { val: '03', name: 'Marzo' },
  { val: '04', name: 'Abril' }, { val: '05', name: 'Mayo' }, { val: '06', name: 'Junio' },
  { val: '07', name: 'Julio' }, { val: '08', name: 'Agosto' }, { val: '09', name: 'Septiembre' },
  { val: '10', name: 'Octubre' }, { val: '11', name: 'Noviembre' }, { val: '12', name: 'Diciembre' }
];

// Años disponibles: 5 años hacia atrás (histórico) y 1 hacia adelante
// (presupuesto del año siguiente). Antes la lista estaba fija en 2024-2030, así
// que en 2027 ya no se podían filtrar periodos viejos ni el siguiente.
export const aniosDisponibles = () => {
  const actual = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(actual - 5 + i));
};

/**
 * Selector de periodo (Año y Mes) para las cabeceras de FC-04 / FC-10 / FC-11.
 * Usa FiltroCombo en vez de <select> nativo: el popup del navegador se dibuja
 * con los colores del sistema y quedaba ilegible sobre la app oscura.
 */
export function PeriodSelector({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) {
  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-darkbg-card p-1.5 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-sm">
      <FiltroCombo
        ancho="w-[128px]"
        compacto
        valor={selectedMonth}
        opciones={MESES.map(m => ({ label: m.name, value: m.val }))}
        onElegir={setSelectedMonth}
        etiquetaTodos="Mes"
        titulo="Mes del periodo"
      />
      <div className="h-5 w-px bg-zinc-200 dark:bg-darkbg-border mx-1"></div>
      <FiltroCombo
        ancho="w-[104px]"
        compacto
        valor={selectedYear}
        opciones={aniosDisponibles()}
        onElegir={setSelectedYear}
        etiquetaTodos="Año"
        titulo="Año del periodo"
      />
    </div>
  );
}