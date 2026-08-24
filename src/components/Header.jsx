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
        <header className="sticky top-0 z-20 flex h-[90px] shrink-0 items-center justify-between bg-white/80 dark:bg-darkbg-card/80 backdrop-blur-md px-6 lg:px-10 border-b border-zinc-200/60 dark:border-darkbg-border/60 transition-all">
             <div className="flex items-center gap-x-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-50 dark:bg-darkbg-main text-zinc-500 hover:text-brand-primary dark:text-zinc-400 dark:hover:text-brand-accent transition-colors cursor-pointer border border-zinc-200/60 dark:border-darkbg-border shadow-sm"
                >
                    <i className="fa-solid fa-bars text-lg"></i>
                </button>

                <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white capitalize truncate hidden sm:block">
                   {activeTab === 'dashboard' ? 'Panel Principal' : activeTab === 'inventario' ? 'Directorio Patrimonial' : activeTab === 'usuarios' ? 'Directorio de Usuarios' : activeTab === 'ayuda' ? 'Centro de Ayuda' : activeTab.replace('fc', 'Registro FC-')}
                </h1>
             </div>

             <div className="flex items-center gap-x-3 sm:gap-x-5">
                <button 
                    onClick={() => setIsScannerOpen(true)} 
                    className="hidden md:inline-flex items-center gap-2.5 bg-zinc-900 text-white dark:bg-brand-primary hover:bg-zinc-800 dark:hover:bg-brand-hover px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                >
                    <i className="fa-solid fa-qrcode"></i> Escanear QR
                </button>

                <div className="hidden lg:flex items-center gap-3">
                    <div className="relative flex items-center group">
                      <i className="fa-regular fa-file-pdf text-zinc-400 group-hover:text-red-500 absolute left-4 text-[13px] transition-colors"></i>
                      <select className="appearance-none bg-zinc-50 border border-zinc-200/80 text-zinc-700 text-[13px] font-bold rounded-2xl pl-10 pr-9 py-2.5 outline-none cursor-pointer focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-200 transition-all shadow-sm hover:shadow" value={pdfPaperSize} onChange={(e) => setPdfPaperSize(e.target.value)}>
                        <option value="a4">Formato A4</option>
                        <option value="legal">Oficio</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-4 text-[10px] text-zinc-400 pointer-events-none"></i>
                    </div>

                    {/* SELECTOR DE DEPENDENCIA - BLOQUEADO SI NO ES ADMIN */}
                    <div className="relative flex items-center group">
                      <i className={`fa-solid ${isAdmin ? 'fa-building-columns' : 'fa-lock'} text-zinc-400 group-hover:text-brand-primary absolute left-4 text-[13px] transition-colors`}></i>
                      <select 
                         className={`appearance-none text-[13px] font-bold rounded-2xl pl-10 pr-9 py-2.5 outline-none transition-all shadow-sm max-w-[220px] truncate ${isAdmin ? 'bg-zinc-50 border border-zinc-200/80 text-zinc-700 cursor-pointer focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 hover:shadow dark:bg-darkbg-main dark:border-darkbg-border dark:text-zinc-200' : 'bg-zinc-100 border border-zinc-200/50 text-zinc-500 cursor-not-allowed dark:bg-darkbg-main/50 dark:text-zinc-500'}`} 
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

                <div className="h-8 w-px bg-zinc-200 dark:bg-darkbg-border hidden sm:block mx-1"></div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setDarkMode(!darkMode)} className="flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-darkbg-hover dark:hover:text-amber-400 border border-transparent hover:border-amber-200/50 dark:hover:border-darkbg-border transition-all cursor-pointer shadow-sm" title="Alternar Tema">
                        <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
                    </button>
                    
                    <div className="relative flex items-center">
                        {isNotifOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>}
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-500 hover:text-brand-primary hover:bg-brand-light/50 dark:hover:bg-darkbg-hover dark:hover:text-brand-accent border border-transparent hover:border-brand-primary/20 dark:hover:border-darkbg-border transition-all cursor-pointer z-50 shadow-sm">
                            <i className="fa-regular fa-bell text-lg"></i>
                            {unreadCount > 0 && <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-darkbg-card"></span>}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white dark:bg-darkbg-card shadow-2xl border border-zinc-200/80 dark:border-darkbg-border rounded-[24px] z-50 overflow-hidden flex flex-col animate-slide-up origin-top-right">
                                <div className="px-6 py-4 border-b border-zinc-100 dark:border-darkbg-border flex justify-between items-center bg-zinc-50/50 dark:bg-darkbg-main/50">
                                    <h3 className="text-[13px] font-black tracking-tight text-zinc-900 dark:text-white uppercase">Notificaciones</h3>
                                    {unreadCount > 0 && <span className="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] px-2.5 py-1 rounded-lg font-black border border-red-100 dark:border-red-900/30 shadow-sm">{unreadCount} nuevas</span>}
                                </div>
                                <div className="overflow-y-auto max-h-[350px] custom-scrollbar bg-white dark:bg-darkbg-card">
                                    {misNotificaciones.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center opacity-50">
                                            <i className="fa-regular fa-bell-slash text-3xl mb-3 text-zinc-400"></i> 
                                            <span className="text-xs font-bold text-zinc-500">Bandeja vacía</span>
                                        </div>
                                    ) : (
                                        misNotificaciones.map(n => (
                                            <div key={n.id} onClick={() => markAsRead(n)} className={`p-5 border-b border-zinc-50 dark:border-darkbg-border/50 hover:bg-zinc-50 dark:hover:bg-darkbg-hover cursor-pointer transition-colors relative ${!n.leido ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''}`}>
                                                {!n.leido && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>}
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${n.accion === 'aprobar' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'}`}>
                                                        <i className={`fa-solid ${n.accion === 'aprobar' ? 'fa-check' : 'fa-xmark'} text-[13px]`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] text-zinc-900 dark:text-white leading-tight tracking-tight ${!n.leido ? 'font-black' : 'font-bold'}`}>{n.titulo}</p>
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

                <div className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-zinc-200 dark:border-darkbg-border">
                    <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-[13px] font-black text-zinc-900 dark:text-white leading-tight tracking-tight">{currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Usuario'}</span>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">
                            {isAdmin ? 'Administrador' : 'Funcionario'}
                        </span>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover text-white font-black text-lg shadow-md shadow-brand-primary/20 ring-2 ring-brand-primary/10">
                        {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-900/30 border border-transparent transition-all cursor-pointer ml-1 shadow-sm" title="Cerrar Sesión">
                        <i className="fa-solid fa-power-off text-[17px]"></i>
                    </button>
                </div>
             </div>
          </header>
    );
}