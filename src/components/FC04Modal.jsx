import React, { useState } from 'react';
import { useDraft, serializarForm } from '../hooks/useDraft';
import FiltroCombo from './FiltroCombo';

const LABEL = "block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2";
const INPUT_FOCUS = " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary";
const BTN_PRIMARY = "inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] h-10 px-5 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50";
const BTN_SECONDARY = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50";
const BTN_SECONDARY_SM = "inline-flex items-center justify-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all cursor-pointer";

export default function FC04Modal({ setIsFC04ModalOpen, fc04Editing, saveFC04, fc10Month, fc10Year, ORIGENES_FC04, fc04SinMovimiento, setFc04SinMovimiento, handleAddFC04Item, fc04Items, handleFC04ItemChange, handleRemoveFC04Item, STYLES }) {
    
    // PROTECCIÓN ANTICRASH: Si la lista de items llega desconectada, usamos un array vacío
    const safeItems = fc04Items || [];
    const safeOrigenes = ORIGENES_FC04 || [];
    const esNuevoFC = !fc04Editing;
    const { borrador: borradorFC, hayBorrador: hayBorradorFC, guardarBorrador: guardarBorradorFC, limpiarBorrador: limpiarBorradorFC } = useDraft('borrador_fc04_nuevo', esNuevoFC);
    const [restauradoFC, setRestauradoFC] = useState(null);
    const [formKeyFC, setFormKeyFC] = useState(0);
    const defectoFC = (campo, fb) => (restauradoFC && restauradoFC[campo] !== undefined && restauradoFC[campo] !== null ? restauradoFC[campo] : fb);
    const continuarBorradorFC = () => {
        if (!borradorFC) return;
        setRestauradoFC(borradorFC);
        setFormKeyFC(k => k + 1);
    };

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-5xl"}>
                <div className={STYLES.modalHeader + " gap-4"}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white shrink-0">
                            <i className="fa-solid fa-file-contract text-lg"></i>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                            {fc04Editing ? 'Editar Registro FC-04' : 'Nuevo Registro FC-04'}
                        </h2>
                    </div>
                    <button type="button" title="Cerrar" aria-label="Cerrar" onClick={() => setIsFC04ModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors cursor-pointer shrink-0"><i className="fa-solid fa-xmark text-base"></i></button>
                </div>
                
                {esNuevoFC && hayBorradorFC && !restauradoFC && (
                  <div className="mx-8 mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 animate-fade-in">
                    <i className="fa-solid fa-history text-amber-600 dark:text-amber-400 text-sm"></i>
                    <p className="flex-1 min-w-[200px] text-xs font-bold text-amber-700 dark:text-amber-300">Tienes un borrador sin guardar.</p>
                    <button type="button" onClick={continuarBorradorFC} className="h-8 px-3.5 rounded-xl text-[11px] font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all cursor-pointer">Continuar</button>
                    <button type="button" onClick={limpiarBorradorFC} className="h-8 px-3.5 rounded-xl text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">Descartar</button>
                  </div>
                )}
                <form key={formKeyFC} onSubmit={async (e) => { const ok = await saveFC04(e); if (ok) limpiarBorradorFC(); }} onChange={(e) => guardarBorradorFC(serializarForm(e.currentTarget))} className="flex flex-col h-full overflow-hidden">
                    <div className={STYLES.modalBody}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                            <div><label className={LABEL}>Mes</label><FiltroCombo name="mes" required valor={defectoFC('mes', (fc04Editing?.mes || fc10Month))} opciones={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))} etiquetaTodos="Mes" titulo="Mes del periodo" compacto /></div>
                            <div><label className={LABEL}>Año</label><FiltroCombo name="anio" required valor={defectoFC('anio', (fc04Editing?.anio || fc10Year))} opciones={Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 5 + i))} etiquetaTodos="Año" titulo="Año del periodo" compacto /></div>
                            <div><label className={LABEL}>Origen del Movimiento</label><FiltroCombo name="origenMovimiento" required valor={defectoFC('origenMovimiento', (fc04Editing?.origenMovimiento))} opciones={safeOrigenes.map(o => ({ label: `${o.id} - ${o.nombre}`, value: o.id }))} etiquetaTodos="Origen" titulo="Origen del movimiento" compacto /></div>
                        </div>

                        <div className="flex items-center gap-2 mb-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-darkbg-main dark:border-darkbg-border">
                            <input type="checkbox" id="sinMovimiento" checked={fc04SinMovimiento} onChange={(e) => setFc04SinMovimiento(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer" />
                            <label htmlFor="sinMovimiento" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Declarar "Sin Movimiento" para este periodo</label>
                        </div>

                        {!fc04SinMovimiento && (
                            <div className="border border-zinc-200 dark:border-darkbg-border rounded-xl overflow-hidden shadow-sm">
                                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-darkbg-main border-b border-zinc-200 dark:border-darkbg-border">
                                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Bienes Involucrados</h3>
                                    <button type="button" onClick={handleAddFC04Item} className={BTN_SECONDARY_SM}>
                                        <i className="fa-solid fa-plus"></i> Agregar Fila
                                    </button>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left min-w-[900px]">
                                        <thead className="bg-white dark:bg-darkbg-card border-b border-zinc-200 dark:border-darkbg-border text-[11px] font-semibold text-zinc-500 uppercase">
                                            <tr>
                                                <th className="p-3 w-28">Cta. Mayor</th>
                                                <th className="p-3 w-24">Subcta.</th>
                                                <th className="p-3 w-32">Rótulo</th>
                                                <th className="p-3">Descripción</th>
                                                <th className="p-3 w-36 text-right">Valor (Gs.)</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-darkbg-border bg-white dark:bg-darkbg-card">
                                            {safeItems.length === 0 ? (
                                                <tr><td colSpan="6" className="p-8 text-center text-sm font-medium text-zinc-400">Presiona "Agregar Fila" para listar bienes.</td></tr>
                                            ) : safeItems.map(item => (
                                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-darkbg-hover/50">
                                                    <td className="p-1.5"><input required className={STYLES.input + INPUT_FOCUS + " !py-2 !text-xs tabular-nums"} value={item.cuenta || ''} onChange={e => handleFC04ItemChange(item.id, 'cuenta', e.target.value)} /></td>
                                                    <td className="p-1.5"><input className={STYLES.input + INPUT_FOCUS + " !py-2 !text-xs tabular-nums"} value={item.subcuenta || ''} onChange={e => handleFC04ItemChange(item.id, 'subcuenta', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + INPUT_FOCUS + " !py-2 !text-xs"} value={item.rotulo || ''} onChange={e => handleFC04ItemChange(item.id, 'rotulo', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + INPUT_FOCUS + " !py-2 !text-xs"} value={item.descripcion || ''} onChange={e => handleFC04ItemChange(item.id, 'descripcion', e.target.value)} /></td>
                                                    <td className="p-1.5"><input required className={STYLES.input + INPUT_FOCUS + " !py-2 !text-xs text-right font-mono font-bold tabular-nums"} value={item.valorUnitario || ''} onChange={e => handleFC04ItemChange(item.id, 'valorUnitario', e.target.value)} /></td>
                                                    <td className="p-1.5 text-center"><button type="button" onClick={()=>handleRemoveFC04Item(item.id)} className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><i className="fa-solid fa-trash-can"></i></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={STYLES.modalFooter}>
                        <button type="button" onClick={() => setIsFC04ModalOpen(false)} className={BTN_SECONDARY}>Cancelar</button>
                        <button type="submit" className={BTN_PRIMARY}><i className="fa-solid fa-floppy-disk"></i> Guardar Expediente FC-04</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
