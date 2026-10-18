import React, { useState } from 'react';
import FaqItem from '../components/FaqItem';
import WorkflowStep from '../components/WorkflowStep';
import { SHORTCUTS } from '../constants/appConstants';
import { normalizeStr, APP_VERSION } from '../utils/helpers';

// Vista de ayuda/Soporte y Normativa.
// Contenido estático + tour guiado + FAQ accordion ampliado.
export default function AyudaView({ setTourPaso, STYLES }) {
  const [busquedaFaq, setBusquedaFaq] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('faq');

  const FAQS = [
    {
      category: 'General',
      question: "¿Qué es este sistema y para qué sirve?",
      answer: "Es la plataforma de Gestión Patrimonial de la Universidad Nacional de Pilar (UNP). Permite llevar el inventario de bienes institucionales, generar actas FC-04 (alta/baja), FC-10 (delegación de custodia) y FC-11 (traslados), con trazabilidad QR y control de firmas."
    },
    {
      category: 'General',
      question: "¿Quién puede acceder al sistema?",
      answer: "Solo usuarios con cuenta activa en Supabase Auth y perfil en la tabla `usuarios`. Los roles son: `funcionario` (operación), `admin` (administración) y `dev` (desarrollador/mantenimiento)."
    },
    {
      category: 'Inventario',
      question: "Explicación de la alerta crítica 'Req. Acción'",
      answer: "Este indicador previene discrepancias en el inventario. Se activa bajo dos escenarios: 1) Ingreso de un nuevo bien sin ubicación física definida. 2) Recepción de un bien trasladado (FC-11) que no ha sido re-asignado legalmente mediante un nuevo FC-10."
    },
    {
      category: 'Inventario',
      question: "Protocolo para exclusión de inventario (Baja)",
      answer: "La normativa exige generar un expediente FC-04 de cierre, seleccionando 'Baja' como origen. El sistema procesará el descargo contable e inhabilitará el registro. La modificación manual del estado en el inventario solo se admite para correcciones de digitación."
    },
    {
      category: 'FC-10',
      question: "¿Cómo se controlan las firmas de un acta FC-10?",
      answer: "El estado de las firmas (sin firmar / firmado) solo lo cambia el administrador manualmente cuando recibe el documento físico o digital devuelto. Desde el panel FC-10 puede marcar el estado como checklist o switch. Solo el rol administrador tiene permiso para modificar este estado."
    },
    {
      category: 'FC-10',
      question: "Autocompletado de la estructura organizacional",
      answer: "El formulario FC-10 emplea aprendizaje histórico. Al procesar las primeras asignaciones, el sistema mapea la jerarquía (Unidad, Repartición, etc.) permitiendo el despliegue automático en procesos futuros, reduciendo la carga administrativa."
    },
    {
      category: 'FC-10',
      question: "¿Qué significa que un acta esté 'cerrada'?",
      answer: "Significa que ambas firmas (funcionario responsable y jefe inmediato) fueron registradas. El bien pasa a tener `hasFC10 = true` y el acta ya no aparece como pendiente de firma."
    },
    {
      category: 'FC-04',
      question: "Recuperación de registros históricos (Bajas)",
      answer: "A fines de precisión contable, los ítems dados de baja no participan de las métricas principales. Para auditar este histórico, acceda a 'Directorio Patrimonial' y ejecute el filtro 'Bajas' en el panel de herramientas."
    },
    {
      category: 'FC-04',
      question: "Orígenes permitidos en un FC-04",
      answer: "Alta, Baja, Traspaso, Compra o Donación. Cada origen determina el tratamiento contable del bien."
    },
    {
      category: 'QR',
      question: "Exportación masiva de código de barras (QR)",
      answer: "A través de la vista de Inventario, puede aplicar segmentaciones por ubicación o custodio. Ejecute el comando 'Lote QRs' para compilar un archivo comprimido (.zip) estructurado para impresión industrial."
    },
    {
      category: 'QR',
      question: "¿Cómo funciona la consulta pública por QR?",
      answer: "Cualquier persona con un lector QR puede consultar los datos básicos de un bien sin iniciar sesión. La consulta no expone valores económicos ni datos sensibles del custodio."
    },
    {
      category: 'Respaldos',
      question: "¿Cómo hacer una copia de seguridad?",
      answer: "Desde el sidebar (Administración > Copia de Seguridad) puede descargar un archivo .json con toda la estructura de la base de datos. El archivo incluye metadatos, versión y checksum SHA-256 para garantizar integridad."
    },
    {
      category: 'Respaldos',
      question: "¿Cómo restaurar una copia de seguridad?",
      answer: "Seleccione el archivo .json generado por el sistema. El backend valida un esquema estricto antes de escribir (tablas, relaciones, claves primarias). Puede previsualizar qué cambiará antes de confirmar. Solo el administrador puede restaurar."
    },
    {
      category: 'Seguridad',
      question: "¿Cómo se protegen mis datos?",
      answer: "Contraseñas hasheadas con bcrypt, JWT con expiración de 24h, rate limiting, cabeceras de seguridad (CSP, HSTS, X-Frame-Options), sanitización de inputs y protección contra XSS/CSRF en el frontend."
    },
    {
      category: 'Seguridad',
      question: "¿Qué pasa si hay inactividad?",
      answer: "La sesión se cierra automáticamente tras 15 minutos de inactividad por motivos de seguridad patrimonial."
    },
    {
      category: 'Atajos',
      question: "Atajos de teclado",
      answer: "Ctrl+K abre la búsqueda global, / enfoca el buscador del inventario, N crea un bien nuevo y ? muestra la lista completa de atajos."
    },
    {
      category: 'Contacto',
      question: "¿Dónde reportar un fallo o solicitar soporte?",
      answer: "Contacte al Departamento de Bienes Patrimoniales: patrimonio@unp.edu.py. Para fallos críticos, incluya capturas de pantalla, hora aproximada y el ID del bien afectado si aplica."
    }
  ];

  const qFaq = normalizeStr(busquedaFaq);
  const faqsFiltradas = FAQS.filter(f =>
    !qFaq || normalizeStr(`${f.category} ${f.question} ${f.answer}`).includes(qFaq)
  );

  const SECCIONES = [
    { id: 'faq', label: 'Preguntas Frecuentes', icon: 'fa-circle-question' },
    { id: 'procedimiento', label: 'Procedimiento Lógico', icon: 'fa-network-wired' },
    { id: 'atajos', label: 'Atajos de Teclado', icon: 'fa-keyboard' }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkbg-card p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-darkbg-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-circle-question text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Centro de Ayuda y Normativa</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Guía operativa, documentación y preguntas frecuentes del ciclo de vida de los bienes</p>
          </div>
        </div>
        <button
          onClick={() => setTourPaso(0)}
          title="Recorrer la guía interactiva"
          className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none shrink-0"
        >
          <i className="fa-solid fa-route"></i> Hacer tour guiado
        </button>
      </div>

      {/* Navegación de secciones */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {SECCIONES.map(s => (
          <button
            key={s.id}
            onClick={() => setSeccionActiva(s.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all cursor-pointer ${
              seccionActiva === s.id
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            <i className={`fa-solid ${s.icon} text-[13px] ${seccionActiva === s.id ? '' : 'opacity-70'}`}></i>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Columna izquierda: sección activa */}
        <div className="lg:col-span-5 flex flex-col">
          {seccionActiva === 'faq' && (
            <>
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                <i className="fa-solid fa-circle-question text-brand-primary"></i> Preguntas Frecuentes
              </h2>
              <div className="relative mb-6">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                <input
                  type="text"
                  value={busquedaFaq}
                  onChange={(e) => setBusquedaFaq(e.target.value)}
                  placeholder="Buscar en la ayuda..."
                  className="w-full rounded-2xl border border-zinc-200 dark:border-darkbg-border bg-white dark:bg-darkbg-main py-2.5 pl-10 pr-4 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>
              <div className="space-y-3">
                {faqsFiltradas.map(f => (
                  <FaqItem key={f.question} question={f.question} answer={f.answer} categoria={f.categoria} />
                ))}
                {faqsFiltradas.length === 0 && (
                  <p className="text-sm font-semibold text-zinc-400 text-center py-8">Sin coincidencias en la ayuda.</p>
                )}
              </div>
            </>
          )}
          {seccionActiva === 'procedimiento' && (
            <>
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                <i className="fa-solid fa-network-wired text-brand-primary"></i> Procedimiento Lógico
              </h2>
              <div className={`${STYLES.card} p-6 sm:p-8 relative overflow-hidden flex-1`}>
                <div className="absolute left-[56px] top-12 bottom-12 w-0.5 bg-zinc-200 dark:bg-darkbg-border hidden sm:block z-0"></div>
                <div className="space-y-2 relative z-10">
                  <WorkflowStep number="1" title="Alta (FC-04)" description="La incorporación inicial exige la creación de un FC-04 de Alta. Esto registra contablemente el ítem en la base de datos principal." icon="fa-arrow-trend-up" color="bg-zinc-500" />
                  <WorkflowStep number="2" title="Delegación (FC-10)" description="La entrega física requiere el levantamiento de un FC-10 nominal. Este instrumento legal transfiere la responsabilidad civil del objeto." icon="fa-file-signature" color="bg-brand-primary" />
                  <WorkflowStep number="3" title="Movilidad (FC-11)" description="Toda reubicación entre facultades debe ampararse en un FC-11, el cual extingue automáticamente la responsabilidad del custodio anterior." icon="fa-dolly" color="bg-zinc-600" />
                  <WorkflowStep number="4" title="Extinción (FC-04)" description="El desuso o rotura definitiva obliga a tramitar un FC-04 de Baja para remover contablemente el valor del patrimonio activo." icon="fa-ban" color="bg-red-500" />
                </div>
              </div>
            </>
          )}
          {seccionActiva === 'atajos' && (
            <>
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                <i className="fa-solid fa-keyboard text-brand-primary"></i> Atajos de Teclado
              </h2>
              <div className={`${STYLES.card} p-6 sm:p-8 flex-1`}>
                <div className="space-y-3">
                  {SHORTCUTS.map(s => (
                    <div key={s.accion} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-darkbg-border/60 last:border-0">
                      <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{s.accion}</span>
                      <span className="flex gap-1 shrink-0">
                        {s.teclas.map(k => (
                          <kbd key={k} className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-darkbg-border bg-zinc-50 dark:bg-darkbg-main px-2 py-1 text-[11px] font-black text-zinc-600 dark:text-zinc-300">{k}</kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Columna derecha: contacto y recursos rápidos */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className={`${STYLES.card} p-6 sm:p-8 flex-1`}>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-envelope text-brand-primary"></i> Contacto y Soporte
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <i className="fa-solid fa-envelope text-sm"></i>
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">Soporte patrimonial</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">patrimonio@unp.edu.py</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <i className="fa-solid fa-building text-sm"></i>
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">Departamento de Bienes Patrimoniales</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Universidad Nacional de Pilar</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-darkbg-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Versión del sistema</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">v{APP_VERSION} · Entorno de producción</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
