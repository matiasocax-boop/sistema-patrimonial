import React from 'react';
import { getLogoPorDependencia, APP_VERSION } from '../utils/helpers';

export default function Sidebar({ 
    isSidebarOpen, setIsSidebarOpen, appLogo, activeTab, setActiveTab, isAdmin, esDesarrollador, solicitudesBaja, dependenciaActual, onExportBackup,
    mantenimiento, onOpenMantenimiento, onOpenDependencias
}) {
    // Logo oficial del sistema (blanco para modo oscuro, negro para modo claro) + sello (respaldo).
    // WebP en UI (liviano); los PDF siguen usando PNG.
    const LOGO_SISTEMA = '/UNP-Site-Logo.webp';
    const LOGO_SISTEMA_NEGRO = '/UNP-Site-Logo-negro.webp';
    const LOGO_SISTEMA_PNG = '/UNP-Site-Logo.png';
    const logoDep = getLogoPorDependencia(dependenciaActual, 'webp');
    const closeBtn = (
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-darkbg-main dark:text-zinc-400 dark:hover:bg-darkbg-hover dark:hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark"></i>
        </button>
    );
    const brandCaption = (
        <div className="mt-3 flex items-center gap-2.5">
            <span className="h-px w-4 dep-accent-bar opacity-80"></span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Dpto. Bienes Patrimoniales</p>
        </div>
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
                ) : (
                <div className="shrink-0 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card px-5 py-5">
                    <div className="flex items-center gap-3">
                        {/* Modo oscuro: lockup oficial blanco */}
                        <img
                            src={LOGO_SISTEMA}
                            alt="Universidad Nacional de Pilar"
                            className="hidden dark:block h-12 w-auto max-w-[195px] object-contain object-left"
                            onError={(e) => { e.target.onerror = null; e.target.src = LOGO_SISTEMA_PNG; }}
                        />
                        {/* Modo claro: lockup oficial negro */}
                        <img
                            src={LOGO_SISTEMA_NEGRO}
                            alt="Universidad Nacional de Pilar"
                            className="dark:hidden h-12 w-auto max-w-[195px] object-contain object-left"
                            onError={(e) => { e.target.onerror = null; e.target.src = logoDep; }}
                        />
                        <div className="flex-1" />
                        {closeBtn}
                    </div>
                    {brandCaption}
                </div>
                )}
                
                <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar" aria-label="Navegación principal">
                    <p className="px-3 pb-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em]">Navegación</p>

                    {[
                        { id: 'dashboard', label: 'Panel Principal', icon: 'fa-chart-pie' },
                        { id: 'resumen', label: 'Mi Dependencia', icon: 'fa-house-user' },
                        { id: 'inventario', label: 'Inventario General', icon: 'fa-boxes-stacked' },
                        { id: 'funcionarios', label: 'Plantel de Funcionarios', icon: 'fa-address-book' },
                        { id: 'fc04', label: 'Altas y Bajas (FC-04)', icon: 'fa-file-invoice' },
                        { id: 'fc10', label: 'Asignaciones (FC-10)', icon: 'fa-file-signature' },
                        { id: 'fc11', label: 'Traslados (FC-11)', icon: 'fa-truck-fast' },
                        ...(isAdmin ? [
                            { id: 'aprobaciones', label: 'Aprobaciones', icon: 'fa-check-to-slot' },
                            { id: 'auditoria', label: 'Auditoría', icon: 'fa-magnifying-glass-chart' },
                            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'fa-users-gear' }
                        ] : []),
                        ...(esDesarrollador ? [
                            { id: 'anuncios', label: 'Anuncios', icon: 'fa-bullhorn' }
                        ] : []),
                        { id: 'ayuda', label: 'Centro de Ayuda', icon: 'fa-circle-question' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} 
                                aria-current={isActive ? 'page' : undefined}
                                title={tab.label}
                                data-tour={`nav-${tab.id}`}
                                className={`group flex w-full items-center gap-3 rounded-xl px-3 h-11 text-[13px] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                                    isActive 
                                        ? 'bg-brand-primary text-white font-bold shadow-sm' 
                                        : 'bg-transparent font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <span className={`flex items-center justify-center w-7 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'}`}>
                                    <i className={`fa-solid ${tab.icon} text-[15px]`}></i>
                                </span>
                                <span className="flex-1 text-left tracking-tight truncate">{tab.label}</span>
                                
                                {tab.id === 'aprobaciones' && solicitudesBaja.length > 0 && (
                                    <span className={`flex h-5 min-w-5 px-1 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>
                                        {solicitudesBaja.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* BOTÓN DE BACKUP GENERAL PARA ADMINISTRADORES */}
                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-zinc-200/70 dark:border-white/10 px-0">
                            <p className="px-3 pb-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em]">
                                Administración
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onExportBackup) onExportBackup();
                                    setIsSidebarOpen(false);
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl px-3 h-11 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                                title="Descargar copia de seguridad íntegra de la base de datos"
                            >
                                <span className="flex items-center justify-center w-7 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                                    <i className="fa-solid fa-database text-[15px]"></i>
                                </span>
                                <span className="flex-1 text-left tracking-tight truncate">Copia de Seguridad (.json)</span>
                                <i className="fa-solid fa-download text-[11px] text-zinc-300 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 shrink-0"></i>
                            </button>
                            {esDesarrollador && (
                            <button
                                type="button"
                                onClick={() => { if (onOpenMantenimiento) onOpenMantenimiento(); setIsSidebarOpen(false); }}
                                className="group flex w-full items-center gap-3 rounded-xl px-3 h-11 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary mt-1"
                                title="Activar aviso de mantenimiento para todos los usuarios (solo desarrollador)"
                            >
                                <span className="flex items-center justify-center w-7 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                                    <i className="fa-solid fa-screwdriver-wrench text-[15px]"></i>
                                </span>
                                <span className="flex-1 text-left tracking-tight truncate">Aviso de mantenimiento</span>
                                {mantenimiento?.en_mantenimiento ? (
                                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" title="Mantenimiento activo"></span>
                                ) : (
                                    <i className="fa-solid fa-chevron-right text-[11px] text-zinc-300 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 shrink-0"></i>
                                )}
                            </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { if (onOpenDependencias) onOpenDependencias(); setIsSidebarOpen(false); }}
                                className="group flex w-full items-center gap-3 rounded-xl px-3 h-11 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary mt-1"
                                title="Gestionar catálogo de dependencias y fusionar duplicadas"
                            >
                                <span className="flex items-center justify-center w-7 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                                    <i className="fa-solid fa-building-columns text-[15px]"></i>
                                </span>
                                <span className="flex-1 text-left tracking-tight truncate">Dependencias</span>
                                <i className="fa-solid fa-chevron-right text-[11px] text-zinc-300 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 shrink-0"></i>
                            </button>
                        </div>
                    )}
                </nav>
                <div className="shrink-0 px-5 py-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">v{APP_VERSION}</span>
                    <span className="text-[10px] font-medium text-zinc-300 dark:text-zinc-600">UNP · Patrimonio</span>
                </div>
            </aside>
        </>
    );
}
