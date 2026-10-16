import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import localforage from 'localforage';
import { debeResyncTotal, fusionarBienes, ahoraISO } from '../services/syncBienes';
import { processOfflineQueue, getOfflineQueueLength } from '../services/offlineSyncService';

// Sincronización de datos: fetch inicial (total + delta), realtime,
// notificaciones y modo offline (extraído de App.jsx, Fase 6).
//
// Parámetros:
// - notify: addToast estable.
// - currentUser, dependenciaActual, isAuthenticated, isAdmin: contexto.
// - handleLogout: de useAuthSession (valida la sesión en cada fetch).
// - setBienes, setFc10List, setFc11List, setFc04List, setEstructurasDB,
//   setUsuariosList, setFuncionariosPadron, setDbError, setIsLoading,
//   setFichaBien: setters que viven en App.
export function useRealtimeSync({
  notify, currentUser, dependenciaActual, isAuthenticated, isAdmin,
  handleLogout, setBienes, setFc10List, setFc11List, setFc04List,
  setEstructurasDB, setUsuariosList, setFuncionariosPadron,
  setDbError, setIsLoading, setFichaBien
}) {
  const [notificaciones, setNotificaciones] = useState([]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Higiene de notificaciones: retención de 2 días. Solo se borra lo ya
  // visto (leídas) y las solicitudes resueltas; lo no leído y lo pendiente
  // nunca se toca.
  const RETENCION_NOTIF_MS = 2 * 24 * 60 * 60 * 1000;
  const esAnuncioGlobal = (n) => !!n && n.accion === 'anuncio' && n.usuarioDestino === 'TODOS';

  // Fetch acotado: solo mías + broadcast + solicitudes pendientes, con
  // límite. Antes era `select('*')` de toda la tabla para todos.
  const queryNotificacionesAcotadas = () => {
    const u = String(currentUser?.username || '').replace(/[,()]/g, '');
    const filtros = u
      ? `data->>usuarioDestino.eq.${u},data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`
      : `data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`;
    return supabase.from('notificaciones').select('id, data, updated_at').or(filtros).order('updated_at', { ascending: false }).limit(500);
  };

  // Purga local (throttle 2 días por usuario): borra leídas viejas,
  // anuncios globales totalmente leídos y solicitudes resueltas viejas.
  const purgarNotificacionesViejas = async (filas) => {
    try {
      const user = currentUser?.username || 'anon';
      const key = `notif_purge_ts_${user}`;
      const last = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (Date.now() - last < RETENCION_NOTIF_MS) return;
      localStorage.setItem(key, String(Date.now()));
      const corte = Date.now() - RETENCION_NOTIF_MS;
      const fechaDe = (n) => new Date(n.resueltoFecha || n.fecha || n.created_at || 0).getTime() || 0;
      const paraBorrar = (filas || []).filter(n => {
        if (fechaDe(n) >= corte) return false;
        if (n.tipo === 'BAJA_BIEN' || n.tipo === 'BAJA_FUNCIONARIO') {
          return n.estado === 'APROBADO' || n.estado === 'RECHAZADO';
        }
        if (esAnuncioGlobal(n)) {
          return (n.totalDest || 0) > 0 && (n.leidos || []).length >= (n.totalDest || 0);
        }
        return n.leido === true;
      });
      if (paraBorrar.length === 0) return;
      const ids = paraBorrar.map(n => n.id);
      for (let i = 0; i < ids.length; i += 20) {
        await Promise.all(ids.slice(i, i + 20).map(id => supabase.from('notificaciones').delete().eq('id', id)));
      }
      const set = new Set(ids);
      setNotificaciones(prev => prev.filter(n => !set.has(n.id)));
    } catch (e) {}
  };

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);

    // --- 1. VALIDACIÓN DE ROL EN SERVIDOR ---
    if (currentUser?.username) {
        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
          .select('username, cargo, dependencia')
          .eq('username', currentUser.username)
          .maybeSingle();

        if (userError || !dbUser) {
          notify("Sesión no válida o usuario inexistente.", "error");
          handleLogout();
          return;
        }

        const esAdminEnDB = dbUser.cargo === 'admin';
        if (currentUser.role === 'admin' && !esAdminEnDB) {
          notify("Se detectó una alteración no autorizada en los permisos de sesión.", "error");
          handleLogout();
          return;
        }
      }
    // --- FIN DE VALIDACIÓN DE ROL ---

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de red')), 8000)
      );

      const fetchPromise = (async () => {
        // --- BIENES: descarga total solo si hace falta, si no delta por updated_at ---
        const CACHE_BIENES = `bienes_cache_${dependenciaActual}`;
        const META_BIENES = `bienes_meta_${dependenciaActual}`;
        let metaBienes = null;
        let cacheBienes = null;
        try { metaBienes = await localforage.getItem(META_BIENES); } catch (e) {}
        try { cacheBienes = await localforage.getItem(CACHE_BIENES); } catch (e) {}
        const descargaTotal = debeResyncTotal(metaBienes) || !Array.isArray(cacheBienes);

        if (descargaTotal) {
        let todosLosNuevosBienes = [];
        let rangeSize = 1000;
        let from = 0;
        let to = rangeSize - 1;
        let keepFetchingBienes = true;

        while (keepFetchingBienes) {
          let query = supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual);

          const { data: batch, error } = await query.range(from, to);

          if (error || !batch || batch.length === 0) {
            keepFetchingBienes = false;
          } else {
            for (const item of batch) todosLosNuevosBienes.push(item);
            if (batch.length < rangeSize) {
              keepFetchingBienes = false;
            } else {
              from += rangeSize;
              to += rangeSize;
            }
          }
        }

        const { lista: inventarioFinal, maxUpdatedAt } = fusionarBienes([], todosLosNuevosBienes, dependenciaActual);
        if (inventarioFinal.length > 0) {
          await localforage.setItem(CACHE_BIENES, inventarioFinal);
          // Si ninguna fila trae sello (datos legacy), el punto de sync es "ahora":
          // desde aquí, toda edición ya sale sellada y entra en el delta.
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || ahoraISO(), actualizadoEn: Date.now() });
          setBienes(inventarioFinal);
        } else {
          setBienes([]);
        }
        } else {
          // Delta: solo filas tocadas desde la última sincronización (KB, no MB).
          const { data: cambios, error: errorDelta } = await supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual)
            .gt('updated_at', metaBienes.updated_at);
          if (errorDelta) throw errorDelta;
          const { lista, maxUpdatedAt } = fusionarBienes(cacheBienes, cambios || [], dependenciaActual);
          await localforage.setItem(CACHE_BIENES, lista);
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || metaBienes.updated_at, actualizadoEn: Date.now() });
          setBienes(lista);
        }

        const [resFc10, resFc11, resFc04, resEstructuras, resAuditoria, resUsuarios, resFuncionarios] = await Promise.all([ 
            supabase.from('fc10').select('id, data').eq('data->>dependencia', dependenciaActual),
            supabase.from('fc11').select('id, data'), 
            supabase.from('fc04').select('id, data').eq('data->>dependencia', dependenciaActual),
            supabase.from('estructuras').select('id, data'), 
            queryNotificacionesAcotadas(),
            supabase.from('usuarios').select('username, nombre, cargo, dependencia'),
            supabase.from('funcionarios').select('*')
        ]);

        const parseDirect = (resData) => {
            if (!resData) return [];
            return resData.map(item => {
                if (item.data) {
                    let parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                    return { id: item.id, ...parsed };
                }
                return item;
            });
        };

        setFc10List(parseDirect(resFc10.data)); 
        setFc11List(parseDirect(resFc11.data));
        setFc04List(parseDirect(resFc04.data)); 
        setEstructurasDB(parseDirect(resEstructuras.data));
        
        const notifData = resAuditoria.data || [];
        setNotificaciones(notifData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));
        
        setUsuariosList(resUsuarios.data || []);
        
        const funcsData = resFuncionarios.data || [];
        setFuncionariosPadron(funcsData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));
        
        setDbError(false);
      })();

      await Promise.race([fetchPromise, timeoutPromise]);

    } catch (error) { 
        console.error("Error crítico de datos:", error);
        if (!isSilent) setDbError(true);
        
        try {
            const cachedBienes = await localforage.getItem(`bienes_cache_${dependenciaActual}`);
            if (cachedBienes && cachedBienes.length > 0) {
                setBienes(cachedBienes);
            }
        } catch (e) {}
    } finally { 
        setIsLoading(false); 
    }
  }, [dependenciaActual, currentUser, handleLogout]);

  // --- MOTOR DE ARRANQUE DE DATOS ---
  useEffect(() => { 
      if (isAuthenticated) {
          fetchData(false); 
          cargarNotificaciones();
          const notifInterval = setInterval(() => { if (!document.hidden) sondearNotificaciones(); }, 30000);
          const notifChannel = supabase.channel("notif-realtime").on("postgres_changes", { event: "*", schema: "public", table: "notificaciones" }, (payload) => { fusionarNotificacion(payload); }).subscribe();
          // Tiempo real en bienes: lo que cambia en un equipo (ej: foto desde el celular)
          // se refleja solo en los demás, sin refrescar
          const bensChannel = supabase.channel("bens-realtime").on("postgres_changes", { event: "*", schema: "public", table: "bens" }, (payload) => {
              try {
                  if (payload.eventType === 'DELETE') {
                      if (payload.old?.id) {
                        setBienes(prev => prev.filter(b => b.id !== payload.old.id));
                        // La caché también debe olvidar el borrado o el próximo delta lo resucita.
                        localforage.getItem(`bienes_cache_${dependenciaActual}`).then(cache => {
                          if (Array.isArray(cache)) localforage.setItem(`bienes_cache_${dependenciaActual}`, cache.filter(b => b.id !== payload.old.id));
                        }).catch(() => {});
                      }
                      return;
                  }
                  const row = payload.new;
                  if (!row) return;
                  const d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
                  // El canal trae cambios de TODAS las dependencias: lo ajeno no se mezcla.
                  if ((d.dependencia || '') !== dependenciaActual) {
                      setBienes(prev => prev.filter(b => b.id !== row.id));
                      return;
                  }
                  const bien = { id: row.id, ...d };
                  setBienes(prev => {
                      const i = prev.findIndex(b => b.id === bien.id);
                      if (i === -1) return [...prev, bien];
                      const copia = [...prev];
                      copia[i] = bien;
                      return copia;
                  });
                  setFichaBien(prev => (prev && prev.id === bien.id ? bien : prev));
              } catch (e) {}
          }).subscribe();
          return () => {
              clearInterval(notifInterval);
              supabase.removeChannel(notifChannel);
              supabase.removeChannel(bensChannel);
          };
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);

  const markAsRead = async (notif) => {
      const user = currentUser?.username;
      if (esAnuncioGlobal(notif)) {
          const leidos = Array.isArray(notif.leidos) ? notif.leidos : [];
          if (!user || leidos.includes(user)) return;
          const { leido: _ign, ...base } = notif;
          const updated = { ...base, leidos: [...leidos, user] };
          setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
          try {
              await supabase.from('notificaciones').update({ data: updated }).eq('id', notif.id);
          } catch(e) {}
          return;
      }
      if(notif.leido) return;
      const updated = {...notif, leido: true};
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
      try { 
          await supabase.from('notificaciones').update({ data: updated }).eq('id', notif.id);
      } catch(e) {}
  };

  const markAllAsRead = async () => {
      const user = currentUser?.username;
      const pendientes = misNotificaciones.filter(n => !n.leido);
      if (pendientes.length === 0) return;
      const ids = new Set(pendientes.map(n => n.id));
      setNotificaciones(prev => prev.map(n => {
          if (!ids.has(n.id)) return n;
          if (esAnuncioGlobal(n)) {
              const leidos = Array.isArray(n.leidos) ? n.leidos : [];
              return (user && !leidos.includes(user)) ? { ...n, leidos: [...leidos, user] } : n;
          }
          return { ...n, leido: true };
      }));
      try {
          await Promise.all(pendientes.map(n => {
              const base = notificaciones.find(x => x.id === n.id) || n;
              let payload;
              if (esAnuncioGlobal(base)) {
                  const { leido: _ign, ...sinLeido } = base;
                  const leidos = Array.isArray(base.leidos) ? base.leidos : [];
                  payload = user && !leidos.includes(user) ? { ...sinLeido, leidos: [...leidos, user] } : null;
              } else {
                  payload = { ...n, leido: true };
              }
              return payload ? supabase.from('notificaciones').update({ data: payload }).eq('id', n.id) : Promise.resolve();
          }));
      } catch (e) {}
  };

  const misNotificaciones = useMemo(() => { 
    // Broadcast (TODOS) + directas. En el broadcast el leído es por
    // usuario (array `leidos`); se mapea a `leido` efectivo para la UI.
    const directas = notificaciones
      .filter(n => n.tipoRegistro === 'NOTIFICACION' && (n.usuarioDestino === currentUser?.username || n.usuarioDestino === 'TODOS'))
      .map(n => (esAnuncioGlobal(n) ? { ...n, leido: (n.leidos || []).includes(currentUser?.username) } : n));

    if (isAdmin) {
      const solicitudesComoNotif = notificaciones
        .filter(n => (n.tipo === 'BAJA_BIEN' || n.tipo === 'BAJA_FUNCIONARIO') && n.estado === 'PENDIENTE')
        .map(n => ({
          id: n.id,
          tipoRegistro: 'NOTIFICACION',
          esSolicitud: true,
          accion: 'solicitud',
          titulo: n.tipo === 'BAJA_FUNCIONARIO'
            ? `Solicitud de padrón: ${n.nombre || 'S/N'}`
            : `Solicitud de Baja: #${n.rotulo || 'S/R'}`,
          mensaje: n.tipo === 'BAJA_FUNCIONARIO'
            ? `${n.solicitante || 'Un funcionario'} solicita eliminar a "${n.nombre || ''}" del padrón. Motivo: ${n.motivo || 'No especificado'}.`
            : `${n.solicitante || 'Un funcionario'} solicita la baja de "${n.descripcion || 'Bien'}". Motivo: ${n.motivo || 'No especificado'}.`,
          fecha: n.created_at || new Date().toISOString(),
          leido: false,
          notifOrigen: n
        }));

      return [...solicitudesComoNotif, ...directas].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    return directas.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 
  }, [notificaciones, currentUser, isAdmin]);

  const unreadCount = misNotificaciones.filter(n => !n.leido).length;

  const parseNotifRow = (item) => {
      const d = item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item;
      return { id: item.id, ...d };
  };

  const cargarNotificaciones = async () => {
      const { data, error } = await queryNotificacionesAcotadas();
      if (!error && data) {
          const filas = data.map(parseNotifRow);
          setNotificaciones(filas);
          purgarNotificacionesViejas(filas);
      }
  };

  // Sondeo liviano: últimas 100 relevantes, fusionadas sin recargar todo
  const sondearNotificaciones = async () => {
      try {
          const u = String(currentUser?.username || '').replace(/[,()]/g, '');
          const filtros = u
            ? `data->>usuarioDestino.eq.${u},data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`
            : `data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`;
          const { data, error } = await supabase.from('notificaciones').select('id, data, updated_at').or(filtros).order('updated_at', { ascending: false }).limit(100);
          if (error || !data) return;
          const frescas = data.map(parseNotifRow);
          setNotificaciones(prev => {
              const mapa = new Map(prev.map(n => [n.id, n]));
              frescas.forEach(n => mapa.set(n.id, n));
              return [...mapa.values()];
          });
      } catch (e) {}
  };

  const fusionarNotificacion = (payload) => {
      try {
          if (payload.eventType === 'DELETE') {
              if (payload.old?.id) setNotificaciones(prev => prev.filter(n => n.id !== payload.old.id));
              return;
          }
          const row = payload.new;
          if (!row) return;
          const parsed = parseNotifRow(row);
          // El canal trae cambios de todos: lo ajeno no se mezcla.
          const u = currentUser?.username;
          const esMia = parsed.tipoRegistro === 'NOTIFICACION' && (parsed.usuarioDestino === u || parsed.usuarioDestino === 'TODOS');
          const esSolicitud = (parsed.tipo === 'BAJA_BIEN' || parsed.tipo === 'BAJA_FUNCIONARIO') && parsed.estado === 'PENDIENTE';
          if (!esMia && !esSolicitud) return;
          setNotificaciones(prev => {
              const i = prev.findIndex(n => n.id === parsed.id);
              if (i === -1) return [parsed, ...prev];
              const copia = [...prev];
              copia[i] = parsed;
              return copia;
          });
      } catch (e) {}
  };

  // xÓ Escuchador de estado de red (Offline / Online)
  const [colaOffline, setColaOffline] = useState(0);
  const refrescarColaOffline = async () => {
    try { setColaOffline(await getOfflineQueueLength()); } catch {}
  };
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Cuando regresa internet, vaciamos la cola guardada localmente
      processOfflineQueue((count) => {
        notify(`Se sincronizaron ${count} operaciones guardadas en modo local.`, "success");
        fetchData(true); // Recargamos los datos para reflejar los cambios reales de Supabase
        refrescarColaOffline();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      notify("Conexión perdida. Se activó el modo de almacenamiento local.", "warning");
    };

    // Escuchar eventos nativos del navegador
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intentar sincronizar por si había algo pendiente al cargar la app
    if (navigator.onLine) {
      handleOnline();
    }
    refrescarColaOffline();
    const tCola = setInterval(() => { refrescarColaOffline(); }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(tCola);
    };
  }, [fetchData]);

  useEffect(() => {
      if (isAuthenticated) {
          fetchData(false);
          cargarNotificaciones();
      }
  }, [isAuthenticated, fetchData, dependenciaActual, isAdmin]);

  return {
    isOnline, colaOffline, notificaciones, setNotificaciones,
    fetchData, cargarNotificaciones, sondearNotificaciones, fusionarNotificacion,
    markAsRead, markAllAsRead, misNotificaciones, unreadCount
  };
}
