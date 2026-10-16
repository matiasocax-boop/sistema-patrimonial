import React, { useState } from 'react';
import FaqItem from '../components/FaqItem';
import WorkflowStep from '../components/WorkflowStep';
import { SHORTCUTS } from '../constants/appConstants';
import { normalizeStr } from '../utils/helpers';

// Vista de ayuda/Soporte y Normativa (extraída de App.jsx, Fase 4).
// Contenido estático + botón de tour guiado.
export default function AyudaView({ setTourPaso, STYLES }) {
  const [busquedaFaq, setBusquedaFaq] = useState('');
  const FAQS = [
    { question: "Explicación de la alerta crítica 'Req. Acción'", answer: "Este indicador previene discrepancias en el inventario. Se activa bajo dos escenarios: 1) Ingreso de un nuevo bien sin ubicación física definida. 2) Recepción de un bien trasladado (FC-11) que no ha sido re-asignado legalmente mediante un nuevo FC-10." },
    { question: "Protocolo para exclusión de inventario (Baja)", answer: "La normativa exige generar un expediente FC-04 de cierre, seleccionando 'Baja' como origen. El sistema procesará el descargo contable e inhabilitará el registro. La modificación manual del estado en el inventario solo se admite para correcciones de digitación." },
    { question: "Autocompletado de la estructura organizacional", answer: "El formulario FC-10 emplea aprendizaje histórico. Al procesar las primeras asignaciones, el sistema mapea la jerarquía (Unidad, Repartición, etc.) permitiendo el despliegue automático en procesos futuros, reduciendo la carga administrativa." },
    { question: "Recuperación de registros históricos (Bajas)", answer: "A fines de precisión contable, los ítems dados de baja no participan de las métricas principales. Para auditar este histórico, acceda a 'Directorio Patrimonial' y ejecute el filtro 'Bajas' en el panel de herramientas." },
    { question: "Exportación masiva de código de barras (QR)", answer: "A través de la vista de Inventario, usted puede aplicar segmentaciones por ubicación o custodio. Ejecute el comando 'Lote QRs' para compilar un archivo comprimido (.zip) estructurado para impresión industrial." },
    { question: "Atajos de teclado", answer: "Ctrl+K abre la búsqueda global, / enfoca el buscador del inventario, N crea un bien nuevo y ? muestra la lista completa de atajos." },
    { question: "Anuncios del desarrollador", answer: "Los avisos enviados desde el módulo Anuncios llegan a la campana de notificaciones con icono celeste. Se marcan como leídos al hacer clic." },
  ];
  const qFaq = normalizeStr(busquedaFaq);
  const faqsFiltradas = FAQS.filter(f => !qFaq || normalizeStr(`${f.question} ${f.answer}`).includes(qFaq));
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] p-5 sm:p-6 rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
            <i className="fa-solid fa-circle-question text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Soporte y Normativa</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Guía operativa y documentación oficial del ciclo de vida de los bienes</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
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
          </div>
          <div className="lg:col-span-7">
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-clipboard-question text-brand-primary"></i> Preguntas Frecuentes
              </h2>
              <div className="relative mb-4">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none"></i>
                  <input
                      type="text" value={busquedaFaq} onChange={(e) => setBusquedaFaq(e.target.value)}
                      placeholder="Buscar en la ayuda..."
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-4 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-500 outline-none transition-all"
                  />
              </div>
              <div className="space-y-4">
                  {faqsFiltradas.map(f => (
                      <FaqItem key={f.question} question={f.question} answer={f.answer} />
                  ))}
                  {faqsFiltradas.length === 0 && (
                      <p className="text-sm font-semibold text-zinc-400 text-center py-6">Sin coincidencias en la ayuda.</p>
                  )}
              </div>
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mt-8 mb-4">
                  <i className="fa-solid fa-keyboard text-brand-primary"></i> Atajos de teclado
              </h2>
              <div className={`${STYLES.card} p-4 sm:p-5`}>
                  {SHORTCUTS.map(s => (
                      <div key={s.accion} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-white/5 last:border-0">
                          <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">{s.accion}</span>
                          <span className="flex gap-1 shrink-0">
                              {s.teclas.map(k => (
                                  <kbd key={k} className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-white/5 px-2 py-1 text-[11px] font-black text-zinc-600 dark:text-zinc-300">{k}</kbd>
                              ))}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}
