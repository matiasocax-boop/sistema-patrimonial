// frontend/src/components/FaqItem.jsx
import React, { useState } from 'react';

function FaqItem({ question, answer }) { 
    const [isOpen, setIsOpen] = useState(false); 
    
    return ( 
        <div className="bg-white dark:bg-darkbg-card rounded-2xl border border-zinc-200 dark:border-darkbg-border shadow-sm overflow-hidden hover:shadow-google transition-shadow duration-300 mb-4 transition-all duration-200 border-l-4 border-l-brand-primary"> 
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-5 py-4 flex justify-between items-center text-zinc-900 dark:text-white focus:outline-none hover:bg-brand-light/30 dark:hover:bg-darkbg-hover transition-colors"> 
                <span className="flex items-center gap-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    <i className="fa-solid fa-circle-question text-brand-primary"></i> {question}
                </span> 
                <i className={`fa-solid fa-chevron-down text-zinc-400 transition-transform duration-300 text-xs ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}></i> 
            </button> 
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}> 
                <div className="px-11 pb-5 pt-0 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{answer}</div> 
            </div> 
        </div> 
    ); 
}

export default FaqItem;