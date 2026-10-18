import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.webp';
import { APP_VERSION } from '../utils/helpers';

const BULLETS = [
  { icon: 'fa-boxes-stacked', titulo: 'Inventario consolidado', texto: 'Bienes, traslados y asignaciones en un solo lugar.' },
  { icon: 'fa-file-signature', titulo: 'Actas FC-04 · FC-10 · FC-11', texto: 'Documentos oficiales en tamaño oficio, listos para firmar.' },
  { icon: 'fa-qrcode', titulo: 'Trazabilidad QR', texto: 'Cada activo identificado y verificable en campo.' },
];

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
  toasts,
  isProcessing = false,
  quitarToast = () => {}
}) {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const detectarCaps = (e) => {
    try { setCapsLock(!!(e.getModifierState && e.getModifierState('CapsLock'))); } catch { /* navegador sin soporte */ }
  };

  return (
    <div
      className={`${darkMode ? 'dark' : ''} min-h-dvh flex w-full font-sans antialiased selection:bg-brand-primary/20 relative overflow-hidden`}
      style={{
        backgroundColor: darkMode ? '#0b0f19' : '#f8fafc',
        color: darkMode ? '#f1f5f9' : '#0f172a'
      }}
    >

      {/* ===== Orbe decorativo sutil ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[10%] left-[10%] -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-blue-600/10 dark:bg-blue-900/20 blur-[120px] mix-blend-overlay"
          style={{ filter: 'blur(100px)' }}
        ></div>
        <div
          className="absolute -bottom-[10%] right-[10%] -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 dark:bg-indigo-900/20 blur-[120px] mix-blend-overlay"
          style={{ filter: 'blur(100px)' }}
        ></div>
      </div>

      {/* ===== Panel institucional (desktop, izquierda) ===== */}
      <aside className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between overflow-hidden border-r border-zinc-200 dark:border-white/5">
        <div className="relative z-10 p-10 xl:p-16 h-full flex flex-col justify-between">
          <div>
            <img
              src={appLogo || '/UNP-Site-Logo.webp'}
              alt="Universidad Nacional de Pilar"
              className="h-10 w-auto max-w-[260px] object-contain object-left drop-shadow-md"
              onError={(e) => { e.target.onerror = null; e.target.src = '/UNP-Site-Logo.png'; }}
            />
            <p className="mt-4 text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-500 dark:text-zinc-400">
              Departamento de Bienes Patrimoniales
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
              Gestión patrimonial<br />
              con trazabilidad total
            </h1>
            <ul className="space-y-4">
              {BULLETS.map((b, i) => (
                <li key={b.titulo} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-brand-accent backdrop-blur-sm shadow-sm">
                    <i className={`fa-solid ${b.icon} text-[13px]`}></i>
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{b.titulo}</span>
                    <span className="block text-xs text-slate-300/90 font-medium mt-0.5">{b.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto">
            <p className="text-[10px] font-medium text-slate-400">
              © {new Date().getFullYear()} Universidad Nacional de Pilar &nbsp;·&nbsp; v{APP_VERSION}
            </p>
          </div>
        </div>

        {/* Fondo institucional con imagen */}
        <div className="absolute inset-0 z-0">
          <img
            src={rectoradoBg}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center opacity-60 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent dark:from-[#0b0f19] dark:via-[#0b0f19]/70"></div>
        </div>
      </aside>

      {/* ===== Columna de acceso (derecha) ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-darkbg-card">
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={rectoradoBg}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center opacity-5 dark:opacity-0"
            />
          </div>
        </div>

        {/* TOASTS FLOTANTES */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts?.map(t => (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-bold bg-white text-zinc-900 dark:bg-darkbg-card dark:text-white border border-zinc-200 dark:border-darkbg-border transition-all animate-slide-up">
              <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-500' : t.type === 'error' ? 'fa-circle-exclamation text-rose-500' : t.type === 'warning' ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-info text-brand-primary'} text-base`}></i>
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-darkbg-hover dark:text-zinc-900 dark:hover:bg-white transition-all cursor-pointer active:scale-95"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Encabezado móvil + tema */}
        <header className="relative z-10 flex items-center justify-between w-full px-6 sm:px-10 py-6 border-b border-zinc-100 dark:border-white/5 bg-white/50 dark:bg-darkbg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-3 lg:invisible">
            <img
              src={appLogo || '/UNP-Site-Logo.webp'}
              alt="Universidad Nacional de Pilar"
              className="h-8 w-auto max-w-[200px] object-contain object-left drop-shadow-md"
              onError={(e) => { e.target.onerror = null; e.target.src = '/UNP-Site-Logo.png'; }}
            />
            <span className="hidden sm:block h-5 w-px bg-zinc-200 dark:bg-white/10"></span>
            <span className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">
              Dpto. Bienes Patrimoniales
            </span>
          </div>
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem('theme', newMode ? 'dark' : 'light');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
            title="Alternar Tema" aria-label="Alternar Tema"
          >
            <i className={`fa-solid ${darkMode ? 'fa-sun text-amber-400' : 'fa-moon text-brand-primary'} text-sm transition-transform duration-500 ${darkMode ? 'rotate-0' : '-rotate-12'}`}></i>
          </button>
        </header>

        {/* Tarjeta de acceso */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-md">
            <div className={`bg-white dark:bg-darkbg-card rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl p-8 sm:p-12 relative flex flex-col ${loginError ? 'animate-shake border-rose-500/50' : ''}`}>
              {/* Acento superior */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-primary via-brand-accent to-transparent"></div>

              <div className="flex flex-col mb-10 border-b border-zinc-100 dark:border-white/5 pb-6 text-left">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">
                  <i className="fa-solid fa-shield-halved text-[10px]"></i>
                  Portal de Acceso
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2">
                  Ingrese sus credenciales autorizadas del sistema UNP.
                </p>
              </div>

              <form onSubmit={handleLogin} className="w-full space-y-6">
                {loginError && (
                  <div id="login-error" role="alert" className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-5 text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center gap-3 border border-rose-200 dark:border-rose-900/50 animate-slide-up shadow-sm">
                    <i className="fa-solid fa-circle-exclamation text-base text-rose-500 shrink-0" aria-hidden="true"></i>
                    <span>Credenciales inválidas. Verifique su usuario y contraseña.</span>
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label htmlFor="user" className="block text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Usuario (ID)
                  </label>
                  <div className="relative group">
                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-primary group-focus-within:scale-110 text-xs transition-all"></i>
                    <input
                      type="text"
                      id="user"
                      name="username"
                      value={loginUser}
                      onChange={e => setLoginUser(e.target.value)}
                      onKeyDown={detectarCaps}
                      required
                      autoComplete="username"
                      disabled={isProcessing}
                      aria-invalid={loginError || undefined}
                      aria-describedby={loginError ? 'login-error' : undefined}
                      className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-darkbg-main pl-11 pr-4 py-4 text-sm font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 placeholder:font-normal disabled:opacity-60"
                      placeholder="ej. admin"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <label htmlFor="pass" className="block text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-[10px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                    >
                      ¿Olvidó su clave?
                    </button>
                  </div>
                  <div className="relative group">
                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-primary group-focus-within:scale-110 text-xs transition-all"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="pass"
                      name="password"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      onKeyDown={detectarCaps}
                      onKeyUp={detectarCaps}
                      required
                      autoComplete="current-password"
                      disabled={isProcessing}
                      aria-invalid={loginError || undefined}
                      aria-describedby={loginError ? 'login-error' : undefined}
                      className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-darkbg-main pl-11 pr-11 py-4 text-sm font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-darkbg-card focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-darkbg-border transition-all placeholder:text-zinc-400 placeholder:font-normal disabled:opacity-60"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                  {capsLock && (
                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                      Bloq Mayús activado
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    aria-busy={isProcessing || undefined}
                    className="group w-full rounded-2xl bg-brand-primary px-6 py-4 text-sm font-black text-white hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
                  >
                    {isProcessing ? (
                      <>
                        <span className="login-spinner" aria-hidden="true"></span>
                        <span>Verificando credenciales…</span>
                      </>
                    ) : (
                      <>
                        <span>Acceder a la Plataforma</span>
                        <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-1 transition-transform duration-300 group-hover:translate-x-1"></i>
                      </>
                    )}
                  </button>
                  <p className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    <i className="fa-solid fa-shield-halved text-[10px] text-emerald-500"></i>
                    Acceso restringido · UNP
                  </p>
                </div>
              </form>

            </div>
          </div>
        </main>

        {/* Footer inferior */}
        <footer className="relative z-10 text-center pb-8 px-6 border-t border-zinc-100 dark:border-white/5 bg-white/40 dark:bg-darkbg-card/40 backdrop-blur">
          <p className="text-[10px] font-medium text-slate-500">
            © {new Date().getFullYear()} Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales <span className="text-zinc-400">· v{APP_VERSION}</span>
          </p>
        </footer>
      </div>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-darkbg-card p-7 shadow-2xl border border-zinc-200 dark:border-darkbg-border text-center animate-slide-up">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-brand-primary dark:text-brand-accent border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Recuperación de Acceso
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por el Desarrollador del sistema.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-darkbg-border text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              <i className="fa-solid fa-envelope mr-2 text-brand-primary dark:text-blue-400"></i>
              Contacto: patrimonio@unp.edu.py
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-sm font-black transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
