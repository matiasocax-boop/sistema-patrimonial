// frontend/src/components/SimpleBar.jsx
import React from 'react';

function SimpleBar({ label, value, max, colorClass, bgClass, onClick, title }) {
    const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    const interactive = typeof onClick === 'function';

    return (
        <div
            className={`w-full flex flex-col gap-1.5 ${interactive ? 'cursor-pointer group/sbar rounded-lg focus-visible:ring-2 focus-visible:ring-brand-primary outline-none' : ''}`}
            onClick={onClick}
            title={title}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
        >
            <div className="flex justify-between items-center text-xs font-bold">
                <span className={`text-zinc-700 dark:text-zinc-300 truncate pr-2 ${interactive ? 'group-hover/sbar:text-zinc-900 dark:group-hover:text-white' : ''}`}>{label}</span>
                <span className="text-zinc-900 dark:text-white shrink-0 tabular-nums">{value}</span>
            </div>
            <div className={`w-full h-2.5 rounded-full ${bgClass || 'bg-zinc-100 dark:bg-darkbg-main'} overflow-hidden shadow-inner`}>
                <div className={`h-full ${colorClass} rounded-full transition-all duration-1000 relative ${interactive ? 'group-hover/sbar:brightness-110' : ''}`} style={{ width: `${percent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                </div>
            </div>
        </div>
    );
}

export default SimpleBar;