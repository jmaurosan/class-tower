import React, { useEffect, useState } from 'react';
import CalendarRules, { CalendarRule } from '../components/CalendarRules';
import CalendarView from '../components/CalendarView';
import { agendamentosService } from '../services/agendamentosService';
import { supabase } from '../services/supabase';
import { Agendamento, User } from '../types';

interface AgendamentosProps {
  user: User;
}

const Agendamentos: React.FC<AgendamentosProps> = ({ user }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [rules, setRules] = useState<CalendarRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'calendar'>('calendar');

  const [showRulesModal, setShowRulesModal] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    hora: '',
    local: '',
    tipo: 'Mudança' as Agendamento['tipo']
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const agendamentosData = await agendamentosService.getAll();
      setAgendamentos(agendamentosData);

      const rulesData = await agendamentosService.getCalendarRules();
      setRules(rulesData);
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

    const validationError = validateScheduling(formData.data, formData.hora, formData.tipo);
    if (validationError && user.role !== 'admin') {
      alert(validationError);
      return;
    }

    try {
      await agendamentosService.create({
        ...formData,
        status: 'Pendente',
        sala_id: user.sala_numero || '0000',
        user_id: user.id
      }, user.id, user.name);

      if (formData.tipo === 'Mudança') {
        const agora = new Date();
        const dataFormatada = new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR');

        // Note: Avisos creation still using direct supabase for now as it's a side effect, 
        // but could also be moved to a service.
        const { supabase } = await import('../services/supabase');
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
      fetchData();
      alert('Solicitação de agendamento enviada com sucesso!');
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Erro ao salvar agendamento.');
    }
  };



  const handleCancel = async (id: string) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    try {
      await agendamentosService.updateStatus(id, 'Cancelado', user.id, user.name);
      fetchData();
      alert('Agendamento cancelado com sucesso!');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      alert('Erro ao cancelar agendamento.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setDeleteReason('');
    setErrorMessage(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete || !deleteReason.trim()) {
      setErrorMessage('Por favor, detalhe o motivo da exclusão.');
      return;
    }

    try {
      setIsDeleting(true);
      await agendamentosService.delete(idToDelete, deleteReason, user.id, user.name);
      setShowDeleteModal(false);
      setIdToDelete(null);
      setAgendamentos(prev => prev.filter(a => a.id !== idToDelete));
      fetchData();
      alert('Agendamento excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      setErrorMessage(err.message || 'Erro ao excluir agendamento.');
    } finally {
      setIsDeleting(false);
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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
          {showForm ? 'Cancelar' : 'Novo Evento'}
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle de Visualização */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex-1">
            <button onClick={() => setViewType('calendar')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'calendar' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-lg">calendar_month</span> Calendário
            </button>
            <button onClick={() => setViewType('list')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-lg">view_stream</span> Lista
            </button>
          </div>

          {user.role === 'admin' && (
            <button
              onClick={() => setShowRulesModal(!showRulesModal)}
              className={`size-10 flex items-center justify-center rounded-xl border transition-all shrink-0 ${showRulesModal ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
              title="Configurar Regras"
            >
              <span className="material-symbols-outlined text-xl">settings_suggest</span>
            </button>
          )}
        </div>
      </div>

      {showRulesModal && <CalendarRules user={user} rules={rules} onUpdate={fetchData} />}


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

        {/* ÁREA DE CONTEÚDO PRINCIPAL (TIMELINE OU CALENDÁRIO) */}
        <div className="lg:col-span-3 space-y-4">
          {viewType === 'calendar' ? (
            <CalendarView
              events={agendamentos.filter(a => a.status !== 'Cancelado')}
              onDateClick={(date) => {
                setFormData({ ...formData, data: date });
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div className="space-y-4">
              {agendamentos.filter(a => a.status !== 'Cancelado').map((item) => (
                <div key={item.id} className="group flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 bg-white dark:bg-[#1d222a] p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative">
                  {/* ... (rest of the card remains the same) */}
                  <div className="flex flex-col items-center justify-center min-w-[70px] md:min-w-[80px] py-1 md:py-2 border-r border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{new Date(item.data + 'T00:00:00').getDate()}</span>
                    <span className="text-[10px] font-bold text-primary uppercase">{item.hora}</span>
                  </div>

                  <div className="size-10 md:size-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0">
                    <span className="material-symbols-outlined text-xl md:text-2xl">{getIcon(item.tipo)}</span>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusStyle(item.status)} uppercase tracking-tighter`}>{item.status}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {item.tipo}</span>
                      {item.sala_id && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">• Unid {item.sala_id}</span>}
                    </div>
                    <h4 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{item.titulo}</h4>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] md:text-xs">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {item.local}
                    </div>
                  </div>

                  <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                    {(user.role === 'admin' || item.sala_id === user.sala_numero) && item.status !== 'Cancelado' && (
                      <button onClick={() => handleCancel(item.id)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Cancelar"><span className="material-symbols-outlined text-xl">event_busy</span></button>
                    )}
                    {(user.role === 'admin' || item.sala_id === user.sala_numero) && (
                      <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir"><span className="material-symbols-outlined text-xl">delete</span></button>
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
          )}
        </div>
      </div>
      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-[24px] shadow-2xl max-w-sm w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Excluir Agendamento?</h3>
              <p className="text-slate-500 text-sm mt-2">Esta ação é irreversível e será registrada em auditoria.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo da Exclusão *</label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ex: Erro no preenchimento ou desistência"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white text-sm min-h-[100px] resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!deleteReason.trim() || isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agendamentos;
