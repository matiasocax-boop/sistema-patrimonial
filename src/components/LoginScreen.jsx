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
        <div className="min-h-screen flex w-full bg-white dark:bg-darkbg-main transition-colors duration-300 relative overflow-hidden">
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[300px] rounded-md shadow-lg text-sm font-medium bg-[#323232] text-white transition-all animate-slide-up`}>
                        <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-green-400' : t.type === 'error' ? 'fa-circle-exclamation text-red-400' : t.type === 'warning' ? 'fa-triangle-exclamation text-orange-400' : 'fa-circle-info text-blue-400'} text-lg`}></i>
                        <span className="flex-1">{t.message}</span>
                    </div>
                ))}
            </div>

            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-12 flex-col justify-center items-center relative overflow-hidden shadow-2xl z-10">
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center text-center animate-fade-in">
                    <div className="w-40 h-40 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl mb-10 flex items-center justify-center transform transition-transform hover:scale-105 duration-500">
                        {appLogo ? (
                            <img src={appLogo} alt="Logo Oficial" className="w-full h-full object-contain" />
                        ) : (
                            <i className="fa-solid fa-landmark text-7xl text-white drop-shadow-md"></i>
                        )}
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">Sistema de Gestión Patrimonial</h1>
                    <p className="text-brand-light text-lg font-medium max-w-md opacity-90">Plataforma integral para el control y trazabilidad de los bienes de la Universidad Nacional de Pilar.</p>
                </div>
            </div>
            
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-zinc-50 dark:bg-darkbg-main relative">
                <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => setDarkMode(!darkMode)} className="text-zinc-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors cursor-pointer text-xl p-2" title="Alternar Tema">
                        <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                </div>
                
                <div className="w-full max-w-md bg-white dark:bg-darkbg-card rounded-3xl border border-zinc-100 dark:border-darkbg-border p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-slide-up relative flex flex-col">
                    <div className="flex flex-col mb-8 border-b border-zinc-100 dark:border-darkbg-border pb-6">
                        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1">Acceso Institucional</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Por favor, ingrese sus credenciales de red.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="w-full space-y-5">
                        {loginError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-3 border border-red-200 dark:border-red-900/50"><i className="fa-solid fa-circle-exclamation text-lg"></i> Credenciales incorrectas. Verifique su usuario y contraseña.</div>}
                        <div>
                            <label htmlFor="user" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Usuario (ID)</label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                <input type="text" id="user" value={loginUser} onChange={e=>setLoginUser(e.target.value)} required className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/80 dark:bg-darkbg-main pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 font-medium" placeholder="Escriba su usuario..." />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label htmlFor="pass" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Contraseña</label>
                            </div>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="pass" 
                                    value={loginPass} 
                                    onChange={e=>setLoginPass(e.target.value)} 
                                    required 
                                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/80 dark:bg-darkbg-main pl-11 pr-11 py-3 text-sm text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 font-medium" 
                                    placeholder="••••••••" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="pt-6">
                            <button type="submit" className="w-full rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-hover focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]">
                                Iniciar Sesión <i className="fa-solid fa-arrow-right-to-bracket ml-1"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}