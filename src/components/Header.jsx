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
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between bg-white dark:bg-darkbg-card px-6 border-b border-zinc-200 dark:border-darkbg-border shadow-sm transition-all">
             <div className="flex items-center gap-x-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                    <i className="fa-solid fa-bars text-lg"></i>
                </button>

                <h1 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 capitalize truncate">
                   {activeTab === 'dashboard' ? 'Panel Principal' : activeTab === 'inventario' ? 'Directorio Patrimonial' : activeTab === 'usuarios' ? 'Directorio de Usuarios' : activeTab.replace('fc', 'Registro FC-')}
                </h1>
             </div>

             <div className="flex items-center gap-x-4 sm:gap-x-6">
                <button 
                    onClick={() => setIsScannerOpen(true)} 
                    className="hidden sm:inline-flex items-center gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
                >
                    <i className="fa-solid fa-qrcode"></i> Escanear QR
                </button>

                <div className="hidden md:flex items-center gap-3">
                    <div className="relative flex items-center">
                      <i className="fa-regular fa-file-pdf text-zinc-400 absolute left-3 text-sm"></i>
                      <select className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm rounded-lg pl-9 pr-8 py-2 outline-none cursor-pointer focus:border-zinc-400 dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-300 font-medium transition-colors" value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value)}>
                        <option value="a4">Formato A4</option>
                        <option value="legal">Oficio</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-3 text-[10px] text-zinc-400 pointer-events-none"></i>
                    </div>

                    <div className="relative flex items-center">
                      <i className="fa-solid fa-building-columns text-zinc-400 absolute left-3 text-sm"></i>
                      <select className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm rounded-lg pl-9 pr-8 py-2 outline-none cursor-pointer focus:border-zinc-400 max-w-[200px] truncate dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-300 font-medium transition-colors" value={dependenciaActual} onChange={(e) => { setDependenciaActual(e.target.value); clearAllFilters(); }}>
                        {todasDependencias.map(dep => <option key={dep} value={dep} className="dark:bg-darkbg-card">{dep}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-3 text-[10px] text-zinc-400 pointer-events-none"></i>
                    </div>
                </div>

                <div className="h-6 w-px bg-zinc-200 dark:bg-darkbg-border hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setDarkMode(!darkMode)} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-white transition-colors cursor-pointer" title="Alternar Tema">
                        <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    
                    <div className="relative flex items-center">
                        {isNotifOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>}
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-darkbg-hover dark:hover:text-white transition-colors cursor-pointer z-50">
                            <i className="fa-regular fa-bell text-lg"></i>
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-darkbg-card"></span>}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-darkbg-card shadow-lg border border-zinc-200 dark:border-darkbg-border rounded-xl z-50 overflow-hidden flex flex-col animate-slide-up origin-top-right">
                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-darkbg-border flex justify-between items-center bg-zinc-50 dark:bg-darkbg-main">
                                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Notificaciones</h3>
                                    {unreadCount > 0 && <span className="bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{unreadCount} nuevas</span>}
                                </div>
                                <div className="overflow-y-auto max-h-80 custom-scrollbar bg-white dark:bg-darkbg-card">
                                    {misNotificaciones.length === 0 ? (
                                        <div className="p-6 text-center text-zinc-500 text-sm"><i className="fa-regular fa-bell-slash text-xl mb-2 block"></i> Sin notificaciones</div>
                                    ) : (
                                        misNotificaciones.map(n => (
                                            <div key={n.id} onClick={() => markAsRead(n)} className={`p-4 border-b border-zinc-50 dark:border-darkbg-border/50 hover:bg-zinc-50 dark:hover:bg-darkbg-hover cursor-pointer transition-colors relative ${!n.leido ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''}`}>
                                                {!n.leido && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-primary"></div>}
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.accion === 'aprobar' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        <i className={`fa-solid ${n.accion === 'aprobar' ? 'fa-check' : 'fa-xmark'} text-[10px]`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm text-zinc-800 dark:text-zinc-200 leading-tight ${!n.leido ? 'font-semibold' : 'font-medium'}`}>{n.titulo}</p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{n.mensaje}</p>
                                                        <p className="text-[10px] text-zinc-400 mt-2">{new Date(n.fecha).toLocaleString('es-PY', {dateStyle: 'short', timeStyle: 'short'})}</p>
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

                <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-darkbg-border">
                    <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Usuario'}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isAdmin ? 'Administrador' : 'Personal'}
                        </span>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-darkbg-main text-brand-primary dark:text-brand-accent font-bold text-sm border border-zinc-200 dark:border-darkbg-border">
                        {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors cursor-pointer ml-1" title="Cerrar Sesión">
                        <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
                    </button>
                </div>
             </div>
          </header>
    );
}