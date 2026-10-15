// Constantes globales del sistema (extraídas de App.jsx, Fase 0 del split).
// Sin lógica ni dependencias: importar libremente desde cualquier módulo.

export const STYLES = {
    input: "block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-brand-primary/20 sm:text-sm font-medium dark:border-darkbg-border dark:bg-darkbg-main dark:text-white transition-all outline-none",
    label: "block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2",
    btnPrimary: "inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 h-10 text-[13px] font-bold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none transition-all active:scale-95 cursor-pointer disabled:opacity-50",
    btnSecondary: "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-10 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 border border-transparent hover:border-zinc-200 dark:hover:border-white/10 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none transition-all active:scale-95 cursor-pointer",
    card: "bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm transition-all duration-300",
    modalOverlay: "fixed inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[300] transition-opacity animate-fade-in",
    modalContent: "bg-white dark:bg-darkbg-card rounded-[24px] shadow-2xl w-full max-h-[90dvh] flex flex-col border border-zinc-100 dark:border-darkbg-border overflow-hidden relative animate-slide-up",
    modalHeader: "flex justify-between items-center px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10",
    modalBody: "p-8 overflow-y-auto space-y-8 bg-zinc-50/30 dark:bg-darkbg-card custom-scrollbar",
    modalFooter: "flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-main shrink-0 z-10",
    sectionTitle: "text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-3 border-b border-zinc-100 dark:border-darkbg-border pb-4"
};

export const DEPENDENCIAS_UNP = ["Rectorado", "Facultad de Ciencias Aplicadas", "Facultad de Humanidades y Ciencias de la Educación", "Facultad de Ciencias Contables, Administrativas y Económicas", "Facultad de Derecho, Ciencias Políticas y Sociales", "Facultad de Ciencias Agropecuarias y Desarrollo Rural", "Facultad de Ciencias Biomédicas", "Facultad de Ciencias, Tecnologías y Artes"];

export const ESTADOS_CONSERVACION = ["Muy bueno", "Bueno", "Regular", "Malo", "Inutilizable", "De Baja"];

export const ORIGENES_FC04 = [{ id: "A", nombre: "Alta" }, { id: "B", nombre: "Baja" }, { id: "T", nombre: "Traspaso" }, { id: "C/D", nombre: "Compra o Donación" }];

// Límite de inactividad de sesión (15 minutos).
export const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

// Etiquetas de la bandeja de pendientes del inventario.
export const PENDIENTE_LABELS = { sinQR: 'Sin etiqueta QR', sinFC10: 'Sin acta FC-10', sinUbicacion: 'Sin ubicación', sinFuncionario: 'Sin responsable', vidaVencida: 'Vida útil vencida', porVencer: 'Vida útil por vencer' };
