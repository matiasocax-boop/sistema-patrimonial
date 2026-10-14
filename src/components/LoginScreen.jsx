import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.jpg';
import { APP_VERSION } from '../utils/helpers';

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
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen flex flex-col w-full bg-[#0a1c38] dark:bg-[#070f22] font-sans transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Fondo institucional tenue */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={rectoradoBg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-[0.10]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1c38]/70 via-[#0a1c38]/50 to-[#0a1c38] dark:from-[#070f22]/70 dark:via-[#070f22]/50 dark:to-[#070f22]"></div>
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-96 w-[44rem] rounded-full bg-blue-500/15 blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-violet-600/[0.07] blur-3xl"></div>
      </div>

      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts?.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 transition-all animate-slide-up border border-white/10 dark:border-black/10">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-400' : t.type === 'error' ? 'fa-circle-exclamation text-rose-400' : t.type === 'warning' ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-info text-sky-400'} text-base`}></i>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Encabezado: marca + tema */}
      <header className="relative z-10 flex items-center justify-between w-full px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <img
            src={appLogo || '/UNP-Site-Logo.png'}
            alt="Universidad Nacional de Pilar"
            className="h-9 w-auto max-w-[220px] object-contain object-left drop-shadow-md"
            onError={(e) => { e.target.onerror = null; e.target.src = '/publiclogo_unp.png'; }}
          />
          <span className="hidden sm:block h-6 w-px bg-white/15"></span>
          <span className="hidden sm:block text-[11px] font-bold tracking-[0.2em] uppercase text-slate-300/80">
            Dpto. Bienes Patrimoniales
          </span>
        </div>
        <button 
          onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
          }} 
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/15 text-slate-200 hover:bg-white/[0.12] transition-all cursor-pointer active:scale-95" 
          title="Alternar Tema"
        >
          <i className={`fa-solid ${darkMode ? 'fa-sun text-amber-300' : 'fa-moon text-sky-300'} text-sm`}></i>
        </button>
      </header>

      {/* Tarjeta de acceso centrada */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-darkbg-card rounded-3xl border border-zinc-200/80 dark:border-darkbg-border p-8 sm:p-10 shadow-xl shadow-black/20 animate-slide-up relative flex flex-col">
            
            <div className="flex flex-col mb-8 border-b border-zinc-100 dark:border-darkbg-border pb-6 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary dark:text-brand-accent mb-1.5">
                Portal de Acceso
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                Por favor, ingrese sus credenciales autorizadas del sistema.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-5">
              {loginError && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-3 border border-rose-200 dark:border-rose-900/50 animate-slide-up">
                  <i className="fa-solid fa-circle-exclamation text-base text-rose-500 shrink-0"></i>
                  <span>Credenciales inválidas. Verifique su usuario y contraseña.</span>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label htmlFor="user" className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Usuario (ID)
                </label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                  <input 
                    type="text" 
                    id="user" 
                    value={loginUser} 
                    onChange={e => setLoginUser(e.target.value)} 
                    required 
                    className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-darkbg-main pl-11 pr-4 py-3.5 text-xs font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 placeholder:font-normal" 
                    placeholder="ej. admin / funcionario" 
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowRecoveryModal(true)} 
                    className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                  >
                    ¿Olvidó su clave?
                  </button>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="pass" 
                    value={loginPass} 
                    onChange={e => setLoginPass(e.target.value)} 
                    required 
                    className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-darkbg-main pl-11 pr-11 py-3.5 text-xs font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 placeholder:font-normal" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full rounded-2xl bg-brand-primary px-6 py-3.5 text-xs font-black text-white hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/25 hover:shadow-xl active:scale-[0.98]"
                >
                  <span>Acceder a la Plataforma</span> 
                  <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-1"></i>
                </button>
              </div>
            </form>

          </div>
        </div>
      </main>

      {/* Footer inferior */}
      <footer className="relative z-10 text-center pb-5 px-6">
        <p className="text-[11px] font-medium text-slate-500">© {new Date().getFullYear()} Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales <span className="text-slate-600">· v{APP_VERSION}</span></p>
      </footer>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-slide-up">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-brand-primary dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Recuperación de Acceso
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por el Desarrollador del sistema.
            </p>
            <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              <i className="fa-solid fa-envelope mr-1.5 text-brand-primary dark:text-blue-400"></i> Contacto: patrimonio@unp.edu.py
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
