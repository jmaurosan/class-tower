
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Agendamento, User } from '../types';

interface AgendamentosProps {
  user: User;
}

const Agendamentos: React.FC<AgendamentosProps> = ({ user }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    hora: '',
    local: '',
    tipo: 'Mudança' as Agendamento['tipo']
  });

  const fetchAgendamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;
      if (data) setAgendamentos(data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();

    const channel = supabase
      .channel('agendamentos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        fetchAgendamentos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusStyle = (status: Agendamento['status']) => {
    switch (status) {
      case 'Confirmado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Pendente': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Cancelado': return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const getIcon = (tipo: Agendamento['tipo']) => {
    switch (tipo) {
      case 'Mudança': return 'local_shipping';
      case 'Manutenção': return 'build';
      case 'Reserva': return 'celebration';
      case 'Reunião': return 'groups';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert([{
          ...formData,
          status: 'Pendente',
          sala_id: user.sala_numero || '0000'
        }]);

      if (error) throw error;
      setShowForm(false);
      setFormData({ titulo: '', data: '', hora: '', local: '', tipo: 'Mudança' });
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este agendamento?')) return;
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir agendamento.');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Calendário de Eventos</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão de espaços e serviços agendados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'calendar_add_on'}</span>
          {showForm ? 'Cancelar' : 'Agendar Novo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Lado Esquerdo: Filtros e Formulário */}
        <div className="lg:col-span-1 space-y-6">
          {showForm ? (
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-left duration-300">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Novo Evento</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required type="text" placeholder="O que será agendado?" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
                </div>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}>
                  <option>Mudança</option>
                  <option>Manutenção</option>
                  <option>Reserva</option>
                  <option>Reunião</option>
                </select>
                <input required type="text" placeholder="Local/Ambiente" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
                <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Confirmar Agendamento</button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Resumo da Semana</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total</span>
                  <span className="text-lg font-black text-primary">{agendamentos.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Ativos</span>
                  <span className="text-lg font-black text-amber-500">{agendamentos.filter(a => a.status !== 'Cancelado').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Timeline de Agendamentos */}
        <div className="lg:col-span-3 space-y-4">
          {agendamentos.map((item) => (
            <div key={item.id} className="group flex items-center gap-6 bg-white dark:bg-[#1d222a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative">
              <div className="flex flex-col items-center justify-center min-w-[80px] py-2 border-r border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{new Date(item.data + 'T00:00:00').getDate()}</span>
                <span className="text-[10px] font-bold text-primary uppercase">{item.hora}</span>
              </div>

              <div className="size-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">{getIcon(item.tipo)}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusStyle(item.status)} uppercase tracking-tighter`}>{item.status}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {item.tipo}</span>
                  {item.sala_id && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">• Unid {item.sala_id}</span>}
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{item.titulo}</h4>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {item.local}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                {(user.role === 'admin' || item.sala_id === user.sala_numero) && (
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {agendamentos.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-[#1d222a] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">calendar_month</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum agendamento futuro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agendamentos;
