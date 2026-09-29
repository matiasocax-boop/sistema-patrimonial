import { useState, useCallback } from 'react';
import localforage from 'localforage';
import { supabase } from '../supabaseClient';
import { normalizeStr } from '../utils/helpers';

export function useBienes(dependenciaActual) {
  const [bienes, setBienes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const fetchBienes = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);

      let todosLosBienes = [];
      let rangeSize = 1000;
      let from = 0;
      let to = rangeSize - 1;
      let keepFetching = true;

      while (keepFetching) {
        const { data: batch, error } = await supabase
          .from('bens')
          .select('id, data, updated_at')
          .eq('data->>dependencia', dependenciaActual)
          .range(from, to);

        if (error || !batch || batch.length === 0) {
          keepFetching = false;
        } else {
          todosLosBienes = [...todosLosBienes, ...batch];
          if (batch.length < rangeSize) keepFetching = false;
          else {
            from += rangeSize;
            to += rangeSize;
          }
        }
      }

      const inventario = todosLosBienes.map(item => ({
        id: item.id,
        updated_at: item.updated_at,
        ...(typeof item.data === 'string' ? JSON.parse(item.data) : item.data)
      }));

      await localforage.setItem(`bienes_cache_${dependenciaActual}`, inventario);
      setBienes(inventario);
      setDbError(false);

    } catch (error) {
      console.error("Error al cargar bienes:", error);
      if (!isSilent) setDbError(true);
      const cached = await localforage.getItem(`bienes_cache_${dependenciaActual}`);
      if (cached) setBienes(cached);
    } finally {
      setIsLoading(false);
    }
  }, [dependenciaActual]);

  const toggleQRLocal = async (bien) => {
    const updated = { ...bien, hasQR: !bien.hasQR };
    setBienes(prev => prev.map(b => b.id === bien.id ? updated : b));
    
    try {
      await supabase.from('bens').update({ data: updated }).eq('id', bien.id);
      const cache = await localforage.getItem(`bienes_cache_${dependenciaActual}`) || [];
      await localforage.setItem(`bienes_cache_${dependenciaActual}`, cache.map(b => b.id === bien.id ? updated : b));
    } catch (err) {
      setBienes(prev => prev.map(b => b.id === bien.id ? bien : b));
      throw err;
    }
  };

  return { bienes, setBienes, isLoading, dbError, fetchBienes, toggleQRLocal };
}