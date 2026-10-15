import React, { useState } from 'react';

export default function Header({
    setIsSidebarOpen, activeTab, setActiveTab, setIsScannerOpen, pdfPaperSize, setPdfPaperSize,
    dependenciaActual, setDependenciaActual, todasDependencias, clearAllFilters,
    darkMode, setDarkMode, isNotifOpen, setIsNotifOpen, unreadCount,
    misNotificaciones, markAsRead, onMarkAllRead, currentUser, isAdmin, handleLogout
}) {
    const [filtroNotif, setFiltroNotif] = useState('todas');
    const notifsVisibles = filtroNotif === 'noleidas'
        ? misNotificaciones.filter(n => !n.leido)
        : misNotificaciones;
    const TITULOS = {
        dashboard: 'Panel Principal',
        resumen: 'Mi Dependencia',
        inventario: 'Inventario General',
        funcionarios: 'Plantel de Funcionarios',
        fc04: 'Registro FC-04',
        fc10: 'Registro FC-10',
        fc11: 'Registro FC-11',
        aprobaciones: 'Aprobaciones',
        auditoria: 'Auditoría',
        usuarios: 'Directorio de Usuarios',
        ayuda: 'Centro de Ayuda'
    };
    return (
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between bg-white/90 dark:bg-darkbg-card/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 border-b border-zinc-200/80 dark:border-darkbg-border transition-all">
             <div className="flex items-center gap-3 min-w-0">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all cursor-pointer border border-zinc-200/80 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                    title="Abrir menú"
                >
                    <i className="fa-solid fa-bars"></i>
                </button>

                <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white truncate hidden sm:block">
                   {TITULOS[activeTab] || 'Panel Principal'}
                </h1>
             </div>

             <div className="flex items-center gap-2 sm:gap-3">
                <button 
                    onClick={() => setIsScannerOpen(true)} 
                    title="Escanear código QR"
                    data-tour="scan"
                    className="hidden md:inline-flex items-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 px-4 h-10 rounded-xl text-[13px] font-bold transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                >
                    <i className="fa-solid fa-qrcode text-xs"></i> Escanear QR
                </button>
                <button
                    onClick={() => setIsScannerOpen(true)}
                    title="Escanear código QR"
                    className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                >
                    <i className="fa-solid fa-qrcode text-sm"></i>
                </button>

                <div className="hidden lg:flex items-center gap-2">
                    <div className="relative flex items-center">
                      <i className="fa-regular fa-file-pdf text-zinc-400 absolute left-3.5 text-xs pointer-events-none"></i>
                      <select title="Tamaño de papel para PDFs" className="appearance-none bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 text-[13px] font-semibold rounded-xl pl-9 pr-8 h-10 outline-none cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-brand-primary" value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value)}>
                        <option value="a4">Formato A4</option>
                        <option value="legal">Oficio</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-3 text-[10px] text-zinc-400 pointer-events-none"></i>
                    </div>

                    <div className="relative flex items-center">
                      <i className={`fa-solid ${isAdmin ? 'fa-building-columns' : 'fa-lock'} text-zinc-400 absolute left-3.5 text-xs pointer-events-none`}></i>
                      <select 
                         className={`appearance-none text-[13px] font-semibold rounded-xl pl-9 pr-8 h-10 outline-none transition-all max-w-[200px] truncate focus-visible:ring-2 focus-visible:ring-brand-primary ${isAdmin ? 'bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-pointer' : 'bg-transparent border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'}`} 
                         value={dependenciaActual} 
                         onChange={(e) => { setDependenciaActual(e.target.value); clearAllFilters(); }}
                         disabled={!isAdmin}
                         title={!isAdmin ? "Su cuenta está restringida a esta dependencia" : "Cambiar entorno de trabajo"}
                      >
                        {!isAdmin ? (
                            <option value={dependenciaActual}>{dependenciaActual}</option>
                        ) : (
                            todasDependencias.map(dep => <option key={dep} value={dep}>{dep}</option>)
                        )}
                      </select>
                      {isAdmin && <i className="fa-solid fa-chevron-down absolute right-4 text-[10px] text-zinc-400 pointer-events-none"></i>}
                    </div>
                </div>

                <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                    <button onClick={() => setDarkMode(!darkMode)} className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" title="Alternar tema claro / oscuro">
                        <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    
                    <div className="relative flex items-center">
                        {isNotifOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>}
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} title="Notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all cursor-pointer z-50 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                            <i className="fa-regular fa-bell"></i>
                            {unreadCount > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-darkbg-card"></span>}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white dark:bg-darkbg-card shadow-2xl border border-zinc-200/80 dark:border-darkbg-border rounded-[24px] z-50 overflow-hidden flex flex-col animate-slide-up origin-top-right">
                                <div className="px-5 py-4 border-b border-zinc-100 dark:border-darkbg-border bg-zinc-50/80 dark:bg-darkbg-main/80 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-[13px] font-black tracking-tight text-zinc-900 dark:text-white uppercase">Notificaciones</h3>
                                        {unreadCount > 0 ? (
                                            <button onClick={() => onMarkAllRead && onMarkAllRead()} className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer">
                                                Marcar leídas
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-zinc-400">Al día</span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 p-1">
                                        {[
                                            { id: 'todas', label: `Todas (${misNotificaciones.length})` },
                                            { id: 'noleidas', label: `No leídas (${unreadCount})` }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setFiltroNotif(t.id)}
                                                className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filtroNotif === t.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-y-auto max-h-[350px] custom-scrollbar bg-white dark:bg-darkbg-card">
                                    {notifsVisibles.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center opacity-50">
                                            <i className="fa-regular fa-bell-slash text-3xl mb-3 text-zinc-400"></i> 
                                            <span className="text-xs font-bold text-zinc-500">{filtroNotif === 'noleidas' ? 'Sin notificaciones pendientes' : 'Bandeja vacía'}</span>
                                        </div>
                                    ) : (
                                        notifsVisibles.map(n => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => {
                                                    markAsRead(n);
                                                    if (n.esSolicitud && setActiveTab) {
                                                        setActiveTab('aprobaciones');
                                                        setIsNotifOpen(false);
                                                    }
                                                }} 
                                                className={`p-5 border-b border-zinc-50 dark:border-darkbg-border/50 hover:bg-zinc-50 dark:hover:bg-darkbg-hover cursor-pointer transition-colors relative ${!n.leido ? 'bg-zinc-50/80 dark:bg-zinc-800/40' : ''}`}
                                            >
                                                {!n.leido && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary shadow-[0_0_8px_rgba(30,58,138,0.5)]"></div>}
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                                                        n.esSolicitud 
                                                            ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                                                            : n.accion === 'aprobar' 
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50' 
                                                                : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
                                                    }`}>
                                                        <i className={`fa-solid ${n.esSolicitud ? 'fa-paper-plane' : n.accion === 'aprobar' ? 'fa-check' : 'fa-xmark'} text-[13px]`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className={`text-[13px] text-zinc-900 dark:text-white leading-tight tracking-tight ${!n.leido ? 'font-black' : 'font-bold'}`}>{n.titulo}</p>
                                                            {n.esSolicitud && (
                                                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                                                    Revisar
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed">{n.mensaje}</p>
                                                        <p className="text-[10px] font-bold text-zinc-400 mt-2.5 uppercase tracking-widest">{new Date(n.fecha).toLocaleString('es-PY', {dateStyle: 'short', timeStyle: 'short'})}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 pl-2 sm:pl-3 ml-1 border-l border-zinc-200 dark:border-white/10">
                    <div className="flex-col text-right hidden xl:flex leading-tight">
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate max-w-[140px]">{currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Usuario'}</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.14em] mt-0.5">
                            {isAdmin ? (currentUser?.role === 'dev' ? 'Desarrollador' : 'Administrador') : 'Funcionario'}
                        </span>
                    </div>
                    <div title={currentUser?.nombre || 'Usuario'} className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold select-none">
                        {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" title="Cerrar sesión">
                        <i className="fa-solid fa-power-off"></i>
                    </button>
                </div>
             </div>
        </header>
    );
}