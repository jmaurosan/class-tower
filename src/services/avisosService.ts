
import { Aviso } from '../types';
import { supabase } from './supabase';

export const avisosService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*, creator:profiles!criado_por(role)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching avisos with join:', error);
        // Fallback to simple select if join fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('avisos')
          .select('*')
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        return simpleData;
      }
      return data;
    } catch (error) {
      console.error('Fatal error in avisosService.getAll:', error);
      throw error;
    }
  },

  async create(aviso: Omit<Aviso, 'id'>, userId?: string, userName?: string) {
    const { data, error } = await supabase
      .from('avisos')
      .insert([aviso])
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      throw new Error(error.message);
    }

    if (userId) {
      try {
        await supabase.from('audit_logs').insert([{
          table_name: 'avisos',
          record_id: data.id,
          action: 'INSERT',
          executed_by: userId,
          executed_by_name: userName,
          new_data: data
        }]);
      } catch (logErr) {
        console.warn('Logging failed but data was saved:', logErr);
      }
    }

    return data;
  },

  async delete(id: string, reason: string, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('avisos')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('avisos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      try {
        await supabase.from('audit_logs').insert([{
          table_name: 'avisos',
          record_id: id,
          action: 'DELETE',
          executed_by: userId,
          executed_by_name: userName,
          old_data: oldData,
          new_data: { justificativa: reason }
        }]);
      } catch (logErr) {
        console.warn('Logging failed but data was deleted:', logErr);
      }
    }
  },

  async update(id: string, updates: Partial<Aviso>, reason?: string, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('avisos')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('avisos')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      try {
        await supabase.from('audit_logs').insert([{
          table_name: 'avisos',
          record_id: id,
          action: 'UPDATE',
          executed_by: userId,
          executed_by_name: userName,
          old_data: oldData,
          new_data: reason ? { ...updates, justificativa: reason } : updates
        }]);
      } catch (logErr) {
        console.warn('Logging failed but data was updated:', logErr);
      }
    }
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:avisos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, callback)
      .subscribe();
  }
};
