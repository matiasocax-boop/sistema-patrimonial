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
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-zinc-900/60 z-40 lg:hidden animate-fade-in"></div>
            )}

            {/* ASIDE SÓLIDO, NITIDO Y CON ANTIALIASED */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white dark:bg-darkbg-card border-r border-zinc-200 dark:border-darkbg-border shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 antialiased ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                
                {/* ENCABEZADO CON ALTO CONTRASTE */}
                <div className="flex h-[90px] shrink-0 items-center justify-between px-7 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 dark:bg-darkbg-main border border-zinc-200/80 dark:border-darkbg-border shadow-sm overflow-hidden p-2 text-brand-primary">
                            {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-contain" /> : <i className="fa-solid fa-landmark text-xl"></i>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-[15px] font-black tracking-tight text-zinc-900 dark:text-white truncate">Patrimonio UNP</h1>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">Gestión Institucional</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-darkbg-main dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                {/* NAVEGACIÓN LIMPIA (ESTILO SAAS MODERNO) */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                    <div className="px-3 pb-3">
                        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Navegación</span>
                    </div>

                    {[ 
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie' },
                        { id: 'inventario', label: 'Directorio de Bienes', icon: 'fa-boxes-stacked' },
                        { id: 'fc04', label: 'Altas y Bajas (FC-04)', icon: 'fa-file-invoice' },
                        { id: 'fc10', label: 'Asignaciones (FC-10)', icon: 'fa-file-signature' },
                        { id: 'fc11', label: 'Traslados (FC-11)', icon: 'fa-truck-fast' },
                        ...(isAdmin ? [
                            { id: 'aprobaciones', label: 'Aprobaciones', icon: 'fa-check-to-slot' },
                            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'fa-users-gear' }
                        ] : []),
                        { id: 'ayuda', label: 'Centro de Ayuda', icon: 'fa-circle-question' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} 
                                className={`group flex w-full items-center gap-x-3.5 rounded-xl px-3 py-3 text-[13px] font-bold transition-colors cursor-pointer ${
                                    isActive 
                                        ? 'bg-zinc-900 text-white dark:bg-brand-primary shadow-md' 
                                        : 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-darkbg-hover dark:hover:text-white'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-8 transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>
                                    <i className={`fa-solid ${tab.icon} text-[16px]`}></i>
                                </div>
                                <span className="flex-1 text-left tracking-tight truncate">{tab.label}</span>
                                
                                {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
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