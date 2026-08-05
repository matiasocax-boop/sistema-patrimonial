// frontend/src/components/SimpleBar.jsx
import React from 'react';

function SimpleBar({ label, value, max, colorClass, bgClass }) { 
    const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0; 
    
    return ( 
        <div className="w-full flex flex-col gap-1.5"> 
            <div className="flex justify-between items-center text-xs font-bold"> 
                <span className="text-zinc-700 dark:text-zinc-300 truncate pr-2">{label}</span> 
                <span className="text-zinc-900 dark:text-white shrink-0">{value}</span> 
            </div> 
            <div className={`w-full h-2.5 rounded-full ${bgClass || 'bg-zinc-100 dark:bg-darkbg-main'} overflow-hidden shadow-inner`}> 
                <div className={`h-full ${colorClass} rounded-full transition-all duration-1000 relative`} style={{ width: `${percent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                </div> 
            </div> 
        </div> 
    ); 
}

export default SimpleBar;