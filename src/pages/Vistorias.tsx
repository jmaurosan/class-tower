
import React, { useMemo, useState } from 'react';
import { useVistorias } from '../hooks/useVistorias';
import { User, Vistoria } from '../types';

interface VistoriasProps {
  user: User;
}

const Vistorias: React.FC<VistoriasProps> = ({ user }) => {
  const { vistorias, loading, addVistoria, updateVistoriaStatus, updateVistoria, deleteVistoria, refresh } = useVistorias();
  const [filter, setFilter] = useState<'Todos' | 'Pendente' | 'Concluído' | 'Em Andamento'>('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    unidade: '',
    local: '',
    urgencia: 'Baixa' as Vistoria['urgencia'],
    tecnico: user.name,
    descricao: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredVistorias = useMemo(() => {
    if (filter === 'Todos') return vistorias;
    return vistorias.filter(v => v.status === filter);
  }, [filter, vistorias]);

  const counts = useMemo(() => {
    return {
      Todos: vistorias.length,
      Pendente: vistorias.filter(v => v.status === 'Pendente').length,
      'Em Andamento': vistorias.filter(v => v.status === 'Em Andamento').length,
      Concluído: vistorias.filter(v => v.status === 'Concluído').length,
    };
  }, [vistorias]);

  const selectedVistoria = useMemo(() => {
    return vistorias.find(v => v.id === selectedId);
  }, [selectedId, vistorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateVistoria(editingId, {
          ...formData
        }, user.id, user.name);
        setEditingId(null);
      } else {
        await addVistoria({
          ...formData,
          status: 'Pendente',
          fotoUrl: `https://picsum.photos/seed/${Math.random()}/400/300`
        }, user.id, user.name);
      }
      setShowForm(false);
      setFormData({
        unidade: '',
        local: '',
        urgencia: 'Baixa',
        tecnico: user.name,
        descricao: ''
      });
      await refresh();
    } catch (err) {
      console.error('Erro ao salvar vistoria:', err);
      alert('Falha ao registrar vistoria.');
    }
  };

  const handleEdit = (v: Vistoria) => {
    setEditingId(v.id);
    setFormData({
      unidade: v.unidade,
      local: v.local,
      urgencia: v.urgencia,
      tecnico: v.tecnico,
      descricao: v.descricao || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      await deleteVistoria(idToDelete, deleteReason, user.id, user.name);
      setSelectedId(null);
      setShowDeleteModal(false);
      setIdToDelete(null);
      await refresh();
    } catch (err) {
      console.error('Erro ao excluir vistoria:', err);
      setErrorMessage('Falha ao excluir vistoria. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const markAsCompleted = async (id: string | undefined) => {
    if (!id) return;
    try {
      await updateVistoriaStatus(id, 'Concluído', user.id, user.name);
      setSelectedId(null);
      await refresh();
      alert('Vistoria concluída com sucesso!');
    } catch (err) {
      console.error('Erro ao concluir:', err);
      alert('Erro ao concluir a vistoria. Verifique sua conexão.');
    }
  };

  const getUrgenciaBadge = (urgencia: Vistoria['urgencia']) => {
    switch (urgencia) {
      case 'Alta': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Média': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Baixa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const getStatusStyle = (status: Vistoria['status']) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
      case 'Pendente': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
      case 'Em Andamento': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const isAdmin = user.role === 'admin' || user.role === 'atendente';

  const handleExportPDF = () => {
    window.print();
  };

  if (loading && vistorias.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden animate-in fade-in duration-500 print:bg-white">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar print:p-0">
        {/* Header com filtros e botão */}
        <div className="flex flex-col gap-4 mb-6 print:hidden">
          {/* Botão Nova Vistoria - sempre visível e largo no mobile */}
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-xl">add_task</span>
              Nova Vistoria
            </button>
          )}

          {/* Filtros - card container */}
          <div className="bg-white dark:bg-[#1d222a] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              {(['Todos', 'Pendente', 'Em Andamento', 'Concluído'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center justify-center gap-1.5 ${filter === status
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                >
                  {status}
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${filter === status
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {counts[status]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Formulário Nova Vistoria */}
        {showForm && (
          <div className="mb-6 bg-white dark:bg-[#1d222a] p-5 md:p-6 rounded-2xl border border-primary/20 shadow-xl animate-in slide-in-from-top duration-300 print:hidden">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingId ? 'Editar Vistoria' : 'Registrar Vistoria'}
              </h4>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input required placeholder="Unidade (Ex: 1402)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.unidade} onChange={e => setFormData({ ...formData, unidade: e.target.value })} />
                <input required placeholder="Local (Ex: Hall de Entrada)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.urgencia} onChange={e => setFormData({ ...formData, urgencia: e.target.value as any })}>
                  <option value="Baixa">Urgência Baixa</option>
                  <option value="Média">Urgência Média</option>
                  <option value="Alta">Urgência Alta</option>
                </select>
                <input placeholder="Técnico" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.tecnico} onChange={e => setFormData({ ...formData, tecnico: e.target.value })} />
              </div>
              <textarea rows={3} placeholder="Descrição técnica..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none text-sm" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
              <button type="submit" className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm">Salvar Vistoria</button>
            </form>
          </div>
        )}

        {/* Tabela Desktop */}
        <div className="hidden md:block bg-white dark:bg-[#1d222a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none">
          <table className="w-full text-left border-collapse print:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:bg-transparent">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unidade / Local</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Urgência</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Técnico</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVistorias.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/80 ${selectedId === v.id ? 'bg-primary/5 dark:bg-primary/10' : ''} print:hover:bg-transparent`}
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{v.data}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{v.hora}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{v.unidade}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{v.local}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${getUrgenciaBadge(v.urgencia)}`}>
                      {v.urgencia}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{v.tecnico}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right print:hidden">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(v); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(v.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVistorias.length === 0 && (
            <div className="p-20 text-center text-slate-400 uppercase text-xs font-bold tracking-widest">Nenhuma vistoria encontrada</div>
          )}
        </div>

        {/* Cards Mobile */}
        <div className="md:hidden space-y-3">
          {filteredVistorias.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`bg-white dark:bg-[#1d222a] p-4 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${selectedId === v.id ? 'border-primary/40 shadow-md' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{v.unidade}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold truncate">{v.local}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold shrink-0 ml-2 ${getStatusStyle(v.status)}`}>
                  {v.status}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold truncate pr-10">{v.local}</p>
                <div className="flex gap-3 print:hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(v); }}
                    className="p-1 text-blue-500"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(v.id); }}
                    className="p-1 text-red-500"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getUrgenciaBadge(v.urgencia)}`}>
                    {v.urgencia}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{v.tecnico}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{v.data} • {v.hora}</span>
              </div>
            </div>
          ))}
          {filteredVistorias.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#1d222a] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-2">search_off</span>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma vistoria encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel Lateral de Detalhes */}
      {selectedVistoria && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300 print:hidden"
            onClick={() => setSelectedId(null)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:static lg:z-auto bg-white dark:bg-[#1d222a] border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none transition-colors duration-300 animate-in slide-in-from-right duration-300 print:hidden">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Vistoria #{selectedVistoria.id.substring(0, 8)}</span>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">{selectedVistoria.unidade}</h2>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedVistoria.local}</span>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${getUrgenciaBadge(selectedVistoria.urgencia)}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">
                    {selectedVistoria.urgencia === 'Alta' ? 'priority_high' : selectedVistoria.urgencia === 'Média' ? 'horizontal_rule' : 'low_priority'}
                  </span>
                  <span className="text-sm font-black uppercase tracking-widest">Prioridade {selectedVistoria.urgencia}</span>
                </div>
                <span className="text-[10px] font-bold opacity-60">{selectedVistoria.hora}</span>
              </div>

              <section className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Progresso do Laudo</h3>
                <div className="mb-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Estado Atual</span>
                    <span className="text-xs font-bold text-primary">{selectedVistoria.status === 'Concluído' ? '100% (Finalizado)' : 'Em Aberto'}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: selectedVistoria.status === 'Concluído' ? '100%' : '30%' }}></div>
                  </div>
                </div>
              </section>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <img src={selectedVistoria.fotoUrl} alt="Vistoria" className="w-full object-cover" />
              </div>

              <section className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-3">Observações Técnicas</h3>
                {selectedVistoria.descricao ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedVistoria.descricao}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sem observações.</p>
                )}
              </section>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                {selectedVistoria.status !== 'Concluído' && isAdmin && (
                  <button
                    onClick={() => markAsCompleted(selectedVistoria.id)}
                    className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Concluir Vistoria
                  </button>
                )}
                <button
                  onClick={handleExportPDF}
                  className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  Exportar Laudo Técnico
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-[24px] shadow-2xl max-w-sm w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Excluir Vistoria?</h3>
              <p className="text-slate-500 text-sm mt-2">Esta ação é irreversível e será registrada em log.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo da Exclusão *</label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ex: Registro duplicado ou erro técnico"
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

export default Vistorias;
