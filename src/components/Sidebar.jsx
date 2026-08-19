import React from 'react';

export default function Sidebar({ 
    isSidebarOpen, 
    setIsSidebarOpen, 
    appLogo, 
    activeTab, 
    setActiveTab, 
    isAdmin, 
    solicitudesBaja 
}) {
    return (
        <>
            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"></div>
            )}

            {/* ASIDE REDISEÑADO CON FONDO LIMPIO */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-zinc-50 dark:bg-darkbg-main border-r border-zinc-200/60 dark:border-darkbg-border shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                
                {/* ENCABEZADO DEL SIDEBAR */}
                <div className="flex h-[90px] shrink-0 items-center justify-between px-7 border-b border-zinc-200/60 dark:border-darkbg-border/60 bg-white/50 dark:bg-darkbg-card/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-darkbg-card border border-zinc-200/80 dark:border-darkbg-border shadow-sm overflow-hidden p-2 text-brand-primary">
                            {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-contain" /> : <i className="fa-solid fa-landmark text-xl"></i>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-[15px] font-black tracking-tight text-zinc-900 dark:text-white truncate">Patrimonio UNP</h1>
                            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Gestión Institucional</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:bg-darkbg-card dark:hover:bg-darkbg-hover transition-colors cursor-pointer">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                {/* NAVEGACIÓN CON BOTONES ESTILO PÍLDORA */}
                <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-2.5 custom-scrollbar">
                    <div className="px-2 pb-3">
                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Navegación</span>
                    </div>

                    {[ 
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400' },
                        { id: 'inventario', label: 'Directorio de Bienes', icon: 'fa-boxes-stacked', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
                        { id: 'fc04', label: 'Altas y Bajas (FC-04)', icon: 'fa-file-invoice', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
                        { id: 'fc10', label: 'Asignaciones (FC-10)', icon: 'fa-file-signature', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
                        { id: 'fc11', label: 'Traslados (FC-11)', icon: 'fa-truck-fast', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
                        ...(isAdmin ? [
                            { id: 'aprobaciones', label: 'Aprobaciones', icon: 'fa-check-to-slot', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400' },
                            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'fa-users-gear', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400' }
                        ] : []),
                        { id: 'ayuda', label: 'Centro de Ayuda', icon: 'fa-circle-question', color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} 
                                className={`group flex w-full items-center gap-x-4 rounded-[20px] p-2.5 text-[13px] font-bold transition-all duration-300 cursor-pointer border ${
                                    isActive 
                                        ? 'bg-[#213f8f] dark:bg-brand-primary text-white border-transparent shadow-[0_8px_20px_rgba(33,63,143,0.25)] scale-[1.02]' 
                                        : 'bg-transparent text-zinc-500 hover:bg-white dark:hover:bg-darkbg-card border-transparent hover:border-zinc-200/60 dark:hover:border-darkbg-border hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:shadow-sm'
                                }`}
                            >
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${isActive ? 'bg-white/20 text-white shadow-inner' : tab.color}`}>
                                    <i className={`fa-solid ${tab.icon} text-[15px]`}></i>
                                </div>
                                <span className="flex-1 text-left tracking-tight truncate">{tab.label}</span>
                                
                                {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                    <span className={`flex h-5 w-5 mr-2 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'} shadow-xs animate-pulse`}>
                                        {solicitudesBaja.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}