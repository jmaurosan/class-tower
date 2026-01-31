
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

  async create(vistoria: Omit<Vistoria, 'id' | 'data' | 'hora'>) {
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
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('vistorias')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('vistorias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:vistorias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vistorias' }, callback)
      .subscribe();
  }
};
