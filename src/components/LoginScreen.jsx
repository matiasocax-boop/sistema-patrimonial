import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.jpg';

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
    <div className={`${darkMode ? 'dark' : ''} min-h-screen flex w-full bg-white dark:bg-darkbg-main font-sans transition-colors duration-300 relative overflow-hidden`}>
      
      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts?.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[300px] rounded-2xl shadow-xl text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 transition-all animate-slide-up border border-white/10 dark:border-black/10">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-400' : t.type === 'error' ? 'fa-circle-exclamation text-rose-400' : t.type === 'warning' ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-info text-sky-400'} text-base`}></i>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      {/* COLUMNA IZQUIERDA: IDENTIDAD INSTITUCIONAL SOBRIA */}
      <div className="hidden lg:flex w-[46%] bg-[#0a1c38] p-10 xl:p-14 flex-col justify-between relative overflow-hidden z-10">

        {/* Foto de fondo muy tenue con velo oscuro */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={rectoradoBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center opacity-[0.12] blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1c38]/80 via-[#0a1c38]/40 to-[#0a1c38]"></div>
        </div>

        {/* Cabecera superior */}
        <div className="w-full relative z-10 flex items-center gap-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-300/80"></div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-300/80">
            Dpto. Bienes Patrimoniales · UNP
          </span>
        </div>

        {/* Centro: logo y mensaje */}
        <div className="relative z-10 flex flex-col items-start max-w-md my-auto animate-fade-in">
          <img
            src={appLogo || '/UNP-Site-Logo.png'}
            alt="Universidad Nacional de Pilar"
            className="h-16 w-auto max-w-[300px] object-contain object-left drop-shadow-md mb-8"
            onError={(e) => { e.target.onerror = null; e.target.src = '/publiclogo_unp.png'; }}
          />

          <h1 className="text-3xl xl:text-[2.6rem] font-bold text-white/95 tracking-tight leading-[1.15] mb-4">
            Sistema de Gestión Patrimonial
          </h1>

          <p className="text-slate-300/85 text-sm xl:text-[15px] font-normal max-w-md leading-relaxed mb-8">
            Plataforma integral para el control, custodia y trazabilidad de los bienes de la Universidad Nacional de Pilar.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300/90">
            <span className="inline-flex items-center gap-1.5 bg-white/[0.06] px-3 py-1.5 rounded-full border border-white/10">
              <i className="fa-solid fa-shield-halved text-emerald-300/80 text-[10px]"></i> Alta Seguridad
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.06] px-3 py-1.5 rounded-full border border-white/10">
              <i className="fa-solid fa-qrcode text-sky-300/80 text-[10px]"></i> Código QR Único
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.06] px-3 py-1.5 rounded-full border border-white/10">
              <i className="fa-solid fa-file-pdf text-amber-200/80 text-[10px]"></i> Formularios Oficiales
            </span>
          </div>
        </div>

        {/* Pie inferior */}
        <div className="w-full relative z-10 border-t border-white/10 pt-4">
          <p className="text-[11px] font-medium text-slate-400">
            Universidad Nacional de Pilar · Departamento de Bienes Patrimoniales
          </p>
        </div>
      </div>

      {/* COLUMNA DERECHA: FORMULARIO DE ACCESO INSTITUCIONAL */}
      <div className="w-full lg:w-[54%] flex flex-col justify-between p-6 sm:p-12 bg-zinc-50 dark:bg-darkbg-main relative transition-colors">
        
        {/* Botón de alternar tema claro / oscuro */}
        <div className="flex justify-between items-center w-full">
          {/* Logo visible solo en pantallas móviles */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 p-1.5 shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
              <img src={appLogo || '/publiclogo_unp.png'} alt="UNP" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">Dpto. Bienes Patrimoniales</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">UNP</p>
            </div>
          </div>

          <div className="ml-auto">
            <button 
              onClick={() => {
                const newMode = !darkMode;
                setDarkMode(newMode);
                localStorage.setItem('theme', newMode ? 'dark' : 'light');
              }} 
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-brand-primary dark:hover:text-brand-accent transition-all cursor-pointer shadow-sm active:scale-95" 
              title="Alternar Tema"
            >
              <i className={`fa-solid ${darkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'} text-sm`}></i>
            </button>
          </div>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="bg-white dark:bg-darkbg-card rounded-[28px] border border-zinc-200/80 dark:border-darkbg-border p-8 sm:p-10 shadow-xl shadow-zinc-900/[0.06] dark:shadow-none animate-slide-up relative flex flex-col">
            
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
                  className="w-full rounded-2xl bg-brand-primary px-6 py-3.5 text-xs font-black text-white hover:bg-brand-hover focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/25 hover:shadow-xl active:scale-[0.98]"
                >
                  <span>Acceder a la Plataforma</span> 
                  <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-1"></i>
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Footer inferior */}
        <div className="text-center text-[11px] font-medium text-zinc-400 py-2">
          © {new Date().getFullYear()} Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales
        </div>

      </div>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-zinc-900 p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-slide-up">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-brand-primary dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Recuperación de Acceso
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por la Administración Central del Departamento de Bienes Patrimoniales.
            </p>
            <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              <i className="fa-solid fa-envelope mr-1.5 text-brand-primary dark:text-blue-400"></i> Contacto: soporte.patrimonio@unp.edu.py
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