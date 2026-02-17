
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Agendamento, User } from '../types';

interface AgendamentosProps {
  user: User;
}

interface CalendarRule {
  id: string;
  date: string;
  description: string;
  is_blocked: boolean;
  allowed_start_time?: string;
  allowed_end_time?: string;
}

const Agendamentos: React.FC<AgendamentosProps> = ({ user }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [rules, setRules] = useState<CalendarRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Estado para Admin gerenciar regras
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [newRule, setNewRule] = useState({
    date: '',
    description: '',
    is_blocked: true,
    allowed_start_time: '08:00',
    allowed_end_time: '18:00'
  });

  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    hora: '',
    local: '',
    tipo: 'Mudança' as Agendamento['tipo']
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Buscar Agendamentos
      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true });

      if (agendamentosData) setAgendamentos(agendamentosData);

      // Buscar Regras de Calendário
      const { data: rulesData } = await supabase
        .from('condo_calendar_rules')
        .select('*');

      if (rulesData) setRules(rulesData);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('agendamentos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'condo_calendar_rules' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- LÓGICA DE VALIDAÇÃO ---
  const validateScheduling = (dateStr: string, timeStr: string, type: string): string | null => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = parseInt(timeStr.split(':')[0]);
    const minutes = parseInt(timeStr.split(':')[1]);
    const timeValue = hour * 60 + minutes;

    // 1. Verificar Regras Específicas (Feriados/Exceções)
    // Procurar por regra que bata exatamente com a data (YYYY-MM-DD)
    const specificRule = rules.find(r => r.date === dateStr);

    if (specificRule) {
      if (specificRule.is_blocked) {
        return `Agendamento indisponível: A data ${new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')} está BLOQUEADA (${specificRule.description}).`;
      }

      // Se tiver horário específico permitido para esta data
      if (specificRule.allowed_start_time && specificRule.allowed_end_time) {
        const start = parseInt(specificRule.allowed_start_time.split(':')[0]) * 60 + parseInt(specificRule.allowed_start_time.split(':')[1]);
        const end = parseInt(specificRule.allowed_end_time.split(':')[0]) * 60 + parseInt(specificRule.allowed_end_time.split(':')[1]);

        if (timeValue < start || timeValue > end) {
          return `Horário indisponível: Para esta data (${specificRule.description}), o horário permitido é apenas entre ${specificRule.allowed_start_time.slice(0, 5)} e ${specificRule.allowed_end_time.slice(0, 5)}.`;
        }
        return null; // Permitido pela regra especial
      }
    }

    // 2. Regras Específicas para Mudança (Mais restritivas)
    if (type === 'Mudança') {
      // Domingo (0)
      if (dayOfWeek === 0) {
        return 'Agendamento indisponível: Mudanças não são permitidas aos Domingos.';
      }

      // Sábado (6): 14:00 as 23:59
      if (dayOfWeek === 6) {
        const start = 14 * 60; // 14:00
        const end = 23 * 60 + 59; // 23:59
        if (timeValue < start || timeValue > end) {
          return 'Horário indisponível: Aos Sábados, mudanças são permitidas apenas das 14:00 às 23:59.';
        }
      }

      // Segunda a Sexta (1-5): 19:00 as 23:59
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const start = 19 * 60; // 19:00
        const end = 23 * 60 + 59; // 23:59
        if (timeValue < start || timeValue > end) {
          return 'Horário indisponível: De Segunda a Sexta, mudanças são permitidas apenas das 19:00 às 23:59.';
        }
      }
    }

    // Se passou por tudo, está liberado
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar regras
    const validationError = validateScheduling(formData.data, formData.hora, formData.tipo);
    if (validationError && user.role !== 'admin') {
      alert(validationError);
      return;
    }

    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert([{
          ...formData,
          status: 'Pendente',
          sala_id: user.sala_numero || '0000',
          user_id: user.id
        }]);

      if (error) throw error;

      // AUTO-GERAR AVISO SE FOR MUDANÇA
      if (formData.tipo === 'Mudança') {
        const agora = new Date();
        const dataFormatada = new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR');

        await supabase.from('avisos').insert([{
          titulo: `🚚 Nova Mudança Agendada - Unidade ${user.sala_numero || user.name}`,
          conteudo: `Uma mudança foi agendada para o dia ${dataFormatada} às ${formData.hora}.\nLocal: ${formData.local}\nResponsável: ${user.name}`,
          prioridade: 'Media',
          data: agora.toISOString().split('T')[0],
          hora: agora.toTimeString().split(' ')[0].substring(0, 5),
          criado_por: user.id
        }]);
      }

      setShowForm(false);
      setFormData({ titulo: '', data: '', hora: '', local: '', tipo: 'Mudança' });
      alert('Solicitação de agendamento enviada com sucesso!');
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('condo_calendar_rules')
        .insert([{
          date: newRule.date,
          description: newRule.description,
          is_blocked: newRule.is_blocked,
          allowed_start_time: newRule.is_blocked ? null : newRule.allowed_start_time,
          allowed_end_time: newRule.is_blocked ? null : newRule.allowed_end_time,
          created_by: user.id
        }]);

      if (error) throw error;
      setNewRule({ date: '', description: '', is_blocked: true, allowed_start_time: '08:00', allowed_end_time: '18:00' });
      setShowRulesModal(false);
      alert('Regra criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar regra:', err);
      alert('Erro ao salvar regra.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return;
    const { error } = await supabase.from('condo_calendar_rules').delete().eq('id', id);
    if (error) alert('Erro ao excluir regra');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este agendamento?')) return;
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir agendamento.');
    }
  };

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

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Agendamento</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão de espaços, mudanças e manutenções</p>
        </div>
        <div className="flex gap-2">
          {user.role === 'admin' && (
            <button
              onClick={() => setShowRulesModal(!showRulesModal)}
              className="flex items-center gap-2 px-5 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-700 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-xl">edit_calendar</span>
              Configurar Feriados
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'calendar_add_on'}</span>
            {showForm ? 'Cancelar' : 'Agendar Novo'}
          </button>
        </div>
      </div>

      {/* MODAL / PAINEL DE REGRAS (ADMIN) */}
      {showRulesModal && (
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 mb-8 animate-in slide-in-from-top-4">
          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">edit_calendar</span>
            Gerenciar Feriados e Exceções
          </h4>

          <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input type="date" required className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
              value={newRule.date} onChange={e => setNewRule({ ...newRule, date: e.target.value })}
            />
            <input type="text" required placeholder="Descrição (ex: Natal)" className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white"
              value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })}
            />
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 rounded-xl border border-slate-300 dark:border-slate-700">
              <input type="checkbox" id="blocked" checked={newRule.is_blocked} onChange={e => setNewRule({ ...newRule, is_blocked: e.target.checked })} className="size-5 accent-primary" />
              <label htmlFor="blocked" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Bloquear Dia Inteiro</label>
            </div>

            {!newRule.is_blocked && (
              <div className="flex gap-2">
                <input type="time" required value={newRule.allowed_start_time} onChange={e => setNewRule({ ...newRule, allowed_start_time: e.target.value })} className="w-1/2 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border dark:text-white" title="Início" />
                <input type="time" required value={newRule.allowed_end_time} onChange={e => setNewRule({ ...newRule, allowed_end_time: e.target.value })} className="w-1/2 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border dark:text-white" title="Fim" />
              </div>
            )}

            <button type="submit" className="col-span-full md:col-span-1 lg:col-span-1 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transistion-colors">
              Adicionar Regra
            </button>
          </form>

          {/* Lista de Regras Existentes */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {rules.map(rule => (
              <div key={rule.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="font-mono font-bold text-slate-500 dark:text-slate-400">
                    {new Date(rule.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="font-bold text-slate-800 dark:text-white">{rule.description}</div>
                  {rule.is_blocked ? (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">BLOQUEADO</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded">
                      {rule.allowed_start_time?.slice(0, 5)} - {rule.allowed_end_time?.slice(0, 5)}
                    </span>
                  )}
                </div>
                <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
            {rules.length === 0 && <p className="text-center text-slate-400 py-2">Nenhuma regra especial cadastrada.</p>}
          </div>

        </div>
      )}

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
                <select
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white ${user.role === 'sala' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                  disabled={user.role === 'sala'}
                >
                  <option>Mudança</option>
                  {(user.role !== 'sala') && (
                    <>
                      <option>Manutenção</option>
                      <option>Reserva</option>
                      <option>Reunião</option>
                    </>
                  )}
                </select>
                <input required type="text" placeholder="Local/Ambiente" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm">Confirmar Agendamento</button>
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

              {/* CARD DE INFORMAÇÃO SOBRE MUDANÇAS */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                <h5 className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Regras de Mudança
                </h5>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• <b>Seg-Sex:</b> 19:00 - 23:59</li>
                  <li>• <b>Sábado:</b> 14:00 - 23:59</li>
                  <li>• <b>Domingos/Feriados:</b> Bloqueado/Sob consulta</li>
                </ul>
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
