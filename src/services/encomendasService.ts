
import { Encomenda } from '../types';
import { supabase } from './supabase';

export const encomendasService = {
  async getAll(includeHistory: boolean = false, salaFilter?: string) {
    let query = supabase
      .from('encomendas')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtro por unidade aplicado no servidor. Antes ele era feito em
    // JavaScript depois de baixar a tabela inteira, então qualquer morador
    // via as encomendas do prédio todo pela aba Network.
    // A garantia real é a policy RLS `encomendas_select`; este filtro apenas
    // evita trazer linhas que já seriam descartadas.
    if (salaFilter) {
      query = query.eq('sala_id', salaFilter);
    }

    if (!includeHistory) {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      query = query.gte('created_at', sixtyDaysAgo.toISOString());
    }

    const { data, error } = await query;

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

    // A notificação de chegada NÃO é disparada daqui.
    //
    // Antes havia um functions.invoke() fire-and-forget neste ponto: se
    // falhasse, o erro ia para um console que ninguém lê, e se o porteiro
    // fechasse a aba antes da requisição sair, o morador nunca era avisado.
    //
    // Agora um trigger em `encomendas` enfileira o aviso na mesma transação
    // do INSERT, e a Edge Function `processar-notificacoes` entrega com
    // retentativa. Se a encomenda foi gravada, a notificação existe.
    // Ver supabase/migrations/20260901100000_fila_notificacoes.sql

    return data;
  },

  async update(id: string, updates: Partial<Encomenda>, userId?: string, userName?: string) {
    const dbUpdates: any = {};
    if (updates.destinatario) dbUpdates.destinatario = updates.destinatario;
    if (updates.remetente) dbUpdates.remetente = updates.remetente;
    if (updates.categoria) dbUpdates.categoria = updates.categoria;
    if (updates.caracteristicas) dbUpdates.caracteristicas = updates.caracteristicas;
    if (updates.fotoUrl) dbUpdates.foto_url = updates.fotoUrl;
    if (updates.sala_id) dbUpdates.sala_id = updates.sala_id;
    if (updates.status) dbUpdates.status = updates.status;

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
  },

  async delete(id: string, reason: string, userId?: string, userName?: string) {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('encomendas')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('encomendas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the action
    if (userId) {
      await supabase.from('audit_logs').insert([{
        table_name: 'encomendas',
        record_id: id,
        action: 'DELETE',
        executed_by: userId,
        executed_by_name: userName,
        old_data: oldData,
        new_data: { motivo_exclusao: reason }
      }]);
    }
  }
};
