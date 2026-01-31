
import { useCallback, useEffect, useState } from 'react';
import { auditService } from '../services/auditService';
import { AuditLog } from '../types';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await auditService.getAll();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    const subscription = auditService.subscribe(() => {
      fetchLogs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
};
