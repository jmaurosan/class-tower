
import { useCallback, useEffect, useState } from 'react';
import { offlineService } from '../services/offlineService';
import { vencimentosService } from '../services/vencimentosService';
import { DocumentoVencimento } from '../types';

export const useVencimentos = () => {
  const [documentos, setDocumentos] = useState<DocumentoVencimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vencimentosService.getAll();
      setDocumentos(data);
    } catch (error) {
      console.error('Error fetching vencimentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();

    const subscription = vencimentosService.subscribe(() => {
      fetchDocs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDocs]);

  const addVencimento = async (doc: Omit<DocumentoVencimento, 'id'>) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vencimentos', 'create', doc);
      return { id: 'pending-' + Date.now() } as any;
    }
    return await vencimentosService.create(doc);
  };

  const updateVencimentoStatus = async (id: string, status: 'Feito' | 'Em Andamento', visto?: boolean) => {
    if (!navigator.onLine) {
      offlineService.enqueue('vencimentos', 'updateStatus', { id, status, visto });
      return;
    }
    await vencimentosService.updateStatus(id, status, visto);
  };

  const deleteVencimento = async (id: string) => {
    if (!navigator.onLine) {
      // Simple sync usually doesn't need to support delete offline for this MVP, but why not
      offlineService.enqueue('vencimentos', 'delete', { id });
      return;
    }
    await vencimentosService.delete(id);
  };

  return { documentos, loading, addVencimento, updateVencimentoStatus, deleteVencimento, refresh: fetchDocs };
};
