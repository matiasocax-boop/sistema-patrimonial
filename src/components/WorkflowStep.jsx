import React from 'react';

export default function WorkflowStep({ number, title, description, icon, color }) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-darkbg-hover transition-colors">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${color}`}>
        {number}
      </div>
      <div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <i className={`fa-solid ${icon}`}></i> {title}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
