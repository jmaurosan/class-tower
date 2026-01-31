
import { DocumentoVencimento } from '../types';
import { supabase } from './supabase';

export const vencimentosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('vencimentos')
      .select('*')
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    return data.map(v => ({
      id: v.id,
      titulo: v.titulo,
      dataVencimento: v.data_vencimento,
      status: v.status as any,
      visto: v.visto
    })) as DocumentoVencimento[];
  },

  async create(doc: Omit<DocumentoVencimento, 'id'>) {
    const { data, error } = await supabase
      .from('vencimentos')
      .insert([{
        titulo: doc.titulo,
        data_vencimento: doc.dataVencimento,
        status: doc.status,
        visto: doc.visto
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string, visto?: boolean) {
    const updateData: any = { status };
    if (visto !== undefined) updateData.visto = visto;

    const { error } = await supabase
      .from('vencimentos')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('vencimentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:vencimentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vencimentos' }, callback)
      .subscribe();
  }
};
