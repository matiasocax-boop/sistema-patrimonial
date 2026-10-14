import React from 'react';
import { getLogoPorDependencia } from '../utils/helpers';

export default function Sidebar({ 
    isSidebarOpen, setIsSidebarOpen, appLogo, activeTab, setActiveTab, isAdmin, solicitudesBaja, dependenciaActual, onExportBackup 
}) {
    // Logo oficial del sistema (blanco, para fondos oscuros) + sello (para fondos claros y PDFs).
    const LOGO_SISTEMA = '/UNP-Site-Logo.png';
    const logoDep = getLogoPorDependencia(dependenciaActual);
    const closeBtn = (
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-darkbg-main dark:text-zinc-400 dark:hover:bg-darkbg-hover dark:hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark"></i>
        </button>
    );

    return (
        <>
            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-zinc-900/60 z-40 lg:hidden animate-fade-in backdrop-blur-sm"></div>
            )}

            {/* ASIDE CON MEJOR CONTRASTE EN MODO OSCURO */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white dark:bg-darkbg-card border-r border-zinc-200 dark:border-darkbg-border shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 antialiased ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                
                {appLogo ? (
                <div className="flex h-[90px] shrink-0 items-center justify-between px-7 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200 dark:border-zinc-700/80 overflow-hidden p-1.5">
                            <img
                                src={appLogo}
                                alt="Logo Institucional"
                                className="w-full h-full object-contain filter drop-shadow-xs"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 title="Dpto. Bienes Patrimoniales" className="text-[13px] font-black tracking-tight leading-snug text-zinc-900 dark:text-white">Dpto. Bienes Patrimoniales</h1>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5 leading-relaxed">Universidad Nacional de Pilar</p>
                        </div>
                    </div>
                    {closeBtn}
                </div>
                ) : (<>
                {/* Modo oscuro: logo oficial blanco horizontal */}
                <div className="hidden dark:flex flex-col gap-2 px-5 py-4 shrink-0 border-b border-darkbg-border bg-darkbg-card">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 flex-1 items-center overflow-hidden rounded-xl border border-white/10 bg-[#0a1f44] px-4">
                            <img
                                src={LOGO_SISTEMA}
                                alt="Universidad Nacional de Pilar"
                                className="h-full w-full object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                        {closeBtn}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dpto. Bienes Patrimoniales</p>
                </div>
                {/* Modo claro: sello institucional */}
                <div className="flex dark:hidden h-[90px] shrink-0 items-center justify-between px-7 border-b border-zinc-100 bg-white">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden p-1.5">
                            <img
                                src={logoDep}
                                alt="Logo Institucional"
                                className="w-full h-full object-contain filter drop-shadow-xs"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/publiclogo_unp.png'; }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 title="Dpto. Bienes Patrimoniales" className="text-[13px] font-black tracking-tight leading-snug text-zinc-900">Dpto. Bienes Patrimoniales</h1>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 leading-relaxed">Universidad Nacional de Pilar</p>
                        </div>
                    </div>
                    {closeBtn}
                </div>
                </>)}
                
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                    <div className="px-3 pb-3">
                        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Navegación</span>
                    </div>

                    {[ 
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie' },
                        { id: 'inventario', label: 'Inventario General', icon: 'fa-boxes-stacked' },
                        { id: 'funcionarios', label: 'Plantel de Funcionarios', icon: 'fa-address-book' },
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
                                className={`group flex w-full items-center gap-x-3.5 rounded-xl px-3 py-3 text-[13px] font-bold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                                    isActive 
                                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                                        : 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-darkbg-main dark:hover:text-white'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-8 transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>
                                    <i className={`fa-solid ${tab.icon} text-[16px]`}></i>
                                </div>
                                <span className="flex-1 text-left tracking-tight truncate">{tab.label}</span>
                                
                                {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-black shadow-sm ${isActive ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                        {solicitudesBaja.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* BOTÓN DE BACKUP GENERAL PARA ADMINISTRADORES */}
                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-darkbg-border px-1">
                            <span className="block px-2 pb-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                Seguridad y Datos
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onExportBackup) onExportBackup();
                                    setIsSidebarOpen(false);
                                }}
                                className="group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-[12px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border border-zinc-200/80 dark:border-white/5 transition-all cursor-pointer shadow-xs active:scale-98"
                                title="Descargar copia de seguridad íntegra de la base de datos"
                            >
                                <div className="flex items-center justify-center w-6 text-zinc-500 dark:text-zinc-400 group-hover:text-brand-primary dark:group-hover:text-blue-400 transition-colors">
                                    <i className="fa-solid fa-database text-xs"></i>
                                </div>
                                <span className="flex-1 text-left tracking-tight">Copia de Seguridad (.json)</span>
                                <i className="fa-solid fa-download text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"></i>
                            </button>
                        </div>
                    )}
                </nav>
            </aside>
        </>
    );
}
