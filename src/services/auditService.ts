
import { AuditLog } from '../types';
import { supabase } from './supabase';

export const auditService = {
  async getAll() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data as AuditLog[];
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:audit_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, callback)
      .subscribe();
  }
};
