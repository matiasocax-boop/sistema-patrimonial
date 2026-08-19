import React from 'react';

export default function LoginScreen({
    handleLogin,
    loginUser,
    setLoginUser,
    loginPass,
    setLoginPass,
    showPassword,
    setShowPassword,
    loginError,
    darkMode,
    setDarkMode,
    appLogo,
    toasts
}) {
    return (
        <div className="min-h-screen flex w-full bg-[#f8fafc] dark:bg-darkbg-main transition-colors duration-300 relative overflow-hidden font-sans">
            
            {/* SISTEMA DE TOASTS */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 min-w-[300px] rounded-xl shadow-lg text-sm font-bold bg-[#323232] text-white transition-all animate-slide-up`}>
                        <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-green-400' : t.type === 'error' ? 'fa-circle-exclamation text-red-400' : t.type === 'warning' ? 'fa-triangle-exclamation text-orange-400' : 'fa-circle-info text-blue-400'} text-lg`}></i>
                        <span className="flex-1">{t.message}</span>
                    </div>
                ))}
            </div>

            {/* PANEL IZQUIERDO - BRANDING INSTITUCIONAL */}
            <div className="hidden lg:flex w-1/2 bg-[#1a2b5e] flex-col justify-center items-center relative z-10">
                <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-2xl animate-fade-in">
                    
                    {/* Contenedor del Logo */}
                    <div className="w-40 h-40 bg-white/10 rounded-[32px] mb-8 flex items-center justify-center border border-white/5 backdrop-blur-sm shadow-sm transition-transform hover:scale-105 duration-500">
                        {appLogo ? (
                            <img src={appLogo} alt="Logo Oficial" className="w-24 h-24 object-contain drop-shadow-md" />
                        ) : (
                            <i className="fa-solid fa-landmark text-7xl text-white drop-shadow-md"></i>
                        )}
                    </div>
                    
                    <h1 className="text-4xl font-black tracking-tight text-white mb-5 leading-tight">
                        Sistema de Gestión Patrimonial
                    </h1>
                    <p className="text-[17px] text-blue-100/90 font-medium leading-relaxed max-w-md">
                        Plataforma integral para el control y trazabilidad de los bienes de la Universidad Nacional de Pilar.
                    </p>
                </div>
            </div>
            
            {/* PANEL DERECHO - FORMULARIO DE ACCESO */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
                
                {/* Botón Modo Oscuro */}
                <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer text-xl p-2" 
                    title="Alternar Tema"
                >
                    <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                
                <div className="w-full max-w-[420px] bg-white dark:bg-darkbg-card rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-zinc-100 dark:border-darkbg-border animate-slide-up">
                    
                    <div className="mb-8 pb-6 border-b border-zinc-100 dark:border-darkbg-border">
                        <h2 className="text-[22px] font-black text-zinc-900 dark:text-white tracking-tight mb-1.5">Acceso Institucional</h2>
                        <p className="text-xs font-bold text-zinc-400">Por favor, ingrese sus credenciales de red.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        
                        {/* Alerta de Error */}
                        {loginError && (
                            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-xs text-red-700 dark:text-red-400 font-bold flex items-center gap-3 border border-red-200 dark:border-red-900/50">
                                <i className="fa-solid fa-circle-exclamation text-base"></i> Credenciales incorrectas. Verifique su usuario.
                            </div>
                        )}
                        
                        {/* Input Usuario */}
                        <div className="space-y-2">
                            <label htmlFor="user" className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Usuario (ID)</label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-[13px]"></i>
                                <input 
                                    type="text" 
                                    id="user" 
                                    value={loginUser} 
                                    onChange={e=>setLoginUser(e.target.value)} 
                                    required 
                                    className="block w-full rounded-2xl border-0 bg-[#f0f4f8] dark:bg-darkbg-main pl-11 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-[#e2e8f0] dark:focus:bg-darkbg-hover focus:outline-none transition-colors placeholder:text-zinc-400" 
                                    placeholder="Ej. mocampo" 
                                />
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div className="space-y-2">
                            <label htmlFor="pass" className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Contraseña</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-[13px]"></i>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="pass" 
                                    value={loginPass} 
                                    onChange={e=>setLoginPass(e.target.value)} 
                                    required 
                                    className="block w-full rounded-2xl border-0 bg-[#f0f4f8] dark:bg-darkbg-main pl-11 pr-11 py-3.5 text-sm font-black tracking-widest text-zinc-900 dark:text-white focus:bg-[#e2e8f0] dark:focus:bg-darkbg-hover focus:outline-none transition-colors placeholder:text-zinc-400" 
                                    placeholder="••••••••" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
                                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[13px]`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Botón Iniciar Sesión */}
                        <div className="pt-4">
                            <button type="submit" className="w-full rounded-2xl bg-[#213f8f] dark:bg-brand-primary px-6 py-4 text-sm font-black text-white hover:bg-[#182e6b] dark:hover:bg-brand-hover focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]">
                                Iniciar Sesión <i className="fa-solid fa-arrow-right-to-bracket ml-1 text-xs"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}