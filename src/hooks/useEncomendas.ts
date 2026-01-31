
import { useCallback, useEffect, useState } from 'react';
import { encomendasService } from '../services/encomendasService';
import { offlineService } from '../services/offlineService';
import { Encomenda } from '../types';

export const useEncomendas = (salaFilter?: string) => {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncomendas = useCallback(async () => {
    try {
      let data = await encomendasService.getAll();
      if (salaFilter) {
        data = data.filter(e => e.sala_id === salaFilter);
      }
      setEncomendas(data);
    } catch (error) {
      console.error('Error fetching encomendas:', error);
    } finally {
      setLoading(false);
    }
  }, [salaFilter]);

  useEffect(() => {
    fetchEncomendas();

    const subscription = encomendasService.subscribe(() => {
      fetchEncomendas();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEncomendas]);

  const addEncomenda = async (encomenda: Omit<Encomenda, 'id'>) => {
    if (!navigator.onLine) {
      offlineService.enqueue('encomendas', 'create', encomenda);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await encomendasService.create(encomenda);
  };

  const updateStatus = async (id: string, updates: Partial<Encomenda>) => {
    if (!navigator.onLine) {
      offlineService.enqueue('encomendas', 'updateStatus', { id, ...updates });
      return;
    }
    await encomendasService.updateStatus(id, updates);
  };

  return { encomendas, loading, addEncomenda, updateStatus, refresh: fetchEncomendas };
};
