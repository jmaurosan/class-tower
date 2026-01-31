
import { useCallback, useEffect, useState } from 'react';
import { offlineService } from '../services/offlineService';
import { vistoriasService } from '../services/vistoriasService';
import { Vistoria } from '../types';

export const useVistorias = () => {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVistorias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vistoriasService.getAll();
      setVistorias(data);
    } catch (error) {
      console.error('Error fetching vistorias:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVistorias();

    const subscription = vistoriasService.subscribe(() => {
      fetchVistorias();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchVistorias]);

  const addVistoria = async (vistoria: Omit<Vistoria, 'id' | 'data' | 'hora'>) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vistorias', 'create', vistoria);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await vistoriasService.create(vistoria);
  };

  const updateVistoriaStatus = async (id: string, status: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vistorias', 'updateStatus', { id, status });
      return;
    }
    await vistoriasService.updateStatus(id, status);
  };

  return { vistorias, loading, addVistoria, updateVistoriaStatus, refresh: fetchVistorias };
};
