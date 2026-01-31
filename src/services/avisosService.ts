
import { Aviso } from '../types';
import { supabase } from './supabase';

export const avisosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(aviso: Omit<Aviso, 'id'>) {
    const { data, error } = await supabase
      .from('avisos')
      .insert([aviso])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('avisos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('public:avisos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, callback)
      .subscribe();
  }
};
