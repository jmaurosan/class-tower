
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

  const addAviso = async (aviso: Omit<Aviso, 'id'>, userId?: string, userName?: string) => {
    if (!navigator.onLine) {
      offlineService.enqueue('avisos', 'create', aviso);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await avisosService.create(aviso, userId, userName);
  };

  const deleteAviso = async (id: string, userId?: string, userName?: string) => {
    // 1. Optimistic Update: Remove from UI immediately
    const originalAvisos = [...avisos];
    setAvisos(current => current.filter(a => a.id !== id));

    try {
      if (!navigator.onLine) {
        offlineService.enqueue('avisos', 'delete', { id });
        return;
      }
      await avisosService.delete(id, userId, userName);

      // 2. Force refresh to ensure sync (optional, but good for consistency)
      // await fetchAvisos(); // Commented out to trust optimistic update for speed
    } catch (error) {
      // 3. Rollback on error
      console.error('Error deleting aviso:', error);
      setAvisos(originalAvisos);
      alert('Erro ao excluir. Verifique sua conexão.');
    }
  };
  const updateAviso = async (id: string, updates: Partial<Aviso>, userId?: string, userName?: string) => {
    const originalAvisos = [...avisos];
    setAvisos(current => current.map(a => a.id === id ? { ...a, ...updates } : a));

    try {
      if (!navigator.onLine) {
        offlineService.enqueue('avisos', 'update', { id, ...updates });
        return;
      }
      await avisosService.update(id, updates, userId, userName);
    } catch (error) {
      console.error('Error updating aviso:', error);
      setAvisos(originalAvisos);
      alert('Erro ao atualizar. Verifique sua conexão.');
    }
  };

  return { avisos, loading, addAviso, deleteAviso, updateAviso, refresh: fetchAvisos };
};
