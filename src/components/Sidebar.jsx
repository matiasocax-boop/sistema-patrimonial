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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white shadow-sm overflow-hidden dark:bg-darkbg-main dark:border-darkbg-border">
                            {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-contain" /> : <i className="fa-solid fa-landmark text-brand-primary text-sm"></i>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base font-medium tracking-tight text-zinc-900 dark:text-white truncate">Patrimonio UNP</h1>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-2 cursor-pointer">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                    {[ 
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie' },
                        { id: 'inventario', label: 'Directorio de Bienes', icon: 'fa-boxes-stacked' },
                        { id: 'fc04', label: 'Altas y Bajas (FC-04)', icon: 'fa-file-invoice' },
                        { id: 'fc10', label: 'Asignaciones (FC-10)', icon: 'fa-file-signature' },
                        { id: 'fc11', label: 'Traslados (FC-11)', icon: 'fa-truck-fast' },
                        ...(isAdmin ? [
                            { id: 'maestros', label: 'Datos Maestros', icon: 'fa-address-book' },
                            { id: 'aprobaciones', label: 'Aprobaciones', icon: 'fa-check-to-slot' },
                            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'fa-users-gear' }
                        ] : []),
                        { id: 'ayuda', label: 'Centro de Ayuda', icon: 'fa-circle-question' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} 
                            className={`group flex w-full items-center gap-x-3 rounded-md px-4 py-3 text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-brand-light text-brand-dark dark:bg-brand-primary/20 dark:text-brand-accent' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-darkbg-hover dark:hover:text-white'}`}
                        >
                            <i className={`fa-solid ${tab.icon} flex w-5 shrink-0 justify-center text-base ${activeTab === tab.id ? 'text-brand-primary dark:text-brand-accent' : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300'}`}></i> 
                            {tab.label}
                            {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm">
                                    {solicitudesBaja.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
}