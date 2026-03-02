
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

  const addVistoria = async (vistoria: Omit<Vistoria, 'id' | 'data' | 'hora'>, userId?: string, userName?: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vistorias', 'create', vistoria);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await vistoriasService.create(vistoria, userId, userName);
  };

  const updateVistoriaStatus = async (id: string, status: string, userId?: string, userName?: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vistorias', 'updateStatus', { id, status });
      return;
    }
    await vistoriasService.updateStatus(id, status, userId, userName);
  };

  const updateVistoria = async (id: string, updates: Partial<Vistoria>, userId?: string, userName?: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vistorias', 'update', { id, ...updates });
      return;
    }
    await vistoriasService.update(id, updates, userId, userName);
  };

  const deleteVistoria = async (id: string, reason: string, userId?: string, userName?: string) => {
    await vistoriasService.delete(id, reason, userId, userName);
  };

  return {
    vistorias,
    loading,
    addVistoria,
    updateVistoriaStatus,
    updateVistoria,
    deleteVistoria,
    refresh: fetchVistorias
  };
};
