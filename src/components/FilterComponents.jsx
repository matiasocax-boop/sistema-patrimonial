// frontend/src/components/FilterComponents.jsx
import React from 'react';

/**
 * Componente para renderizar un selector desplegable con icono
 */
export function SelectFilter({ icon, value, onChange, options, defaultText }) {
    const isActive = value !== '' && value !== 'ALL';
    return (
        <div className={`relative flex items-center rounded-full px-4 py-2 text-sm shadow-sm ring-1 ring-inset transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none min-w-[140px] font-semibold ${isActive ? 'bg-brand-light text-brand-dark ring-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent dark:ring-brand-primary/50' : 'bg-white text-zinc-600 ring-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-darkbg-main dark:text-zinc-300 dark:ring-darkbg-border dark:hover:bg-darkbg-hover dark:hover:text-white'}`}>
            <i className={`fa-solid ${icon} mr-2 ${isActive ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-400 dark:text-zinc-500'}`}></i>
            <select value={value} onChange={onChange} className="appearance-none bg-transparent text-xs font-bold outline-none cursor-pointer pr-6 w-full py-0.5 text-ellipsis overflow-hidden dark:bg-darkbg-main dark:text-zinc-200">
                <option value="" className="dark:bg-darkbg-card dark:text-zinc-300">{defaultText}</option>
                {options.map(opt => <option key={opt.value || opt} value={opt.value || opt} className="dark:bg-darkbg-card dark:text-zinc-200">{opt.label || opt}</option>)}
            </select>
            <i className={`fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${isActive ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-400 dark:text-zinc-500'}`}></i>
        </div>
    );
}

/**
 * Componente selector de periodo (Año y Mes) para formularios FC
 */
export function PeriodSelector({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) { 
    const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030]; 
    const months = [ 
        { val: '01', name: 'Enero' }, { val: '02', name: 'Febrero' }, { val: '03', name: 'Marzo' }, 
        { val: '04', name: 'Abril' }, { val: '05', name: 'Mayo' }, { val: '06', name: 'Junio' }, 
        { val: '07', name: 'Julio' }, { val: '08', name: 'Agosto' }, { val: '09', name: 'Septiembre' }, 
        { val: '10', name: 'Octubre' }, { val: '11', name: 'Noviembre' }, { val: '12', name: 'Diciembre' } 
    ]; 
    
    return ( 
        <div className="flex items-center gap-2 bg-white dark:bg-darkbg-main p-1.5 rounded-full ring-1 ring-inset ring-zinc-300 dark:ring-darkbg-border shadow-sm"> 
            <div className="relative">
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="appearance-none block w-full rounded-md bg-transparent border-0 py-1.5 pl-3 pr-7 text-zinc-700 hover:text-zinc-900 focus:ring-0 sm:text-sm font-bold dark:text-zinc-200 dark:hover:text-white cursor-pointer transition-colors outline-none"> 
                    {months.map(m => <option key={m.val} value={m.val} className="dark:bg-darkbg-card dark:text-zinc-200">{m.name}</option>)} 
                </select>
            </div>
            <div className="h-4 w-px bg-zinc-300 dark:bg-darkbg-border"></div>
            <div className="relative">
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="appearance-none block w-full rounded-md bg-transparent border-0 py-1.5 pl-2 pr-7 text-zinc-700 hover:text-zinc-900 focus:ring-0 sm:text-sm font-bold dark:text-zinc-200 dark:hover:text-white cursor-pointer transition-colors outline-none"> 
                    {years.map(y => <option key={y} value={y.toString()} className="dark:bg-darkbg-card dark:text-zinc-200">{y}</option>)} 
                </select>
            </div>
        </div> 
    ); 
}