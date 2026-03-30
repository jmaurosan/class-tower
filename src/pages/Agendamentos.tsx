import React, { useEffect, useState } from 'react';
import CalendarRules, { CalendarRule } from '../components/CalendarRules';
import CalendarView from '../components/CalendarView';
import { useToast } from '../context/ToastContext';
import { agendamentosService } from '../services/agendamentosService';
import { supabase } from '../services/supabase';
import { documentsService } from '../services/documentsService';
import { Agendamento, User } from '../types';

interface AgendamentosProps {
  user: User;
}

const Agendamentos: React.FC<AgendamentosProps> = ({ user }) => {
  const canCRUD = user.role !== 'atendente'; // Atendente não pode fazer CRUD
  const { showToast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [rules, setRules] = useState<CalendarRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'calendar'>('calendar');

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    hora: '',
    local: '',
    tipo: 'Mudança' as Agendamento['tipo'],
    sala_id: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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

    const isStaff = user.role === 'admin' || user.role === 'atendente';

    // Verificar se já existe evento no mesmo horário
    const conflitoHorario = agendamentos.find(
      a => a.data === formData.data &&
           a.hora === formData.hora &&
           a.id !== editingId &&
           a.status !== 'Cancelado'
    );

    if (conflitoHorario) {
      showToast(`Já existe um evento (${conflitoHorario.titulo}) marcado para este horário.`, 'error');
      return;
    }

    const validationError = validateScheduling(formData.data, formData.hora, formData.tipo);
    if (validationError && !isStaff) {
      showToast(validationError, 'error');
      return;
    }

    if (!canCRUD) {
      showToast('Atendentes não possuem permissão para realizar agendamentos.', 'error');
      return;
    }

    try {
      setIsUploading(true);

      let uploadUrl = '';
      // Apenas fazemos upload na criação
      if (formData.tipo === 'Mudança' && selectedFile && !editingId) {
        const docInfo = {
          nome: `Autorização Mudança - Unidade ${user.sala_numero || formData.sala_id || user.name}`,
          categoria: 'Autorizações'
        };
        const resultadoUpload: any = await documentsService.upload(selectedFile, docInfo);
        uploadUrl = resultadoUpload.url;
      }

      // Se editando manter o anexo anterior, se nao pegar o novo
      const isEditingWithAnexo = editingId && formData.local.includes(' | ANEXO: ');
      const localParaSalvar = uploadUrl 
        ? `${formData.local} | ANEXO: ${uploadUrl}` 
        : formData.local;

      if (editingId) {
        await agendamentosService.update(editingId, {
          ...formData,
        }, user.id, user.name);
      } else {
        await agendamentosService.create({
          ...formData,
          local: localParaSalvar,
          status: 'Pendente',
          sala_id: (user.role === 'admin' || user.role === 'atendente') ? formData.sala_id : (user.sala_numero || '0000'),
          user_id: user.id
        }, user.id, user.name);
      }

        // Insert into Avisos
        const { supabase } = await import('../services/supabase');
        
        if (formData.tipo === 'Mudança' && !editingId) {
          const agora = new Date();
          const dataFormatada = new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR');

          await supabase.from('avisos').insert([{
            titulo: `🚚 Nova Mudança Agendada - Unidade ${user.sala_numero || formData.sala_id || user.name}`,
            conteudo: `Uma mudança foi agendada para o dia ${dataFormatada} às ${formData.hora}.\nLocal: ${formData.local}\nResponsável: ${user.name}${uploadUrl ? `\n\n📄 Documento de Autorização Anexo:\n${uploadUrl}` : ''}`,
            prioridade: 'Media',
            data: agora.toISOString().split('T')[0],
            hora: agora.toTimeString().split(' ')[0].substring(0, 5),
            criado_por: user.id
          }]);
          
          if (uploadUrl) {
            await supabase.from('diario').insert([{
              data: agora.toISOString().split('T')[0],
              hora: agora.toTimeString().split(' ')[0].substring(0, 5),
              titulo: `Anexo de Autorização (Mudança) - Unidade ${user.sala_numero || formData.sala_id || user.name}`,
              descricao: `O condômino anexou o documento formal de permissão.\nLink de acesso:\n${uploadUrl}`,
              categoria: 'Segurança',
              usuario: user.name,
              sala_id: user.sala_numero || formData.sala_id,
              status: 'Resolvido'
            }]);
          }
        } else if (formData.tipo === 'Autorização de Acesso' && !editingId) {
          const agora = new Date();
          const dataFormatada = new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR');
          
          // Trigger Aviso (Urgent)
          await supabase.from('avisos').insert([{
            titulo: `🔑 Autorização de Acesso - Unidade ${user.sala_numero || user.name}`,
            conteudo: `A unidade autorizou a entrada de:\n\n${formData.local}\n\nMotivo/Empresa: ${formData.titulo}\nData Prevista: ${dataFormatada} às ${formData.hora}`,
            prioridade: 'Alta',
            data: agora.toISOString().split('T')[0],
            hora: agora.toTimeString().split(' ')[0].substring(0, 5),
            criado_por: user.id
          }]);

          // Insert into Diario de Bordo (Permanent Audit Log for security)
          await supabase.from('diario').insert([{
            data: agora.toISOString().split('T')[0],
            hora: agora.toTimeString().split(' ')[0].substring(0, 5),
            titulo: `Autorização de Acesso: ${formData.titulo} (Unidade ${user.sala_numero || user.name})`,
            descricao: `Pessoas autorizadas pela unidade:\n${formData.local}\n\nPrevisão de chegada: ${dataFormatada} às ${formData.hora}`,
            categoria: 'Segurança',
            usuario: user.name,
            sala_id: user.sala_numero || formData.sala_id,
            status: 'Resolvido'
          }]);
        }

      showToast(editingId ? 'Agendamento atualizado com sucesso!' : 'Agendamento realizado com sucesso!');
      setSelectedFile(null);
      setIsUploading(false);
      setFormData({
        titulo: '',
        data: '',
        hora: '',
        local: '',
        tipo: 'Mudança', // Keep as 'Mudança' to match initial state and options
        sala_id: ''
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar agendamento:', err);
      setIsUploading(false);
      showToast(err.message || 'Erro ao realizar agendamento', 'error');
    }
  };

  const handleSelectEvent = (event: Agendamento) => {
    setFormData({
      titulo: event.titulo,
      data: event.data,
      hora: event.hora,
      local: event.local,
      tipo: event.tipo,
      sala_id: event.sala_id
    });
    setEditingId(event.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleCancel = async (id: string) => {
    if (!canCRUD) return;
    if (!confirm('Deseja cancelar este agendamento?')) return;
    try {
      await agendamentosService.updateStatus(id, 'Cancelado', user.id, user.name);
      showToast('Agendamento cancelado com sucesso!');
      fetchData();
    } catch (err: any) {
      console.error('Erro ao cancelar agendamento:', err);
      showToast(err.message || 'Erro ao cancelar agendamento', 'error');
    }
  };

  const handleDeleteClick = (id: string) => {
    if (!canCRUD) return;
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
      showToast('Agendamento excluído com sucesso!');
      setShowDeleteModal(false);
      setIdToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao excluir agendamento:', err);
      showToast(err.message || 'Erro ao excluir agendamento', 'error');
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
      case 'Autorização de Acesso': return 'person_check';
    }
  };

  return (
    <div className="p-3 md:p-8 space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        {canCRUD && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
            {showForm ? 'Cancelar' : 'Novo Evento'}
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Toggle de Visualização */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex-1 overflow-hidden">
            <button onClick={() => setViewType('calendar')} className={`flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${viewType === 'calendar' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-lg">calendar_month</span> Calendário
            </button>
            <button onClick={() => setViewType('list')} className={`flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${viewType === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-lg">view_stream</span> Lista
            </button>
          </div>

          {(user.role === 'admin') && (
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

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 md:gap-8">
        {/* Lado Esquerdo: Filtros e Formulário ou Resumo */}
        <div className="lg:col-span-1 space-y-6 order-1">
          {showForm ? (
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  {editingId ? 'Editar Evento' : 'Novo Evento'}
                </h4>
                {editingId && (
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ titulo: '', data: '', hora: '', local: '', tipo: 'Mudança', sala_id: '' });
                    }}
                    className="text-[10px] font-bold text-primary uppercase hover:underline"
                  >
                    Novo Evento
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required type="text" placeholder={formData.tipo === 'Autorização de Acesso' ? "Motivo ou Empresa (Ex: Equipe de Pintura, Vivo)" : "O que será agendado?"} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
                </div>
                {(user.role === 'admin' || user.role === 'atendente') && (
                  <input 
                    required 
                    type="text" 
                    placeholder="Unidade / Sala" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs" 
                    value={formData.sala_id} 
                    onChange={e => setFormData({ ...formData, sala_id: e.target.value })} 
                  />
                )}
                <select
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white ${user.role === 'sala' ? '' : ''}`}
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <option>Mudança</option>
                  <option>Autorização de Acesso</option>
                  {(user.role !== 'sala') && (
                    <>
                      <option>Manutenção</option>
                      <option>Reserva</option>
                      <option>Reunião</option>
                    </>
                  )}
                </select>
                {formData.tipo === 'Autorização de Acesso' ? (
                  <textarea required disabled={editingId ? !(user.role === 'admin' || user.role === 'atendente' || formData.sala_id === user.sala_numero) : false} placeholder="Nomes e CPFs dos autorizados (um por linha)&#10;Ex: João Silva - 123.456.789-00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white disabled:opacity-50 min-h-[100px] resize-none" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
                ) : (
                  <>
                    <input required disabled={editingId ? !(user.role === 'admin' || user.role === 'atendente' || formData.sala_id === user.sala_numero) : false} type="text" placeholder="Local/Ambiente" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white disabled:opacity-50" value={formData.local.split(' | ANEXO: ')[0]} onChange={e => setFormData({ ...formData, local: formData.local.includes(' | ANEXO: ') ? `${e.target.value} | ANEXO: ${formData.local.split(' | ANEXO: ')[1]}` : e.target.value })} />
                    {formData.tipo === 'Mudança' && !editingId && (
                      <div className="space-y-1 mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexar Autorização (Pdf/Foto) <span className="opacity-50 font-normal lowercase">(Opcional)</span></label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                        />
                      </div>
                    )}
                  </>
                )}
                {( !editingId || user.role === 'admin' || user.role === 'atendente' || formData.sala_id === user.sala_numero ) && (
                  <button type="submit" disabled={isUploading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed">
                    {isUploading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingId ? 'Salvar Alterações' : 'Confirmar Agendamento')}
                  </button>
                )}
                {editingId && !(user.role === 'admin' || user.role === 'atendente' || formData.sala_id === user.sala_numero) && (
                  <p className="text-[10px] text-center font-bold text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                    Modo Visualização: Apenas proprietário ou staff podem editar
                  </p>
                )}
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
        <div className="lg:col-span-3 space-y-4 order-2">
          {viewType === 'calendar' ? (
            <CalendarView
              events={agendamentos.filter(a => a.status !== 'Cancelado')}
              rules={rules}
              onDateClick={(date) => {
                setFormData({ ...formData, data: date });
                setEditingId(null);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBlockedClick={(reason) => showToast(`Agendamento bloqueado: ${reason}`, 'warning')}
              onSelectEvent={handleSelectEvent}
            />
          ) : (
            <div className="space-y-4">
              {agendamentos.filter(a => a.status !== 'Cancelado').map((item) => (
                <div key={item.id} className="group flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 bg-white dark:bg-[#1d222a] p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative">
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
                      {item.local.includes(' | ANEXO: ') ? item.local.split(' | ANEXO: ')[0] : item.local}
                    </div>
                    {item.local.includes(' | ANEXO: ') && (
                      <div className="mt-2 text-left">
                        <a href={item.local.split(' | ANEXO: ')[1]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-900/30">
                          <span className="material-symbols-outlined text-sm">cloud_download</span>
                          Baixar Autorização
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                    {canCRUD && (user.role === 'admin' || item.sala_id === user.sala_numero) && item.status !== 'Cancelado' && (
                      <button onClick={() => handleSelectEvent(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar"><span className="material-symbols-outlined text-xl">edit</span></button>
                    )}
                    {canCRUD && (user.role === 'admin' || item.sala_id === user.sala_numero) && item.status !== 'Cancelado' && (
                      <button onClick={() => handleCancel(item.id)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Cancelar"><span className="material-symbols-outlined text-xl">event_busy</span></button>
                    )}
                    {canCRUD && (user.role === 'admin' || item.sala_id === user.sala_numero) && (
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
