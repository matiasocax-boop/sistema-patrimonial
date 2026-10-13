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
    <div className={`${darkMode ? 'dark' : ''} relative min-h-screen w-full flex flex-col justify-between bg-slate-950 font-sans text-slate-100 transition-colors duration-300 overflow-x-hidden selection:bg-blue-600 selection:text-white`}>
      
      {/* FONDO FOTOGRÁFICO INSTITUCIONAL ULTRA ELEGANTE CON OVERLAY REFINADO */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src={rectoradoBg}
          alt="Universidad Nacional de Pilar - Rectorado" 
          className="w-full h-full object-cover object-center filter brightness-[0.40] contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-radial from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
      </div>

      {/* HEADER SUPERIOR CON LOGO Y TEMA */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-white p-1.5 shadow-md border border-white/20 flex items-center justify-center shrink-0">
            <img 
              src={appLogo || '/publiclogo_unp.png'} 
              alt="Logo UNP" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">Universidad Nacional de Pilar</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Rectorado · Bienes Patrimoniales</p>
          </div>
        </div>

        <button 
          onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem('theme', newMode ? 'dark' : 'light');
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Alternar Modo Oscuro / Claro"
        >
          <i className={`fa-solid ${darkMode ? 'fa-sun text-amber-400' : 'fa-moon text-sky-300'} text-sm`}></i>
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL: CENTRADO Y PERFECTAMENTE SIMÉTRICO */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">
          
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-8 sm:p-10 relative overflow-hidden transition-all">
            {/* Acento superior degradé */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"></div>

            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <i className="fa-solid fa-lock text-[9px]"></i> Portal Corporativo Seguro
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-1.5">
                Acceso al Sistema Integrado de Control Patrimonial
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
                  Usuario Institucional
                </label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type="text" 
                    required
                    placeholder="ej. admin / funcionario" 
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3.5 pl-11 pr-4 text-xs font-bold text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                  >
                    ¿Olvidó su clave?
                  </button>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3.5 pl-11 pr-11 text-xs font-bold text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold flex items-center gap-2.5 animate-slide-up">
                  <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                  <span>Credenciales inválidas. Compruebe usuario y clave.</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-4 text-xs font-black transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98"
              >
                <span>Acceder a la Plataforma</span>
                <i className="fa-solid fa-arrow-right text-[11px]"></i>
              </button>
            </form>

          </div>

        </div>
      </main>

      {/* FOOTER DISCRETO Y CORPORATIVO */}
      <footer className="relative z-20 w-full py-4 px-6 text-center shrink-0 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        <p className="text-[11px] font-semibold text-slate-400 tracking-wide">
          Universidad Nacional de Pilar · Departamento de Bienes Patrimoniales · © 2026 Todos los derechos reservados
        </p>
      </footer>

      {/* MODAL DE SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up text-white">
            <button 
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <i className="fa-solid fa-headset text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Mesa de Ayuda Técnica</h3>
                <p className="text-xs font-medium text-slate-400">Recuperación de cuentas institucionales</p>
              </div>
            </div>

            <div className="space-y-4 text-sm bg-slate-950/70 p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Por motivos de seguridad, el restablecimiento de contraseñas es gestionado directamente por el Administrador Patrimonial:
              </p>
              
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs font-bold text-white">
                  <i className="fa-solid fa-user-tie text-blue-400"></i>
                  <span>Matías Ocampo</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-white">
                  <i className="fa-solid fa-phone text-emerald-400"></i>
                  <span>0983 547 932</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-white">
                  <i className="fa-solid fa-envelope text-sky-400"></i>
                  <span>patrimonio@unp.edu.py</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowRecoveryModal(false)}
                className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
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
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold bg-slate-900 text-white border border-white/15 animate-slide-up">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'} text-sm`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}