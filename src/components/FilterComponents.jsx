import React from 'react';

/**
 * Componente para renderizar un selector desplegable con icono
 */
export function SelectFilter({ icon, value, onChange, options, defaultText }) {
    const isActive = value !== '' && value !== 'ALL';
    return (
        <div className={`relative flex items-center rounded-2xl px-4 py-2.5 text-[13px] shadow-sm border transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none min-w-[140px] font-bold group ${
            isActive 
                ? 'bg-brand-light/50 text-brand-dark border-brand-primary/30 dark:bg-brand-primary/20 dark:text-brand-accent dark:border-brand-primary/50' 
                : 'bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-darkbg-card dark:text-zinc-300 dark:border-darkbg-border dark:hover:bg-darkbg-hover dark:hover:text-white'
        }`}>
            <i className={`fa-solid ${icon} mr-2.5 transition-colors ${isActive ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-brand-primary'}`}></i>
            <select value={value} onChange={onChange} className="appearance-none bg-transparent text-[13px] font-bold outline-none cursor-pointer pr-6 w-full py-0.5 text-ellipsis overflow-hidden dark:text-zinc-200">
                <option value="" className="bg-white dark:bg-darkbg-main dark:text-zinc-300 font-medium">{defaultText}</option>
                {options.map(opt => <option key={opt.value || opt} value={opt.value || opt} className="bg-white dark:bg-darkbg-main dark:text-zinc-200 font-medium">{opt.label || opt}</option>)}
            </select>
            <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none transition-colors ${isActive ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-brand-primary'}`}></i>
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
        <div className="flex items-center gap-1.5 bg-white dark:bg-darkbg-card p-1.5 rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-sm"> 
            <div className="relative hover:bg-zinc-50 dark:hover:bg-darkbg-hover rounded-xl transition-colors">
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="appearance-none block w-full rounded-xl bg-transparent border-0 py-2 pl-4 pr-8 text-zinc-700 hover:text-brand-primary focus:ring-0 text-[13px] font-bold dark:text-zinc-200 dark:hover:text-white cursor-pointer transition-colors outline-none"> 
                    {months.map(m => <option key={m.val} value={m.val} className="bg-white dark:bg-darkbg-main dark:text-zinc-200 font-medium">{m.name}</option>)} 
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none"></i>
            </div>
            <div className="h-5 w-px bg-zinc-200 dark:bg-darkbg-border mx-1"></div>
            <div className="relative hover:bg-zinc-50 dark:hover:bg-darkbg-hover rounded-xl transition-colors">
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="appearance-none block w-full rounded-xl bg-transparent border-0 py-2 pl-3 pr-8 text-zinc-700 hover:text-brand-primary focus:ring-0 text-[13px] font-bold dark:text-zinc-200 dark:hover:text-white cursor-pointer transition-colors outline-none"> 
                    {years.map(y => <option key={y} value={y.toString()} className="bg-white dark:bg-darkbg-main dark:text-zinc-200 font-medium">{y}</option>)} 
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none"></i>
            </div>
        </div> 
    ); 
}