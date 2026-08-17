// frontend/src/components/FaqItem.jsx
import React, { useState } from 'react';

function FaqItem({ question, answer }) { 
    const [isOpen, setIsOpen] = useState(false); 
    
    return ( 
        <div className="bg-white dark:bg-darkbg-card rounded-2xl border border-zinc-200/80 dark:border-darkbg-border shadow-xs hover:shadow-md overflow-hidden transition-all duration-300 mb-4"> 
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-6 py-4 flex justify-between items-center text-zinc-900 dark:text-white focus:outline-none hover:bg-zinc-50/80 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"> 
                <span className="flex items-center gap-3 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-light dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent text-xs">
                        <i className="fa-solid fa-question"></i>
                    </span>
                    {question}
                </span> 
                <i className={`fa-solid fa-chevron-down text-zinc-400 transition-transform duration-300 text-xs ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}></i> 
            </button> 
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}> 
                <div className="px-6 pb-5 pt-0 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-darkbg-border/60 pt-4 mt-1">{answer}</div> 
            </div> 
        </div> 
    ); 
}

export default FaqItem;