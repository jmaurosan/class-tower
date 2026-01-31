
import { useCallback, useEffect, useState } from 'react';
import { documentsService } from '../services/documentsService';
import { DocumentoAnexo } from '../types';

export const useDocuments = (categoryFilter?: string) => {
  const [documentos, setDocumentos] = useState<DocumentoAnexo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentsService.getAll();
      if (categoryFilter && categoryFilter !== 'Todos') {
        setDocumentos(data.filter(d => d.categoria === categoryFilter));
      } else {
        setDocumentos(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchDocs();

    const subscription = documentsService.subscribe(() => {
      fetchDocs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDocs]);

  const uploadDoc = async (file: File, docInfo: { nome: string, categoria: string }) => {
    return await documentsService.upload(file, docInfo);
  };

  const deleteDoc = async (doc: DocumentoAnexo) => {
    await documentsService.delete(doc);
  };

  return { documentos, loading, uploadDoc, deleteDoc, refresh: fetchDocs };
};
