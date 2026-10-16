import { lazyConReintento } from '../utils/lazyConReintento';
const BienModal = lazyConReintento(() => import('./BienModal'));
const FC04Modal = lazyConReintento(() => import('./FC04Modal'));
const FC10Modal = lazyConReintento(() => import('./FC10Modal'));
const FC11Modal = lazyConReintento(() => import('./FC11Modal'));
const CSVPreviewModal = lazyConReintento(() => import('./CSVPreviewModal'));
const LogoutModal = lazyConReintento(() => import('./modals/LogoutModal'));
const ResolucionBajaModal = lazyConReintento(() => import('./modals/ResolucionBajaModal'));
const DependenciaConfirmModal = lazyConReintento(() => import('./modals/DependenciaConfirmModal'));
const QRModal = lazyConReintento(() => import('./modals/QRModal'));
const ConsolidadoFC10Modal = lazyConReintento(() => import('./modals/ConsolidadoFC10Modal'));
const UsuarioModal = lazyConReintento(() => import('./modals/UsuarioModal'));
const NuevoFuncionarioModal = lazyConReintento(() => import('./modals/NuevoFuncionarioModal'));
const FuncionarioModal = lazyConReintento(() => import('./modals/FuncionarioModal'));
const ScannerModal = lazyConReintento(() => import('./modals/ScannerModal'));
const UnsavedChangesModal = lazyConReintento(() => import('./modals/UnsavedChangesModal'));
import FichaBienModal from './FichaBienModal';
import TourGuiado from './TourGuiado';
import CommandPalette from './CommandPalette';
import DependenciasModal from './modals/DependenciasModal';
import UbicacionesModal from './modals/UbicacionesModal';
import MantenimientoModal from './modals/MantenimientoModal';
import { formatCurrency, formatDateText, formatCI, matchSearchWords } from '../utils/helpers';

