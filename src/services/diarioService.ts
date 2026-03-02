
import { supabase } from './supabase';

export const diarioService = {
  async getAll() {
    const { data, error } = await supabase
      .from('diario')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      data: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      titulo: item.titulo,
      descricao: item.descricao,
      categoria: item.categoria,
      usuario: item.usuario,
      sala_id: item.sala_id,
      status: item.status || 'Pendente',
      solucao: item.solucao || '',
      created_at: item.created_at
    }));
  },

  async create(entry: any, userId?: string, userName?: string) {
    const { data, error } = await supabase
      .from('diario')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'diario',
        record_id: data.id,
        action: 'INSERT',
        executed_by: userId,
        executed_by_name: userName,
        new_data: data
      }]);
    }

    return data;
  },

  async update(id: string, updates: any, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('diario')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('diario')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'diario',
        record_id: id,
        action: 'UPDATE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: data
      }]);
    }

    return data;
  },

  async delete(id: string, reason: string, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('diario')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('diario')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'diario',
        record_id: id,
        action: 'DELETE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: { motivo_exclusao: reason }
      }]);
    }
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:diario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diario' }, callback)
      .subscribe();
  }
};
