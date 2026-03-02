
import { Vistoria } from '../types';
import { supabase } from './supabase';

export const vistoriasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('vistorias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(v => ({
      id: v.id,
      data: new Date(v.data_vistoria).toLocaleDateString('pt-BR'),
      hora: new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      unidade: v.unidade,
      local: v.local,
      urgencia: v.urgencia as any,
      status: v.status as any,
      tecnico: v.tecnico,
      descricao: v.descricao,
      fotoUrl: v.foto_url
    })) as Vistoria[];
  },

  async create(vistoria: Omit<Vistoria, 'id' | 'data' | 'hora'>, userId?: string, userName?: string) {
    const { data, error } = await supabase
      .from('vistorias')
      .insert([{
        unidade: vistoria.unidade,
        local: vistoria.local,
        urgencia: vistoria.urgencia,
        status: vistoria.status,
        tecnico: vistoria.tecnico,
        descricao: vistoria.descricao,
        foto_url: vistoria.fotoUrl
      }])
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'vistorias',
        record_id: data.id,
        action: 'INSERT',
        executed_by: userId,
        executed_by_name: userName,
        new_data: data
      }]);
    }

    return data;
  },

  async update(id: string, updates: Partial<Vistoria>, userId?: string, userName?: string) {
    const dbUpdates: any = {};
    if (updates.unidade) dbUpdates.unidade = updates.unidade;
    if (updates.local) dbUpdates.local = updates.local;
    if (updates.urgencia) dbUpdates.urgencia = updates.urgencia;
    if (updates.tecnico) dbUpdates.tecnico = updates.tecnico;
    if (updates.descricao) dbUpdates.descricao = updates.descricao;
    if (updates.status) dbUpdates.status = updates.status;

    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('vistorias')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('vistorias')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'vistorias',
        record_id: id,
        action: 'UPDATE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: dbUpdates
      }]);
    }
  },

  async updateStatus(id: string, status: string, userId?: string, userName?: string) {
    // Get old data
    const { data: oldData } = await supabase
      .from('vistorias')
      .select('status')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('vistorias')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'vistorias',
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
    const { data: oldData } = await supabase
      .from('vistorias')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('vistorias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'vistorias',
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
      .channel('public:vistorias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vistorias' }, callback)
      .subscribe();
  }
};