// Cableado de modales y flotantes (extraído de App.jsx, Fase 6).
// Componente presentacional: todo llega por props, sin estado propio.
export default function AppModals({
  STYLES,
  isCSVPreviewOpen,
  setIsCSVPreviewOpen,
  confirmCSVImportFuncionarios,
  csvPreviewData,
  isFuncionarioModalOpen,
  setIsFuncionarioModalOpen,
  funcionarioToEdit,
  saveFuncionarioEdit,
  ubicacionesDep,
  isScannerOpen,
  setIsScannerOpen,
  setScanParaConteo,
  scanParaConteo,
  conteoCodigos,
  isQRModalOpen,
  setIsQRModalOpen,
  isBulkQR,
  qrTargetBien,
  handleDownloadLabelPNG,
  handleDownloadSimpleQR,
  handleBulkLabelPNGZip,
  handleBulkSimpleQRZip,
  isFC03ModalOpen,
  setIsFC03ModalOpen,
  fc03Config,
  setFc03Config,
  fc03FuncionarioTexto,
  setFc03FuncionarioTexto,
  showFC03FuncDropdown,
  setShowFC03FuncDropdown,
  ubicacionesUnicas,
  funcionariosPadron,
  dependenciaActual,
  executeGenerateFC03,
  isFC04ModalOpen,
  setIsFC04ModalOpen,
  fc04Editing,
  saveFC04,
  fc10Month,
  fc10Year,
  ORIGENES_FC04,
  fc04SinMovimiento,
  setFc04SinMovimiento,
  handleAddFC04Item,
  fc04Items,
  handleFC04ItemChange,
  handleRemoveFC04Item,
  isFC10ModalOpen,
  setIsFC10ModalOpen,
  fc10TargetBien,
  fc10Editing,
  saveFC10,
  funcionariosConDatos,
  isFC11ModalOpen,
  setIsFC11ModalOpen,
  fc11TargetBien,
  fc11Editing,
  saveFC11,
  todasDependencias,
  isUsuarioModalOpen,
  isAdmin,
  setIsUsuarioModalOpen,
  usuarioEditing,
  saveUsuario,
  esDesarrollador,
  isBienModalOpen,
  setIsBienModalOpen,
  bienEditing,
  setBienEditing,
  bienFormRef,
  saveBien,
  isSaving,
  ESTADOS_CONSERVACION,
  sugerenciasBienesDep,
  padronDep,
  fichaBien,
  setFichaBien,
  setEventosAuditFicha,
  eventosFicha,
  subirFotoBien,
  eliminarFotoBien,
  subiendoFoto,
  tourPaso,
  pasosTour,
  setTourPaso,
  cerrarTour,
  setActiveTab,
  cmdOpen,
  setCmdOpen,
  bienes,
  irTabGlobal,
  isDependenciasModalOpen,
  setIsDependenciasModalOpen,
  dependenciasList,
  DEPENDENCIAS_UNP,
  dependenciasDetectadas,
  conteosDependencia,
  guardarDependencia,
  eliminarDependencia,
  fusionarDependencia,
  isSavingDep,
  verPadronDependencia,
  ubicacionesList,
  conteosUbicacion,
  guardarUbicacion,
  eliminarUbicacion,
  asignarFuncionarioAUbicacion,
  isUbicacionesModalOpen,
  setIsUbicacionesModalOpen,
  isSavingUbicacion,
  isMantenimientoModalOpen,
  setIsMantenimientoModalOpen,
  mantenimiento,
  saveMantenimiento,
  isSavingMant,
  showLogoutConfirm,
  setShowLogoutConfirm,
  handleLogout,
  resolucionBaja,
  setResolucionBaja,
  submitResolucionBaja,
  motivoResolucion,
  setMotivoResolucion,
  itemToDelete,
  setItemToDelete,
  motivoSolicitudBaja,
  setMotivoSolicitudBaja,
  confirmDeleteAction,
  confirmBackupModal,
  setConfirmBackupModal,
  handleExportBackupGeneral,
  pendingCSVImport,
  setPendingCSVImport,
  fileInputRef,
  fileInputFuncionariosRef,
  executeProcessBienesCSV,
  executeProcessFuncionariosCSV,
  showChangelog,
  setShowChangelog,
  isConsolidatedFC10ModalOpen,
  setIsConsolidatedFC10ModalOpen,
  handleGenerateConsolidatedFC10PDF,
  isNewFuncionarioModalOpen,
  setIsNewFuncionarioModalOpen,
  handleSaveManualFuncionario,
  showUnsavedChangesModal,
  setShowUnsavedChangesModal,
  showDependenciaConfirm,
  setShowDependenciaConfirm,
  confirmDependenciaChange,
  pendingDependencia,
  clearAllFilters, setSearchTerm, setSearchInput, setCurrentPage,
  openFC03Modal
}) {
  return (
    <>
          {isCSVPreviewOpen && (
              <CSVPreviewModal 
                  isOpen={isCSVPreviewOpen}
                  onClose={() => setIsCSVPreviewOpen(false)}
                  onConfirm={confirmCSVImportFuncionarios}
                  data={csvPreviewData}
                  STYLES={STYLES}
              />
          )}
          {/* ... demás modales ... */}
          <FuncionarioModal 
        isOpen={isFuncionarioModalOpen}
        onClose={() => setIsFuncionarioModalOpen(false)}
        funcionarioToEdit={funcionarioToEdit}
        saveFuncionarioEdit={saveFuncionarioEdit}
        ubicaciones={ubicacionesDep}
        STYLES={STYLES}
    />
          <ScannerModal 
        isOpen={isScannerOpen}
        onClose={() => {
            setIsScannerOpen(false);
            setScanParaConteo(false);
            if (window.html5QrCode && window.html5QrCode.isScanning) {
                window.html5QrCode.stop().catch(() => {});
            }
        }}
        modoConteo={scanParaConteo}
        conteoActual={conteoCodigos.length}
        STYLES={STYLES}
    />
          <QRModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        isBulk={isBulkQR}
        bien={qrTargetBien}
        onDownloadLabel={handleDownloadLabelPNG}
        onDownloadSimpleQR={handleDownloadSimpleQR}
        onBulkLabelZip={handleBulkLabelPNGZip}
        onBulkSimpleZip={handleBulkSimpleQRZip}
        STYLES={STYLES}
    />
          {isFC03ModalOpen && (
            <div className={STYLES.modalOverlay}>
              <div className={STYLES.modalContent + " max-w-md overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 animate-slide-up"}>
                {/* CABECERA LIMPIA */}
                <div className="relative px-6 sm:px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                       <i className="fa-solid fa-file-pdf text-lg"></i>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Generar Inventario FC-03</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Configura los parámetros del reporte</p>
                    </div>
                  </div>
                  <button onClick={() => setIsFC03ModalOpen(false)} title="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">
                     <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                {/* CUERPO DEL MODAL */}
                <div className="p-8 space-y-6 bg-white dark:bg-zinc-900">
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tipo de Reporte</label>
                        <div className="relative">
                            <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.tipoFiltro} onChange={e => {
                                setFc03Config({...fc03Config, tipoFiltro: e.target.value, filtroValor: ''});
                                setFc03FuncionarioTexto('');
                                setShowFC03FuncDropdown(false);
                            }}>
                                <option value="general">General (Toda la Dependencia)</option>
                                <option value="ubicacion">Por Ubicación Específica</option>
                                <option value="funcionario">Por Funcionario Responsable</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                        </div>
                    </div>               
                    {fc03Config.tipoFiltro === 'ubicacion' && (
                        <div className="space-y-2 animate-fade-in">
                            <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Seleccionar Ubicación</label>
                            <div className="relative">
                                <select className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all cursor-pointer appearance-none" value={fc03Config.filtroValor} onChange={e => setFc03Config({...fc03Config, filtroValor: e.target.value})}>
                                    <option value="">Seleccione una ubicación...</option>
                                    {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                            </div>
                        </div>
                    )}               
                    {fc03Config.tipoFiltro === 'funcionario' && (() => {
                        const depFuncionarios = funcionariosPadron.filter(f => f.dependencia === dependenciaActual);
                        const listadoFiltrado = depFuncionarios.filter(f => 
                            matchSearchWords(`${f.cedula} ${f.nombre}`, fc03FuncionarioTexto)
                        );

                        return (
                            <div className="space-y-2 animate-fade-in relative">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                        Buscar Funcionario Responsable
                                    </label>
                                    {fc03Config.filtroValor && (
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            <i className="fa-solid fa-check mr-1"></i> Seleccionado
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
                                    <input 
                                        type="text"
                                        value={fc03FuncionarioTexto}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFc03FuncionarioTexto(val);
                                            setShowFC03FuncDropdown(true);
                                            if (!val) {
                                                setFc03Config(prev => ({ ...prev, filtroValor: '' }));
                                            }
                                        }}
                                        onFocus={() => setShowFC03FuncDropdown(true)}
                                        placeholder="Escriba Marta Ocampo, apellido o CI..."
                                        className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 pl-10 pr-10 py-3.5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner"
                                    />
                                    {fc03FuncionarioTexto && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFc03FuncionarioTexto('');
                                                setFc03Config(prev => ({ ...prev, filtroValor: '' }));
                                                setShowFC03FuncDropdown(true);
                                            }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                                        >
                                            <i className="fa-solid fa-xmark text-xs"></i>
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown flotante */}
                                {showFC03FuncDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowFC03FuncDropdown(false)} 
                                        />
                                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 divide-y divide-zinc-100 dark:divide-zinc-800/60 custom-scrollbar">
                                            {listadoFiltrado.length === 0 ? (
                                                <div className="p-4 text-center text-xs font-semibold text-zinc-400">
                                                    No se encontraron funcionarios coincidentes
                                                </div>
                                            ) : (
                                                listadoFiltrado.slice(0, 50).map(f => {
                                                    const isSelected = fc03Config.filtroValor === f.nombre;
                                                    return (
                                                        <button
                                                            key={f.id || (f.cedula + '-' + f.nombre)}
                                                            type="button"
                                                            onClick={() => {
                                                                setFc03Config(prev => ({ ...prev, filtroValor: f.nombre }));
                                                                setFc03FuncionarioTexto(f.nombre);
                                                                setShowFC03FuncDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                                                isSelected 
                                                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold' 
                                                                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col truncate pr-2">
                                                                <span className="truncate">{f.nombre}</span>
                                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                                    {f.cedula !== 'S/C' ? `CI: ${formatCI(f.cedula)}` : 'Sin Cédula'}
                                                                </span>
                                                            </div>
                                                            {isSelected && <i className="fa-solid fa-check text-amber-600 shrink-0"></i>}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lugar de Emisión</label>
                        <input type="text" className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner" value={fc03Config.lugar} onChange={e => setFc03Config({...fc03Config, lugar: e.target.value})} placeholder="Ej: Pilar" />
                    </div>
                </div>
                {/* BOTONES DE ACCIÓN */}
                <div className="flex justify-end gap-2 px-6 sm:px-8 py-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 z-10 rounded-b-[24px]">
                  <button onClick={() => setIsFC03ModalOpen(false)} className="h-10 px-5 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none">Cancelar</button>
                  <button onClick={executeGenerateFC03} className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 dark:disabled:hover:bg-white" disabled={fc03Config.tipoFiltro !== 'general' && !fc03Config.filtroValor}>
                    <i className="fa-solid fa-file-pdf text-xs"></i> Generar Documento
                  </button>
                </div>
              </div>
            </div>
          )}
          {isFC04ModalOpen && (
              <FC04Modal 
                  setIsFC04ModalOpen={setIsFC04ModalOpen}
                  fc04Editing={fc04Editing}
                  saveFC04={saveFC04}
                  fc10Month={fc10Month}
                  fc10Year={fc10Year}
                  ORIGENES_FC04={ORIGENES_FC04}
                  fc04SinMovimiento={fc04SinMovimiento}
                  setFc04SinMovimiento={setFc04SinMovimiento}
                  handleAddFC04Item={handleAddFC04Item}
                  fc04Items={fc04Items || []}
                  handleFC04ItemChange={handleFC04ItemChange}
                  formatCurrency={formatCurrency}
                  handleRemoveFC04Item={handleRemoveFC04Item}
                  STYLES={STYLES}
              />
          )}
          {isFC10ModalOpen && (
              <FC10Modal 
                  setIsFC10ModalOpen={setIsFC10ModalOpen}
                  fc10TargetBien={fc10TargetBien}
                  fc10Editing={fc10Editing}
                  saveFC10={saveFC10}
                  STYLES={STYLES}
                  formatCurrency={formatCurrency}
                  funcionariosConDatos={funcionariosConDatos}
              />
          )}
          {isFC11ModalOpen && (
              <FC11Modal 
                  setIsFC11ModalOpen={setIsFC11ModalOpen}
                  fc11TargetBien={fc11TargetBien}
                  fc11Editing={fc11Editing}
                  saveFC11={saveFC11}
                  fc10Month={fc10Month}
                  fc10Year={fc10Year}
                  todasDependencias={todasDependencias}
                  dependenciaActual={dependenciaActual}
                  formatCurrency={formatCurrency}
                  STYLES={STYLES}
              />
          )}
          <UsuarioModal 
        isOpen={isUsuarioModalOpen && isAdmin}
        onClose={() => setIsUsuarioModalOpen(false)}
        usuarioEditing={usuarioEditing}
        saveUsuario={saveUsuario}
        todasDependencias={todasDependencias}
        esDesarrollador={esDesarrollador}
        STYLES={STYLES}
    />
          {isBienModalOpen && (
        <BienModal 
            setIsBienModalOpen={setIsBienModalOpen}
            bienEditing={bienEditing}
            setBienEditing={setBienEditing}
            bienFormRef={bienFormRef}
            saveBien={saveBien}
            isSaving={isSaving}
            formatCurrency={formatCurrency}
            ESTADOS_CONSERVACION={ESTADOS_CONSERVACION}
            funcionariosConDatos={funcionariosConDatos}
            ubicacionesUnicas={ubicacionesUnicas}
            STYLES={STYLES}
            funcionariosPadron={padronDep}
            ubicaciones={ubicacionesDep}
            sugerenciasBienes={sugerenciasBienesDep}
        />
    )}
          <FichaBienModal
            isOpen={Boolean(fichaBien)}
            onClose={() => { setFichaBien(null); setEventosAuditFicha([]); }}
            bien={fichaBien}
            eventos={eventosFicha}
            formatCurrency={formatCurrency}
            formatDateText={formatDateText}
            onAgregarFoto={subirFotoBien}
            onEliminarFoto={eliminarFotoBien}
            subiendoFoto={subiendoFoto}
            esAdmin={isAdmin}
            STYLES={STYLES}
            onVerEnInventario={(bien) => {
              setFichaBien(null);
              setEventosAuditFicha([]);
              clearAllFilters();
              const r = bien?.rotulo || '';
              setSearchTerm(r);
              setSearchInput(r);
              setCurrentPage(1);
              setActiveTab('inventario');
            }}
          />
          {tourPaso >= 0 && (
            <TourGuiado
              pasos={pasosTour}
              paso={tourPaso}
              setPaso={setTourPaso}
              onClose={cerrarTour}
              irTab={(tab) => { if (tab) setActiveTab(tab); }}
            />
          )}
          <CommandPalette
            isOpen={cmdOpen}
            onClose={() => setCmdOpen(false)}
            bienes={bienes}
            funcionarios={funcionariosPadron}
            dependenciaActual={dependenciaActual}
            irInventario={(rotulo) => { clearAllFilters(); setSearchTerm(rotulo); setSearchInput(rotulo); setCurrentPage(1); setActiveTab('inventario'); }}
            abrirNuevoBien={() => { setBienEditing(null); setIsBienModalOpen(true); }}
            abrirEscaner={() => setIsScannerOpen(true)}
            abrirFC03={() => openFC03Modal()}
            irTab={irTabGlobal}
          />
          <DependenciasModal
            isOpen={isDependenciasModalOpen}
            onClose={() => setIsDependenciasModalOpen(false)}
            dependencias={dependenciasList.length > 0 ? dependenciasList.filter(d => d.activa !== false) : DEPENDENCIAS_UNP.map(n => ({ id: n, nombre: n }))}
            detectadas={dependenciasDetectadas}
            conteos={conteosDependencia}
            onSave={guardarDependencia}
            onDelete={eliminarDependencia}
            onFusionar={fusionarDependencia}
            isSaving={isSavingDep}
            dependenciaActual={dependenciaActual}
            onVerPadron={verPadronDependencia}
            ubicacionesList={ubicacionesList}
            conteosUbicacion={conteosUbicacion}
            funcionarios={funcionariosPadron}
            onGuardarUbicacion={guardarUbicacion}
            onEliminarUbicacion={eliminarUbicacion}
            onAsignarFuncionario={asignarFuncionarioAUbicacion}
            STYLES={STYLES}
          />
          <UbicacionesModal
            isOpen={isUbicacionesModalOpen}
            onClose={() => setIsUbicacionesModalOpen(false)}
            ubicaciones={ubicacionesList.filter(u => u.dependencia === dependenciaActual)}
            conteos={conteosUbicacion}
            onSave={guardarUbicacion}
            onDelete={eliminarUbicacion}
            isSaving={isSavingUbicacion}
            dependenciaActual={dependenciaActual}
            STYLES={STYLES}
          />
          <MantenimientoModal
            isOpen={isMantenimientoModalOpen}
            onClose={() => setIsMantenimientoModalOpen(false)}
            initial={mantenimiento}
            onSave={saveMantenimiento}
            isSaving={isSavingMant}
            STYLES={STYLES}
          />
          <LogoutModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={handleLogout} 
        STYLES={STYLES} 
    />
          <ResolucionBajaModal 
        resolucionBaja={resolucionBaja}
        setResolucionBaja={setResolucionBaja}
        submitResolucionBaja={submitResolucionBaja}
        motivoResolucion={motivoResolucion}
        setMotivoResolucion={setMotivoResolucion}
        STYLES={STYLES}
    />
          {/* MODAL DE AVISO PARA ELIMINACIÓN O SOLICITUD DE BAJA */}
          {itemToDelete && (() => {
            const tipo = itemToDelete.type;
            const esFunc = tipo === 'funcionario' || tipo === 'requestBajaFuncionario';
            const esSolicitud = tipo === 'requestBaja' || tipo === 'requestBajaFuncionario';
            const titulo = esFunc
              ? (esSolicitud ? 'Solicitar eliminación del funcionario' : '¿Eliminar del padrón?')
              : (tipo === 'usuario' ? '¿Eliminar usuario?'
              : tipo === 'fc10' ? '¿Eliminar acta FC-10?'
              : tipo === 'fc11' ? '¿Eliminar formulario FC-11?'
              : tipo === 'fc04' ? '¿Eliminar acta FC-04?'
              : (esSolicitud ? 'Solicitud de Baja / Eliminación' : '¿Eliminar o dar de baja el registro?'));
            const nombreFc10 = itemToDelete.item?.funcionarioNombre || 'este funcionario';
            const rotuloFc10 = itemToDelete.item?.bienRotulo || itemToDelete.item?.rotulo || 'S/Rótulo';
            const numFc11 = itemToDelete.item?.numeroFormulario || 'S/Nº';
            const rotuloFc11 = itemToDelete.item?.bienSnapshot?.rotulo || 'S/Rótulo';
            const periodoFc04 = (itemToDelete.item?.mes || itemToDelete.item?.anio)
              ? `${itemToDelete.item?.mes || '?'} / ${itemToDelete.item?.anio || '?'}` : 'este periodo';
            const nombreUsuario = itemToDelete.item?.nombre
              ? `${itemToDelete.item.username || itemToDelete.username || ''} (${itemToDelete.item.nombre})`
              : (itemToDelete.item?.username || itemToDelete.username || 'este usuario');
            const descripcion = esFunc
              ? (esSolicitud
                ? `Se enviará una notificación formal al administrador para evaluar la exclusión de "${itemToDelete.item?.nombre || 'este funcionario'}" (CI ${itemToDelete.item?.cedula || 'S/C'}) del padrón.`
                : `Se eliminará a "${itemToDelete.item?.nombre || 'este funcionario'}" (CI ${itemToDelete.item?.cedula || 'S/C'}) del padrón de forma permanente. Esta acción no se puede deshacer.`)
              : (tipo === 'usuario'
                ? `Se eliminará al usuario "${nombreUsuario}" de forma permanente. Esta acción no se puede deshacer.`
              : tipo === 'fc10'
                ? `Se eliminará el acta FC-10 de "${nombreFc10}" (rótulo ${rotuloFc10}) de forma permanente. Esta acción no se puede deshacer.`
              : tipo === 'fc11'
                ? `Se eliminará el formulario FC-11 Nº ${numFc11} (rótulo ${rotuloFc11}) de forma permanente. Esta acción no se puede deshacer.`
              : tipo === 'fc04'
                ? `Se eliminará el acta FC-04 del periodo ${periodoFc04} de forma permanente. Esta acción no se puede deshacer.`
              : (esSolicitud
                ? `Se enviará una notificación formal al administrador para evaluar la exclusión del activo "${itemToDelete.item?.rotulo || 'S/Rótulo'}".`
                : `Esta acción modificará el estado del activo "${itemToDelete.item?.rotulo || 'S/Rótulo'}" a De Baja o lo removerá del inventario activo.`));
            return (
            <div className={STYLES.modalOverlay}>
                <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>

                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${esSolicitud ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <i className={`fa-solid ${esSolicitud ? 'fa-paper-plane' : 'fa-triangle-exclamation'} text-xl`}></i>
                    </div>

                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                        {titulo}
                    </h3>

                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                        {descripcion}
                    </p>

                    {esSolicitud && (
                      <div className="text-left mb-6 space-y-1.5">
                        <label className="block text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Motivo de la solicitud <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={motivoSolicitudBaja}
                          onChange={(e) => setMotivoSolicitudBaja(e.target.value)}
                          placeholder={esFunc ? 'Ej: Renuncia, traslado definitivo, jubilación...' : 'Ej: Avería irreparable, rotura física, obsolescencia, desuso...'}
                          className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal focus:bg-white dark:focus:bg-zinc-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-inner resize-none"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => { setItemToDelete(null); setMotivoSolicitudBaja(''); }}
                            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDeleteAction}
                            disabled={esSolicitud && !motivoSolicitudBaja.trim()}
                            className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {esSolicitud ? 'Enviar Solicitud' : 'Confirmar Acción'}
                        </button>
                    </div>

                </div>
            </div>
            );
          })()}
          {/* MODAL DE CONFIRMACIÓN DE BACKUP GENERAL */}
          {confirmBackupModal && (
            <div className={STYLES.modalOverlay}>
              <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white mb-4">
                  <i className="fa-solid fa-database text-xl"></i>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                  ¿Descargar Copia de Seguridad?
                </h3>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Esta operación compilará y descargará una copia completa e íntegra (.json) de todos los registros patrimoniales, funcionarios, asignaciones y auditorías de la Universidad.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmBackupModal(false)}
                    className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmBackupModal(false);
                      handleExportBackupGeneral();
                    }}
                    className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                    <i className="fa-solid fa-download mr-1.5 text-xs"></i> Sí, Descargar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE CONFIRMACIÓN DE IMPORTACIÓN MASIVA CSV */}
          {pendingCSVImport && (
            <div className={STYLES.modalOverlay}>
              <div className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up"}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white mb-4">
                  <i className="fa-solid fa-file-csv text-xl"></i>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                  ¿Confirmar Importación Masiva?
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-left mb-6 space-y-1.5">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Archivo seleccionado:</p>
                  <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{pendingCSVImport.file?.name}</p>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-1">Destino:</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{dependenciaActual}</p>
                </div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Los registros serán validados para evitar duplicados e incorporados a la base de datos oficial. ¿Desea proceder con la carga?
                </p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      if (fileInputFuncionariosRef.current) fileInputFuncionariosRef.current.value = '';
                      setPendingCSVImport(null);
                    }}
                    className="flex-1 h-10 px-4 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const { type, file } = pendingCSVImport;
                      setPendingCSVImport(null);
                      if (type === 'bienes') {
                        executeProcessBienesCSV(file);
                      } else {
                        executeProcessFuncionariosCSV(file);
                      }
                    }}
                    className="flex-1 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                    <i className="fa-solid fa-check mr-1.5 text-xs"></i> Sí, Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showChangelog && (
            <div className={STYLES.modalOverlay}>
                <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
                    <div className="px-6 py-8 sm:px-8 text-center relative overflow-hidden bg-[#0a1c38]">
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-[22rem] rounded-full bg-violet-500/20 blur-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-[0.18em] mb-4">
                                <i className="fa-solid fa-circle-check text-[10px]"></i> Sistema Actualizado
                            </span>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Novedades de la v{mantenimiento?.ultima_version || ''}</h2>
                        </div>
                    </div>
                    <div className="p-6 sm:p-8 bg-white dark:bg-darkbg-card">
                        <ul className="space-y-3">
                            {(Array.isArray(mantenimiento?.notas_version) ? mantenimiento.notas_version : []).map((n, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25 mt-0.5">
                                        <i className="fa-solid fa-check text-[9px] text-emerald-500"></i>
                                    </span>
                                    <span>{n}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex px-6 sm:px-8 pb-6 sm:pb-8 bg-white dark:bg-darkbg-card">
                        <button
                            onClick={() => {
                                try { localStorage.setItem('unp_last_version', mantenimiento?.ultima_version || ''); } catch (e) {}
                                setShowChangelog(false);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-6 h-11 text-[13px] font-bold text-white dark:text-zinc-900 transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                        >
                            Entendido, continuar al sistema
                        </button>
                    </div>
                </div>
            </div>
          )}
          <ConsolidadoFC10Modal 
        isOpen={isConsolidatedFC10ModalOpen}
        onClose={() => setIsConsolidatedFC10ModalOpen(false)}
        bienes={bienes}
        dependenciaActual={dependenciaActual}
        funcionariosPadron={funcionariosPadron}
        handleGenerateConsolidatedFC10PDF={handleGenerateConsolidatedFC10PDF}
        STYLES={STYLES}
    />
          <NuevoFuncionarioModal 
        isOpen={isNewFuncionarioModalOpen}
        onClose={() => setIsNewFuncionarioModalOpen(false)}
        onSave={handleSaveManualFuncionario}
        dependenciaActual={dependenciaActual}
        ubicaciones={ubicacionesDep}
        STYLES={STYLES}
    />
          <UnsavedChangesModal 
            isOpen={showUnsavedChangesModal}
            onConfirmClose={() => {
              setShowUnsavedChangesModal(false);
              setIsBienModalOpen(false);
              setIsFC04ModalOpen(false);
              setBienEditing(null);
            }}
            onCancel={() => setShowUnsavedChangesModal(false)}
            STYLES={STYLES}
          />
          <DependenciaConfirmModal 
              showDependenciaConfirm={showDependenciaConfirm}
              setShowDependenciaConfirm={setShowDependenciaConfirm}
              confirmDependenciaChange={confirmDependenciaChange}
              pendingDependencia={pendingDependencia}
              STYLES={STYLES}
          />
    </>
  );
}
