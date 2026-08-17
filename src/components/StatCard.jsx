import React from 'react';

export default function StatCard({ title, value, subtitle, icon, colorClass, bgIconClass }) {
  // Ajuste dinámico de tamaño si el valor es un texto o monto largo
  const isLongValue = String(value || '').length > 10;
  const textSizeClass = isLongValue ? "text-xl sm:text-2xl font-extrabold" : "text-2xl sm:text-3xl font-black";

  return (
    <div className="group relative bg-white dark:bg-darkbg-card rounded-2xl border border-zinc-200/80 dark:border-darkbg-border/80 p-6 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default">
      {/* Indicador de brillo superior en hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
            {title}
          </p>
          <h3 className={`${textSizeClass} tracking-tight ${colorClass} truncate`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
              {subtitle}
            </p>
          )}
        </div>

        {/* Cápsula de icono destacada */}
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bgIconClass} ${colorClass} shadow-xs group-hover:scale-110 transition-transform duration-300`}>
          <i className={`fa-solid ${icon} text-2xl`}></i>
        </div>
      </div>
    </div>
  );
}