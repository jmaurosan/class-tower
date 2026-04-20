
import { Agendamento } from '../types';
import { supabase } from './supabase';

export const agendamentosService = {
  async getAll(includeHistory: boolean = false) {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true });

    if (!includeHistory) {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      query = query.gte('data', sixtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Agendamento[];
  },

  async create(agendamento: Omit<Agendamento, 'id'>, userId?: string, userName?: string) {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([agendamento])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'agendamentos',
        record_id: data.id,
        action: 'INSERT',
        executed_by: userId,
        executed_by_name: userName,
        new_data: data
      }]);
    }

    return data;
  },

  async update(id: string, updates: Partial<Agendamento>, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('agendamentos')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'agendamentos',
        record_id: id,
        action: 'UPDATE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: updates
      }]);
    }
  },

  async updateStatus(id: string, status: Agendamento['status'], userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('agendamentos')
      .select('status')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'agendamentos',
        record_id: id,
        action: 'UPDATE_STATUS',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: { status }
      }]);
    }
  },

  async delete(id: string, reason: string, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData, error: fetchError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is fine for delete
      console.warn('Erro ao buscar dados antigos para auditoria:', fetchError);
    }

    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro na exclusão do banco:', error);
      throw new Error(`Erro ao excluir: ${error.message}`);
    }

    if (userId) {
      try {
        await supabase.from('audit_logs').insert([{
          table_name: 'agendamentos',
          record_id: id,
          action: 'DELETE',
          executed_by: userId,
          executed_by_name: userName,
          old_data: oldData,
          new_data: { motivo_exclusao: reason }
        }]);
      } catch (auditError) {
        console.warn('Falha ao registrar log de auditoria, mas a exclusão foi feita:', auditError);
      }
    }
  },

  async getCalendarRules() {
    const { data, error } = await supabase
      .from('condo_calendar_rules')
      .select('*');
    if (error) throw error;
    return data;
  },

  async deleteCalendarRule(id: string) {
    const { error } = await supabase
      .from('condo_calendar_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:agendamentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, callback)
      .subscribe();
  }
};
