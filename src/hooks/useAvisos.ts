
import { useCallback, useEffect, useState } from 'react';
import { avisosService } from '../services/avisosService';
import { offlineService } from '../services/offlineService';
import { Aviso } from '../types';

export const useAvisos = () => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvisos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await avisosService.getAll();
      setAvisos(data);
    } catch (error) {
      console.error('Error fetching avisos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvisos();

    const subscription = avisosService.subscribe(() => {
      fetchAvisos();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAvisos]);

  const addAviso = async (aviso: Omit<Aviso, 'id'>) => {
    if (!navigator.onLine) {
      offlineService.enqueue('avisos', 'create', aviso);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await avisosService.create(aviso);
  };

  const deleteAviso = async (id: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('avisos', 'delete', { id });
      return;
    }
    await avisosService.delete(id);
  };

  return { avisos, loading, addAviso, deleteAviso, refresh: fetchAvisos };
};
