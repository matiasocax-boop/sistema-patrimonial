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
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"></div>
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-darkbg-card border-r border-zinc-200 dark:border-darkbg-border shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-zinc-100 dark:border-darkbg-border/50 lg:border-none">
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-brand-light shadow-2xs overflow-hidden dark:bg-darkbg-main dark:border-darkbg-border">
                            {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-contain" /> : <i className="fa-solid fa-landmark text-brand-primary text-base"></i>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-white truncate">Patrimonio UNP</h1>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-2 cursor-pointer">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
                    {[ 
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
                        { id: 'inventario', label: 'Directorio de Bienes', icon: 'fa-boxes-stacked', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
                        { id: 'fc04', label: 'Altas y Bajas (FC-04)', icon: 'fa-file-invoice', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
                        { id: 'fc10', label: 'Asignaciones (FC-10)', icon: 'fa-file-signature', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
                        { id: 'fc11', label: 'Traslados (FC-11)', icon: 'fa-truck-fast', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
                        ...(isAdmin ? [
                            { id: 'maestros', label: 'Datos Maestros', icon: 'fa-address-book', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
                            { id: 'aprobaciones', label: 'Aprobaciones', icon: 'fa-check-to-slot', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
                            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'fa-users-gear', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' }
                        ] : []),
                        { id: 'ayuda', label: 'Centro de Ayuda', icon: 'fa-circle-question', color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} 
                                className={`group flex w-full items-center gap-x-3.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-darkbg-hover dark:hover:text-white'}`}
                            >
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${isActive ? 'bg-white/20 text-white' : tab.color}`}>
                                    <i className={`fa-solid ${tab.icon} text-sm`}></i>
                                </div>
                                <span className="flex-1 text-left tracking-tight">{tab.label}</span>
                                
                                {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'} shadow-xs animate-pulse`}>
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