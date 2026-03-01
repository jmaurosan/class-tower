
import { Encomenda } from '../types';
import { supabase } from './supabase';

export const encomendasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('encomendas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Adapt database field names to frontend Encomenda type if necessary
    return data.map((item: any) => ({
      ...item,
      dataEntrada: new Date(item.created_at).toLocaleString('pt-BR'),
      fotoUrl: item.foto_url,
      dataRetirada: item.data_retirada ? new Date(item.data_retirada).toLocaleString('pt-BR') : undefined,
      quemRetirou: item.quem_retirou,
      sala_id: item.sala_id
    })) as Encomenda[];
  },

  async create(encomenda: Omit<Encomenda, 'id'>, userId?: string, userName?: string) {
    const dbItem = {
      destinatario: encomenda.destinatario,
      remetente: encomenda.remetente,
      categoria: encomenda.categoria,
      caracteristicas: encomenda.caracteristicas,
      foto_url: encomenda.fotoUrl,
      status: encomenda.status,
      sala_id: encomenda.sala_id
    };

    const { data, error } = await supabase
      .from('encomendas')
      .insert([dbItem])
      .select()
      .single();

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'encomendas',
        record_id: data.id,
        action: 'INSERT',
        executed_by: userId,
        executed_by_name: userName,
        new_data: data
      }]);
    }

    return data;
  },

  async updateStatus(id: string, updates: Partial<Encomenda>, userId?: string, userName?: string) {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.quemRetirou) dbUpdates.quem_retirou = updates.quemRetirou;
    if (updates.dataRetirada) dbUpdates.data_retirada = updates.dataRetirada;
    if (updates.justificativaCancelamento) dbUpdates.justificativa_cancelamento = updates.justificativaCancelamento;

    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('encomendas')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('encomendas')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'encomendas',
        record_id: id,
        action: 'UPDATE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: dbUpdates
      }]);
    }
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:encomendas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encomendas' }, callback)
      .subscribe();
  }
};
