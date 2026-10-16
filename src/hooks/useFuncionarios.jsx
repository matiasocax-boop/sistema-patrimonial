import { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import localforage from 'localforage';
import { conSello } from '../services/syncBienes';
import { normalizeStr, generateId } from '../utils/helpers';

export const ITEMS_POR_PAGINA_FUNCS = 20;

// Dominio de funcionarios/padrón (extraído de App.jsx, Fase 6).
// El padrón (datos) queda en App; aquí vive la UI del dominio + derivados.
//
// Parámetros:
// - funcionariosPadron, setFuncionariosPadron: datos (viven en App).
// - dependenciaActual, bienes, fc10List: contexto de datos.
// - currentUser, isAdmin: contexto de sesión.
// - notify: addToast estable. setIsProcessing: indicador global.
// - setItemToDelete: modal de borrado. fileInputFuncionariosRef: input oculto.
// - setPendingCSVImport: staging del CSV de bienes (vive en App, se comparte).
export function useFuncionarios({
  funcionariosPadron, setFuncionariosPadron, dependenciaActual,
  bienes, setBienes, fc10List, currentUser, isAdmin,
  notify, setIsProcessing, setItemToDelete, fileInputFuncionariosRef,
  setPendingCSVImport
}) {
  const [currentPaginaFuncionarios, setCurrentPaginaFuncionarios] = useState(1);
  const [isFuncionarioModalOpen, setIsFuncionarioModalOpen] = useState(false);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null);
  const [isNewFuncionarioModalOpen, setIsNewFuncionarioModalOpen] = useState(false);
  const [isCSVPreviewOpen, setIsCSVPreviewOpen] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState({ validos: [], duplicados: [], errores: [] });
  const [pendingFuncionariosToImport, setPendingFuncionariosToImport] = useState([]);
  const [searchFuncionarioInput, setSearchFuncionarioInput] = useState('');

    const funcionariosPurosDependencia = useMemo(() => {  
        let lista = funcionariosPadron.filter(f => f.dependencia === dependenciaActual);  
    
        if (searchFuncionarioInput.trim() !== '') {  
            const tokens = normalizeStr(searchFuncionarioInput).split(' ').filter(Boolean);  
            lista = lista.filter(f => {  
                const haystack = normalizeStr(`${f.cedula || ''} ${f.nombre || ''} ${f.cargo || ''}`);  
                const hayDigits = `${f.cedula || ''}`.replace(/\D/g, '');  
                return tokens.every(tok => {  
                    if (haystack.includes(tok)) return true;  
                    const tokDigits = tok.replace(/\D/g, '');  
                    return Boolean(tokDigits) && hayDigits.includes(tokDigits);  
                });  
            });  
        }  
    
        return lista.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));  
    }, [funcionariosPadron, dependenciaActual, searchFuncionarioInput]);  
  
    const totalPagesFuncs = Math.ceil(funcionariosPurosDependencia.length / ITEMS_POR_PAGINA_FUNCS);  
  
    const funcionariosPaginados = useMemo(() => {  
        const start = (currentPaginaFuncionarios - 1) * ITEMS_POR_PAGINA_FUNCS;  
        const subLista = funcionariosPurosDependencia.slice(start, start + ITEMS_POR_PAGINA_FUNCS);  
    
        // Agregamos los separadores alfabéticos únicamente para los elementos de esta página  
        const listaConSeparadores = [];  
        let letraActual = '';  
    
        subLista.forEach(f => {  
            const primeraLetra = String(f.nombre || '').trim().charAt(0).toUpperCase();  
            if (primeraLetra !== letraActual) {  
                letraActual = primeraLetra;  
                listaConSeparadores.push({ esSeparador: true, letra: letraActual });  
            }  
            listaConSeparadores.push(f);  
        });  
    
        return listaConSeparadores;  
    }, [funcionariosPurosDependencia, currentPaginaFuncionarios]);  
  
    const funcionariosConDatos = useMemo(() => {   
        const map = new Map();   
          
        // 1. Padrón oficial de la dependencia (si hay filas duplicadas del
        // mismo nombre, se queda la que tenga CI/cargo, no la vacía)
        funcionariosPadron.filter(f => f.dependencia === dependenciaActual).forEach(f => {
            const nombreSeguro = String(f.nombre).trim();
            const key = normalizeStr(nombreSeguro);
            const nuevo = { nombre: nombreSeguro, doc: f.cedula || '', cargo: f.cargo || '' };
            if(!map.has(key)) {
                map.set(key, nuevo);
            } else {
                const actual = map.get(key);
                if ((!actual.doc && nuevo.doc) || (!actual.cargo && nuevo.cargo)) {
                    map.set(key, { nombre: actual.nombre, doc: actual.doc || nuevo.doc, cargo: actual.cargo || nuevo.cargo });
                }
            }
        });
    
        // 2. FC-10 de la dependencia actual  
        fc10List.filter(fc => fc.dependencia === dependenciaActual).forEach(fc => {   
            if (fc.funcionarioNombre && String(fc.funcionarioNombre).trim() !== "") {   
                const nombreSeguro = String(fc.funcionarioNombre).trim();   
                if(!map.has(normalizeStr(nombreSeguro))) {   
                    map.set(normalizeStr(nombreSeguro), { nombre: nombreSeguro, doc: fc.funcionarioDoc || '', cargo: fc.funcionarioCargo || '' });   
                }   
            }   
        });   
    
        // 3. Bienes de la dependencia actual  
        bienes.filter(b => b.dependencia === dependenciaActual).forEach(b => {  
            if (b.funcionario && String(b.funcionario).trim() !== "") {  
                const nombreSeguro = String(b.funcionario).trim();  
                if(!map.has(normalizeStr(nombreSeguro))) {  
                    map.set(normalizeStr(nombreSeguro), { nombre: nombreSeguro, doc: '', cargo: '' });  
                }  
            }  
        });  
    
        return Array.from(map.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre));   
    }, [fc10List, bienes, funcionariosPadron, dependenciaActual]);  
  
    const sincronizarBienesConPadron = async () => {  
      setIsProcessing({ active: true, text: 'Sincronizando activos con el Padrón de Funcionarios...' });  
    
      try {  
        let actualizados = 0;  
        const bienesAActualizar = [];  
    
        const nuevosBienes = bienes.map(b => {  
          if (b.funcionario && String(b.funcionario).trim() !== "") {  
            const match = funcionariosPadron.find(f =>   
              normalizeStr(f.nombre) === normalizeStr(b.funcionario) &&   
              (f.dependencia === b.dependencia || !f.dependencia)  
            );  
            if (match && (b.funcionarioDoc !== match.cedula || b.funcionarioCargo !== match.cargo)) {  
              actualizados++;  
              const bienActualizado = { ...b, funcionarioDoc: match.cedula, funcionarioCargo: match.cargo };  
              bienesAActualizar.push(bienActualizado);  
              return bienActualizado;  
            }  
          }  
          return b;  
        });  
    
        if (actualizados > 0) {  
          setBienes(nuevosBienes);  
    
          // Actualización por lotes para no congelar la app  
          const CHUNK_SIZE = 10;  
          for (let i = 0; i < bienesAActualizar.length; i += CHUNK_SIZE) {  
            const chunk = bienesAActualizar.slice(i, i + CHUNK_SIZE);  
            await Promise.all(  
              chunk.map(b => supabase.from('bens').update(conSello({ data: b })).eq('id', b.id))  
            );  
          }  
    
          await localforage.setItem(`bienes_cache_${dependenciaActual}`, nuevosBienes);  
          notify(`¡Sincronización exitosa! Se actualizaron ${actualizados} registros con sus datos oficiales.`, "success");  
        } else {  
          notify("Los activos de esta dependencia ya coinciden exactamente con el padrón oficial.", "info");  
        }  
      } catch (err) {  
        console.error(err);  
        notify("Error al procesar la sincronización en la base de datos.", "error");  
      } finally {  
        setIsProcessing({ active: false, text: '' });  
      }  
    };  
  
    const handleFileUploadFuncionarios = (e) => {  
      const file = e.target.files[0];  
      if (!file) return;  
      setPendingCSVImport({ type: 'funcionarios', file });  
    };  
  
    const executeProcessFuncionariosCSV = (file) => {   
      setIsProcessing({ active: true, text: 'Leyendo planilla de funcionarios...' });  
        
      setTimeout(() => {  
        const reader = new FileReader();  
        reader.onload = async (event) => {  
          const buffer = event.target.result;  
            
          // FORZAR LA DECODIFICACIÓN EN UTF-8 PARA CORREGIR TILDES Y Ñ  
          const decoder = new TextDecoder('utf-8');  
          const text = decoder.decode(buffer);  
            
          const lines = text.split(/\r?\n/);   
            
          if (lines.length < 1) {   
              notify("El archivo CSV está vacío.", "warning");   
              setIsProcessing({ active: false, text: '' });   
              return;   
          }  
            
          const validos = [];  
          const duplicados = [];  
          const errores = [];  
    
          // Mapeo automático de columnas por alias (acepta otros nombres, orden y sin tildes)  
          const ALIAS_FUNC = {  
            cedula: ['CÉDULA', 'CEDULA', 'CI', 'C.I.', 'DOCUMENTO', 'NRO DOCUMENTO', 'NÚMERO DE DOCUMENTO'],  
            nombre: ['NOMBRE COMPLETO', 'NOMBRE', 'FUNCIONARIO', 'APELLIDO Y NOMBRE', 'NOMBRE Y APELLIDO', 'PERSONA'],  
            cargo: ['CARGO', 'PUESTO', 'FUNCIÓN', 'FUNCION', 'ROL', 'CARGO INSTITUCIONAL'],  
          };  
          const normH = (s) => normalizeStr(s || '');  
          let idx = { cedula: 0, nombre: 1, cargo: 2 };  
          let startLine = 0;  
          const primeraLinea = lines.findIndex(l => String(l).trim() !== '');  
          if (primeraLinea !== -1) {  
            const sep0 = lines[primeraLinea].includes(';') ? ';' : ',';  
            const celdas0 = lines[primeraLinea].split(sep0).map(p => p.replace(/"/g, '').trim());  
            const esCabecera = celdas0.some(c => Object.values(ALIAS_FUNC).flat().map(normH).includes(normH(c)));  
            if (esCabecera) {  
              ['cedula', 'nombre', 'cargo'].forEach(k => {  
                const pos = celdas0.findIndex(c => ALIAS_FUNC[k].map(normH).includes(normH(c)));  
                if (pos !== -1) idx[k] = pos;  
              });  
              startLine = primeraLinea + 1;  
            }  
          }  
    
          for (let i = startLine; i < lines.length; i++) {  
            const line = String(lines[i]).trim();  
            if (!line) continue;  
    
            const separator = line.includes(';') ? ';' : ',';  
            const parts = line.split(separator).map(p => p.replace(/"/g, '').trim());  
    
            if (parts.filter(p => p !== '').length < 2) {  
                errores.push({ linea: i + 1, motivo: 'Estructura insuficiente (faltan columnas)' });  
                continue;  
            }  
    
            const cedulaCSV = String(parts[idx.cedula] || '').replace(/\./g, '').trim();  
            const nombreCSV = String(parts[idx.nombre] || '').trim();  
            const cargoCSV = String(parts[idx.cargo] || '').trim();  
    
            if (!cedulaCSV || !nombreCSV) {  
                errores.push({ linea: i + 1, motivo: 'Cédula o Nombre vacíos' });  
                continue;  
            }  
    
            const isDuplicateDB = funcionariosPadron.some(f => String(f.cedula || '').replace(/\D/g, '') === cedulaCSV.replace(/\D/g, '') && f.dependencia === dependenciaActual);  
            const isDuplicateBatch = validos.some(f => String(f.cedula || '').replace(/\D/g, '') === cedulaCSV.replace(/\D/g, ''));  
            const huerfanoExistente = funcionariosPadron.find(f => f.cedula === 'S/C' && normalizeStr(f.nombre) === normalizeStr(nombreCSV) && f.dependencia === dependenciaActual);  
    
            const nuevoFunc = {   
                id: huerfanoExistente ? huerfanoExistente.id : generateId(),   
                cedula: cedulaCSV,   
                nombre: nombreCSV,   
                cargo: cargoCSV,   
                dependencia: dependenciaActual,  
                esActualizacion: !!huerfanoExistente   
            };  
    
            if (isDuplicateDB || isDuplicateBatch) {  
                duplicados.push(nuevoFunc);  
            } else {  
                validos.push(nuevoFunc);  
            }  
          }  
    
          setIsProcessing({ active: false, text: '' });  
          setPendingFuncionariosToImport(validos);  
          setCsvPreviewData({ validos, duplicados, errores, tipo: 'funcionarios' });  
          setIsCSVPreviewOpen(true);  
        };   
          
        // CAMBIAR A READASARRAYBUFFER PARA PERMITIR EL DECODER UTF-8  
        reader.readAsArrayBuffer(file);   
        // Resetea el input para permitir reimportar el mismo archivo.  
        if (fileInputFuncionariosRef.current) fileInputFuncionariosRef.current.value = null;  
      }, 100);  
    };  
  
    const handleSaveManualFuncionario = async (e) => {  
        e.preventDefault();  
        const f = new FormData(e.target);  
        const nuevoFunc = {  
            id: generateId(),  
            cedula: f.get('cedula').replace(/\./g, '').trim(),  
            nombre: f.get('nombre').trim(),  
            cargo: f.get('cargo').trim(),  
            ubicacion: String(f.get('ubicacion') || '').trim(),  
            dependencia: dependenciaActual  
        };  
    
        if (!nuevoFunc.cedula || !nuevoFunc.nombre) return notify("Cédula y Nombre son obligatorios.", "warning");  
    
        try {  
            const { error } = await supabase.from('funcionarios').insert([nuevoFunc]);  
            if (error) throw error;  
            setFuncionariosPadron(prev => [...prev, nuevoFunc]);  
            notify("Funcionario registrado exitosamente", "success");  
            setIsNewFuncionarioModalOpen(false);  
        } catch (err) {  
            notify("Error al registrar el funcionario en la base de datos.", "error");  
        }  
    };  
  
    const confirmCSVImportFuncionarios = async () => {  
      if (pendingFuncionariosToImport.length === 0) return;  
      setIsProcessing({ active: true, text: 'Sincronizando funcionarios...' });  
        
      try {  
          const porActualizar = pendingFuncionariosToImport.filter(f => f.esActualizacion);  
          const porInsertar = pendingFuncionariosToImport.filter(f => !f.esActualizacion);  
    
          if (porInsertar.length > 0) {  
              // Limpiamos el objeto para quitar 'esActualizacion' antes de insertar  
              const payloadInsert = porInsertar.map(({ esActualizacion, ...rest }) => rest);  
              const { error: errIns } = await supabase.from('funcionarios').insert(payloadInsert);  
              if (errIns) throw errIns;  
          }  
    
          for (const act of porActualizar) {  
              const { error: errUpd } = await supabase.from('funcionarios')  
                  .update({ cedula: act.cedula, cargo: act.cargo, nombre: act.nombre })  
                  .eq('id', act.id);  
              if (errUpd) throw errUpd;  
          }  
            
          // Actualización local dirigida (mismo efecto que la recarga, sin transferencia extra)  
          setFuncionariosPadron(prev => {  
              let lista = [...prev];  
              porActualizar.forEach(act => {  
                  lista = lista.map(f => f.id === act.id ? { ...f, cedula: act.cedula, cargo: act.cargo, nombre: act.nombre } : f);  
              });  
              const nuevos = porInsertar.map(({ esActualizacion, ...rest }) => rest);  
              return [...nuevos, ...lista];  
          });  
          notify(`¡Éxito! Procesados ${pendingFuncionariosToImport.length} registros (${porActualizar.length} actualizados).`, "success");  
      } catch (error) {  
          console.error(error);  
          notify("Error al sincronizar con la base de datos.", "error");  
      } finally {  
          setIsProcessing({ active: false, text: '' });  
          setIsCSVPreviewOpen(false);  
          setPendingFuncionariosToImport([]);  
      }  
    };  
  
    const handleDeleteFuncionario = (id) => {  
      const f = funcionariosPadron.find(x => x.id === id);  
      if (isAdmin) {  
        setItemToDelete({ type: 'funcionario', id, item: f });  
      } else {  
        setItemToDelete({ type: 'requestBajaFuncionario', id, item: f });  
      }  
    };  
  
  const handleEditFuncionario = (funcionario) => {  
      setFuncionarioToEdit(funcionario);  
      setIsFuncionarioModalOpen(true);  
    };  
  
    const saveFuncionarioEdit = async (e) => {  
      e.preventDefault();  
      const formData = new FormData(e.target);  
      const nuevoNombre = formData.get('nombre').trim();  
      const nuevoCargo = formData.get('cargo').trim();  
      const nuevaUbicacion = String(formData.get('ubicacion') || '').trim();  
    
      try {  
          const { error } = await supabase  
            .from('funcionarios')  
            .update({ nombre: nuevoNombre, cargo: nuevoCargo, ubicacion: nuevaUbicacion })  
            .eq('id', funcionarioToEdit.id);  
    
          if (error) throw error;  
          setFuncionariosPadron(prev => prev.map(f => f.id === funcionarioToEdit.id ? { ...f, nombre: nuevoNombre, cargo: nuevoCargo, ubicacion: nuevaUbicacion } : f));  
          notify("Funcionario actualizado exitosamente", "success");  
          setIsFuncionarioModalOpen(false);  
      } catch (err) {  
          notify("Error al actualizar el funcionario", "error");  
      }  
    };  
  
    const renderPaginationFuncionarios = () => (
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-4 border-t border-zinc-200 dark:border-darkbg-border shrink-0 bg-white dark:bg-darkbg-card">
        <span className="text-sm text-zinc-500 font-medium">
          Mostrando <span className="font-bold text-zinc-900 dark:text-white">
            {(currentPaginaFuncionarios - 1) * ITEMS_POR_PAGINA_FUNCS + (funcionariosPurosDependencia.length > 0 ? 1 : 0)} - {Math.min(currentPaginaFuncionarios * ITEMS_POR_PAGINA_FUNCS, funcionariosPurosDependencia.length)}
          </span> de {funcionariosPurosDependencia.length}
        </span>
        <div className="flex gap-2">
          <button 
            disabled={currentPaginaFuncionarios <= 1} 
            onClick={() => setCurrentPaginaFuncionarios(prev => prev - 1)} 
            className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            Anterior
          </button>
          <button 
            disabled={currentPaginaFuncionarios >= totalPagesFuncs || totalPagesFuncs === 0} 
            onClick={() => setCurrentPaginaFuncionarios(prev => prev + 1)} 
            className="rounded-xl bg-white dark:bg-darkbg-main px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs border border-zinc-200 dark:border-darkbg-border hover:bg-zinc-50 dark:hover:bg-darkbg-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    );

  return {
    currentPaginaFuncionarios, setCurrentPaginaFuncionarios,
    isFuncionarioModalOpen, setIsFuncionarioModalOpen,
    funcionarioToEdit, setFuncionarioToEdit,
    isNewFuncionarioModalOpen, setIsNewFuncionarioModalOpen,
    isCSVPreviewOpen, setIsCSVPreviewOpen,
    csvPreviewData, setCsvPreviewData,
    pendingFuncionariosToImport, setPendingFuncionariosToImport,
    searchFuncionarioInput, setSearchFuncionarioInput,
    funcionariosPurosDependencia, totalPagesFuncs, funcionariosPaginados,
    funcionariosConDatos,
    sincronizarBienesConPadron, handleFileUploadFuncionarios,
    executeProcessFuncionariosCSV, handleSaveManualFuncionario,
    confirmCSVImportFuncionarios, handleDeleteFuncionario,
    handleEditFuncionario, saveFuncionarioEdit,
    renderPaginationFuncionarios
  };
}
