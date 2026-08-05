// frontend/src/components/DonutChart.jsx
import React from 'react';

export default function DonutChart({ percentage = 0, colorClass = "text-brand-primary", textClass = "text-zinc-900 dark:text-white", icon = "fa-chart-pie", label = "", subtext = "" }) {
  const safePercent = Math.min(Math.max(isNaN(percentage) ? 0 : percentage, 0), 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  // Mapeo seguro de color para asegurar el trazo SVG
  let strokeColorHex = "#1e3a8a"; // Por defecto azul institucional (brand-primary)
  if (colorClass.includes("green") || colorClass.includes("emerald")) strokeColorHex = "#10b981";
  else if (colorClass.includes("purple")) strokeColorHex = "#a855f7";
  else if (colorClass.includes("amber") || colorClass.includes("yellow")) strokeColorHex = "#f59e0b";
  else if (colorClass.includes("red")) strokeColorHex = "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center p-2 group">
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Círculo de fondo (Track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-zinc-100 dark:stroke-darkbg-main"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Círculo de progreso dinámico con color explícito */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColorHex}
            className="transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Centro del gráfico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className={`text-2xl font-black tracking-tight ${textClass}`}>
            {Math.round(safePercent)}%
          </span>
        </div>
      </div>

      {/* Leyenda y Subtexto inferior */}
      <div className="mt-4 text-center">
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5">
          <i className={`fa-solid ${icon} text-xs ${colorClass}`}></i>
          {label}
        </p>
        {subtext && (
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}