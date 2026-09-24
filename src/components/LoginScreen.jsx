import React, { useState } from 'react';
import { getPlaceholderLogo } from '../utils/helpers';
import rectoradoBg from '../assets/rectorado-pilar.jpg'; // <--- Importamos la imagen desde assets

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
    <div className={`${darkMode ? 'dark' : ''} relative min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden select-none`}>
      
      {/* FONDO INSTITUCIONAL CON TU IMAGEN DE RECTORADO */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/90 via-zinc-100/80 to-zinc-200/50 dark:from-zinc-950 dark:via-zinc-950/80 dark:to-zinc-900/50 z-10 transition-colors duration-300"></div>
        <img 
          src={rectoradoBg} // <--- Usamos la variable importada
          alt="Universidad Nacional de Pilar - Rectorado" 
          className="w-full h-full object-cover object-center filter brightness-[0.95] dark:brightness-[0.35] contrast-110 scale-105 transition-all duration-300"
        />
      </div>

      {/* BOTÓN FLOTANTE DE TEMA */}
      <div className="absolute top-5 right-5 z-50">
        <button 
          onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem('theme', newMode ? 'dark' : 'light');
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 shadow-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          title="Alternar Modo Oscuro / Claro"
        >
          <i className={`fa-solid ${darkMode ? 'fa-sun text-amber-400' : 'fa-moon text-blue-600'} text-sm`}></i>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* IZQUIERDA: INFORMACIÓN INSTITUCIONAL */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            <div className="flex items-center gap-4 bg-white/80 dark:bg-zinc-900/60 p-3.5 rounded-2xl backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors duration-300">
              <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center p-2 shadow-inner border border-zinc-200 shrink-0">
                <img 
  src={appLogo || '/publiclogo_unp.png'} 
  alt="Logo UNP" 
  className="h-full w-full object-contain filter drop-shadow-sm" 
/>
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary dark:text-brand-accent">
                  Universidad Nacional de Pilar
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Rectorado</h3>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight transition-colors duration-300">
                Sistema de Gestión <span className="text-brand-primary dark:text-brand-accent">Patrimonial</span>
              </h1>
              <p className="text-sm sm:text-base font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed transition-colors duration-300">
                Plataforma institucional autorizada para el control riguroso, asignación de custodios y trazabilidad completa del ciclo de vida de los bienes de uso.
              </p>
            </div>
          </div>

          {/* DERECHA: PANEL DE INGRESO CON FONDO ADAPTABLE */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white/90 dark:bg-zinc-900/85 backdrop-blur-2xl rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-8 sm:p-10 relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-indigo-500"></div>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Iniciar Sesión</h2>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">Ingrese sus credenciales institucionales de red</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Usuario</label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input 
                      type="text" 
                      required
                      placeholder="Ingrese su usuario..." 
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900/90 py-3.5 pl-11 pr-4 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Contraseña</label>
                    <button 
                      type="button" 
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                    >
                      ¿Necesitas ayuda?
                    </button>
                  </div>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900/90 py-3.5 pl-11 pr-11 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all shadow-inner"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5 animate-slide-up">
                    <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                    <span>Credenciales incorrectas. Verifique sus datos.</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white py-3.5 px-4 text-xs font-black transition-all shadow-lg shadow-brand-primary/25 cursor-pointer active:scale-95"
                >
                  <span>Acceder al Sistema</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              </form>

            </div>
          </div>

        </div>
      </main>

      {/* PIE DE PÁGINA INSTITUCIONAL CON COPYRIGHT */}
      <footer className="relative z-20 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/80 py-4 px-6 text-center shrink-0 transition-colors duration-300">
        <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 tracking-wide">
          Universidad Nacional de Pilar <span className="text-zinc-400 dark:text-zinc-600 mx-2">|</span> Departamento de Bienes Patrimoniales - Rectorado <span className="text-zinc-400 dark:text-zinc-600 mx-2">|</span> © 2026 Todos los derechos reservados
        </p>
      </footer>

      {/* MODAL DE SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up text-zinc-900 dark:text-white">
            <button 
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-brand-primary/20 text-brand-primary dark:text-brand-accent flex items-center justify-center border border-brand-primary/30 shadow-inner">
                <i className="fa-solid fa-headset text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Soporte y Recuperación</h3>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Asistencia técnica institucional</p>
              </div>
            </div>

            <div className="space-y-4 text-sm bg-zinc-50 dark:bg-zinc-950/60 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                Si ha olvidado su contraseña o presenta inconvenientes de acceso al sistema, comuníquese con el administrador responsable:
              </p>
              
              <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-900 dark:text-white">
                  <i className="fa-solid fa-user-tie text-brand-primary"></i>
                  <span>Matías Ocampo</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-900 dark:text-white">
                  <i className="fa-solid fa-phone text-emerald-600 dark:text-emerald-400"></i>
                  <span>0983 547 932</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-900 dark:text-white">
                  <i className="fa-solid fa-envelope text-sky-600 dark:text-sky-400"></i>
                  <span>patrimonio@unp.edu.py</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowRecoveryModal(false)}
                className="w-full py-3 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 animate-slide-up">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-500' : 'fa-circle-exclamation text-rose-500'} text-sm`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}