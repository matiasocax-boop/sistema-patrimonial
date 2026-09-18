// src/services/patrimonioService.js
import { supabase } from '../supabaseClient';

export const fetchAllRows = async (tableName) => {
    let allData = [];
    let rangeSize = 1000;
    let from = 0;
    let to = rangeSize - 1;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, to);

      if (error || !data || data.length === 0) {
        keepFetching = false;
      } else {
        allData = [...allData, ...data];
        if (data.length < rangeSize) {
          keepFetching = false;
        } else {
          from += rangeSize;
          to += rangeSize;
        }
      }
    }
    return { data: allData };
};