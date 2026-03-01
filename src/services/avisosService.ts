
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

  async create(aviso: Omit<Aviso, 'id'>) {
    const { data, error } = await supabase
      .from('avisos')
      .insert([aviso])
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      throw new Error(error.message);
    }
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
