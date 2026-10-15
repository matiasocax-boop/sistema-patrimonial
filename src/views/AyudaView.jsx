import FaqItem from '../components/FaqItem';
import WorkflowStep from '../components/WorkflowStep';

// Vista de ayuda/Soporte y Normativa (extraída de App.jsx, Fase 4).
// Contenido estático + botón de tour guiado.
export default function AyudaView({ setTourPaso, STYLES }) {
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
              <h2 className="text-lg font-bold leading-6 text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                  <i className="fa-solid fa-clipboard-question text-brand-primary"></i> Preguntas Frecuentes
              </h2>
              <div className="space-y-4">
                  <FaqItem question="Explicación de la alerta crítica 'Req. Acción'" answer="Este indicador previene discrepancias en el inventario. Se activa bajo dos escenarios: 1) Ingreso de un nuevo bien sin ubicación física definida. 2) Recepción de un bien trasladado (FC-11) que no ha sido re-asignado legalmente mediante un nuevo FC-10." />
                  <FaqItem question="Protocolo para exclusión de inventario (Baja)" answer="La normativa exige generar un expediente FC-04 de cierre, seleccionando 'Baja' como origen. El sistema procesará el descargo contable e inhabilitará el registro. La modificación manual del estado en el inventario solo se admite para correcciones de digitación." />
                  <FaqItem question="Autocompletado de la estructura organizacional" answer="El formulario FC-10 emplea aprendizaje histórico. Al procesar las primeras asignaciones, el sistema mapea la jerarquía (Unidad, Repartición, etc.) permitiendo el despliegue automático en procesos futuros, reduciendo la carga administrativa." />
                  <FaqItem question="Recuperación de registros históricos (Bajas)" answer="A fines de precisión contable, los ítems dados de baja no participan de las métricas principales. Para auditar este histórico, acceda a 'Directorio Patrimonial' y ejecute el filtro 'Bajas' en el panel de herramientas." />
                  <FaqItem question="Exportación masiva de código de barras (QR)" answer="A través de la vista de Inventario, usted puede aplicar segmentaciones por ubicación o custodio. Ejecute el comando 'Lote QRs' para compilar un archivo comprimido (.zip) estructurado para impresión industrial." />
              </div>
          </div>
      </div>
    </div>
  );
}
