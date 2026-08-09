import React from 'react';

export default function Header({
    setIsSidebarOpen,
    activeTab,
    setIsScannerOpen,
    pdfPaperSize,
    setPdfPaperSize,
    dependenciaActual,
    setDependenciaActual,
    todasDependencias,
    clearAllFilters,
    darkMode,
    setDarkMode,
    isNotifOpen,
    setIsNotifOpen,
    unreadCount,
    misNotificaciones,
    markAsRead,
    currentUser,
    isAdmin,
    handleLogout
}) {
    return (
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between bg-white/80 dark:bg-darkbg-card/80 px-4 sm:px-8 border-b border-zinc-200/80 dark:border-darkbg-border/80 backdrop-blur-md shadow-xs transition-all">
             <div className="flex items-center gap-x-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-all cursor-pointer"
                    title="Abrir Menú"
                >
                    <i className="fa-solid fa-bars text-lg"></i>
                </button>

                <span className="hidden sm:flex h-3 w-3 rounded-full bg-brand-primary animate-pulse"></span>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white capitalize truncate max-w-[180px] sm:max-w-none">
                   {activeTab === 'dashboard' ? 'Panel Principal' : activeTab === 'inventario' ? 'Directorio Patrimonial' : activeTab === 'usuarios' ? 'Directorio de Usuarios' : activeTab.replace('fc', 'Registro FC-')}
                </h1>
             </div>

             <div className="flex items-center gap-x-4">
                <button 
                    onClick={() => setIsScannerOpen(true)} 
                    className="inline-flex items-center gap-1.5 bg-brand-primary text-white hover:bg-brand-hover px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Escanear QR con Cámara"
                >
                    <i className="fa-solid fa-camera"></i> <span className="hidden md:inline">Escanear QR</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 bg-zinc-100/70 dark:bg-darkbg-main/70 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-darkbg-border/60">
                    <div className="relative flex items-center rounded-xl bg-white dark:bg-darkbg-card shadow-xs px-3 py-1.5 transition-all hover:shadow-sm">
                      <i className="fa-regular fa-file-pdf text-brand-primary text-sm mr-2"></i>
                      <select className="appearance-none bg-transparent pr-6 text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer" value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value)}>
                        <option value="a4" className="dark:bg-darkbg-card">A4</option>
                        <option value="legal" className="dark:bg-darkbg-card">Oficio</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-2 text-[9px] text-zinc-400 pointer-events-none"></i>
                    </div>

                    <div className="relative flex items-center rounded-xl bg-white dark:bg-darkbg-card shadow-xs px-3 py-1.5 transition-all hover:shadow-sm">
                      <i className="fa-solid fa-building-columns text-brand-primary text-sm mr-2"></i>
                      <select className="appearance-none bg-transparent pr-6 text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate" value={dependenciaActual} onChange={(e) => { setDependenciaActual(e.target.value); clearAllFilters(); }}>
                        {todasDependencias.map(dep => <option key={dep} value={dep} className="dark:bg-darkbg-card">{dep}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-2 text-[9px] text-zinc-400 pointer-events-none"></i>
                    </div>
                </div>

                <div className="h-6 w-px bg-zinc-200 dark:bg-darkbg-border mx-1"></div>

                <div className="flex items-center gap-1">
                    <button onClick={() => setDarkMode(!darkMode)} className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:text-brand-primary hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-all cursor-pointer shadow-xs" title="Modo Claro/Oscuro">
                        <i className={`fa-solid text-base ${darkMode ? 'fa-sun text-yellow-500' : 'fa-moon'}`}></i>
                    </button>
                    
                    <div className="relative flex items-center">
                        {isNotifOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>}
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:text-brand-primary hover:bg-zinc-100 dark:hover:bg-darkbg-hover transition-all cursor-pointer z-50 shadow-xs" title="Notificaciones">
                            <i className="fa-solid fa-bell text-base"></i>
                            {unreadCount > 0 && <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-darkbg-card"></span>}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-darkbg-card shadow-xl border border-zinc-200 dark:border-darkbg-border rounded-2xl z-50 overflow-hidden flex flex-col animate-slide-up origin-top-right">
                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-darkbg-border flex justify-between items-center bg-zinc-50/50 dark:bg-darkbg-main/50">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Notificaciones</h3>
                                    {unreadCount > 0 && <span className="bg-brand-light text-brand-dark dark:bg-brand-primary/20 dark:text-brand-accent text-xs px-2 py-0.5 rounded-md font-bold">{unreadCount} nuevas</span>}
                                </div>
                                <div className="overflow-y-auto max-h-80 custom-scrollbar bg-white dark:bg-darkbg-card">
                                    {misNotificaciones.length === 0 ? (
                                        <div className="p-6 text-center text-zinc-500 text-sm font-medium"><i className="fa-regular fa-bell-slash text-2xl mb-2 opacity-50 block"></i> No tienes notificaciones.</div>
                                    ) : (
                                        misNotificaciones.map(n => (
                                            <div key={n.id} onClick={() => markAsRead(n)} className={`p-4 border-b border-zinc-50 dark:border-darkbg-border/50 hover:bg-zinc-50 dark:hover:bg-darkbg-hover cursor-pointer transition-colors relative ${!n.leido ? 'bg-brand-light/20 dark:bg-brand-primary/5' : ''}`}>
                                                {!n.leido && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>}
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.accion === 'aprobar' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        <i className={`fa-solid ${n.accion === 'aprobar' ? 'fa-check' : 'fa-xmark'}`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] text-zinc-900 dark:text-white leading-tight ${!n.leido ? 'font-bold' : 'font-medium'}`}>{n.titulo}</p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">{n.mensaje}</p>
                                                        <p className="text-[10px] text-zinc-400 font-mono mt-1.5">{new Date(n.fecha).toLocaleString('es-PY', {dateStyle: 'short', timeStyle: 'short'})}</p>
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

                <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-darkbg-border">
                    <div className="flex items-center gap-3 bg-zinc-100/80 dark:bg-darkbg-main/80 px-3.5 py-1.5 rounded-2xl border border-zinc-200/50 dark:border-darkbg-border/50 shadow-xs">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-white font-black text-xs shadow-xs">
                            {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Usuario'}</span>
                            <span className="text-[10px] font-extrabold uppercase text-brand-primary dark:text-brand-accent tracking-wider">
                                {isAdmin ? 'Admin' : 'Personal'}
                            </span>
                        </div>
                    </div>
                    
                    <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-xs cursor-pointer" title="Cerrar Sesión">
                        <i className="fa-solid fa-power-off text-sm"></i>
                    </button>
                </div>
             </div>
          </header>
    );
}