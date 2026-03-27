import React, { useEffect, useState } from 'react';
import { diarioService } from '../services/diarioService';
import { useToast } from '../context/ToastContext';
import { DiarioEntry, User } from '../types';

interface DiarioBordoProps {
  user: User;
}

const DiarioBordo: React.FC<DiarioBordoProps> = ({ user }) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Outros' as string,
    novaCategoria: '',
    status: 'Pendente' as DiarioEntry['status'],
    solucao: ''
  });
  const [isNovaCategoria, setIsNovaCategoria] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntries = async () => {
    try {
      const data = await diarioService.getAll();
      setEntries(data as DiarioEntry[]);
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete || !deleteReason.trim()) {
      showToast('Por favor, informe o motivo da exclusão.', 'error');
      return;
    }

    try {
      setIsDeleting(true);

      // Buscar dados antes de deletar para o log
      const oldEntry = entries.find(e => e.id === idToDelete);

      await diarioService.delete(idToDelete, deleteReason, user.id, user.name);

      // O log de auditoria é opcional aqui se o service já fizer, 
      // mas vamos garantir que a UI reflita o sucesso.

      showToast('Ocorrência excluída com sucesso!');
      setShowDeleteModal(false);
      setIdToDelete(null);
      fetchEntries();
    } catch (err: any) {
      console.error('Erro ao excluir ocorrência:', err);
      showToast(err.message || 'Erro ao excluir ocorrência', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const subscription = diarioService.subscribe(() => {
      fetchEntries();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCategoryColor = (cat: DiarioEntry['categoria']) => {
    switch (cat) {
      case 'Segurança': return 'bg-red-500';
      case 'Manutenção': return 'bg-blue-500';
      case 'Limpeza': return 'bg-emerald-500';
      case 'Reclamação': return 'bg-purple-500';
      case 'Aviso': return 'bg-indigo-600';
      default: return 'bg-slate-500';
    }
  };

  const getCategoryBorderColor = (cat: DiarioEntry['categoria']) => {
    switch (cat) {
      case 'Segurança': return 'border-l-red-500';
      case 'Manutenção': return 'border-l-blue-500';
      case 'Limpeza': return 'border-l-emerald-500';
      case 'Reclamação': return 'border-l-purple-500';
      case 'Aviso': return 'border-l-indigo-600';
      default: return 'border-l-slate-500';
    }
  };

  const getCategoryIcon = (cat: DiarioEntry['categoria']) => {
    switch (cat) {
      case 'Segurança': return 'security';
      case 'Manutenção': return 'build';
      case 'Limpeza': return 'cleaning_services';
      case 'Reclamação': return 'report';
      case 'Aviso': return 'campaign';
      default: return 'event_note';
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const finalCategoria = isNovaCategoria ? newEntry.novaCategoria : newEntry.categoria;

      if (editingId) {
        await diarioService.update(editingId, {
          titulo: newEntry.titulo,
          descricao: newEntry.descricao,
          categoria: finalCategoria,
          status: newEntry.status,
          solucao: newEntry.solucao
        }, user.id, user.name);
        setEditingId(null);
      } else {
        await diarioService.create({
          titulo: newEntry.titulo,
          descricao: newEntry.descricao,
          categoria: finalCategoria,
          usuario: user.name,
          sala_id: user.sala_numero,
          user_id: user.id,
          status: 'Pendente'
        }, user.id, user.name);
      }

      setNewEntry({ titulo: '', descricao: '', categoria: 'Outros', novaCategoria: '', status: 'Pendente', solucao: '' });
      setIsNovaCategoria(false);
      setShowForm(false);
      showToast(editingId ? 'Ocorrência atualizada com sucesso!' : 'Ocorrência registrada com sucesso!');
      await fetchEntries();
    } catch (err: any) {
      console.error('Erro ao salvar ocorrência:', err);
      showToast(err.message || 'Erro ao salvar ocorrência', 'error');
    }
  };

  const handleEdit = (entry: DiarioEntry) => {
    setNewEntry({
      titulo: entry.titulo,
      descricao: entry.descricao,
      categoria: entry.categoria,
      novaCategoria: '',
      status: entry.status,
      solucao: entry.solucao || ''
    });
    setEditingId(entry.id);
    setIsNovaCategoria(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setNewEntry({ titulo: '', descricao: '', categoria: 'Outros', novaCategoria: '', status: 'Pendente', solucao: '' });
    setIsNovaCategoria(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.usuario.toLowerCase().includes(searchTerm.toLowerCase());

    if (showTodayOnly) {
      const today = new Date().toLocaleDateString('pt-BR');
      const entryDate = new Date(entry.created_at || '').toLocaleDateString('pt-BR');
      return today === entryDate && matchesSearch;
    }
    return matchesSearch;
  });

  const isAdmin = user.role === 'admin';
  const isAtendente = user.role === 'atendente';
  const canManage = isAdmin || isAtendente;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {!showForm && canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-xl">edit_note</span>
            Nova Entrada
          </button>
        )}

        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-xl justify-end">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Buscar ocorrência..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowTodayOnly(!showTodayOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${showTodayOnly
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-primary/50 shadow-sm'}`}
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário Coluna Esquerda - Agora ocupa 7/12 colunas em desktop */}
        {showForm ? (
          <div className="lg:col-span-7 animate-in slide-in-from-left duration-300 h-fit sticky top-8">
            <div className="bg-white dark:bg-[#1d222a] p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 ring-1 ring-primary/5">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">{editingId ? 'edit_square' : 'add_notes'}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingId ? 'Editar Registro' : 'Informar Ocorrência'}
                  </h4>
                </div>
                <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Registro</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Vazamento no subsolo"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-base font-bold transition-all"
                      value={newEntry.titulo}
                      onChange={e => setNewEntry({ ...newEntry, titulo: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-bold appearance-none cursor-pointer"
                      value={isNovaCategoria ? 'Nova' : newEntry.categoria}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'Nova') {
                          setIsNovaCategoria(true);
                          setNewEntry({ ...newEntry, categoria: '' });
                        } else {
                          setIsNovaCategoria(false);
                          setNewEntry({ ...newEntry, categoria: val });
                        }
                      }}
                    >
                      <option>Segurança</option>
                      <option>Manutenção</option>
                      <option>Limpeza</option>
                      <option>Reclamação</option>
                      <option>Aviso</option>
                      <option>Outros</option>
                      <option value="Nova">+ Criar Nova...</option>
                    </select>
                  </div>
                </div>

                {isNovaCategoria && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Nome da Nova Categoria</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Elétrica"
                      className="w-full px-5 py-4 bg-primary/5 border border-primary/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-bold"
                      value={newEntry.novaCategoria}
                      onChange={e => setNewEntry({ ...newEntry, novaCategoria: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Descreva o ocorrido com o máximo de detalhes para facilitar o acompanhamento..."
                    className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-base leading-relaxed resize-none transition-all"
                    value={newEntry.descricao}
                    onChange={e => setNewEntry({ ...newEntry, descricao: e.target.value })}
                  />
                </div>

                {editingId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mudar Status</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-bold"
                        value={newEntry.status}
                        onChange={e => setNewEntry({ ...newEntry, status: e.target.value as any })}
                      >
                        <option value="Pendente">Ainda Pendente</option>
                        <option value="Resolvido">Resolvido / Concluído</option>
                      </select>
                    </div>
                  </div>
                )}

                {newEntry.status === 'Resolvido' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Solução Aplicada</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Descreva como o problema foi resolvido..."
                      className="w-full px-6 py-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-[24px] outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white text-base leading-relaxed resize-none transition-all"
                      value={newEntry.solucao}
                      onChange={e => setNewEntry({ ...newEntry, solucao: e.target.value })}
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={handleCancel} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">
                    {editingId ? 'Salvar Alterações' : 'Registrar Ocorrência'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Lista Coluna Direita - Agora distribui colunas proporcionalmente */}
        <div className={`${showForm ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-6`}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`group bg-white dark:bg-[#1d222a] p-4 md:p-6 rounded-2xl border-l-4 border border-slate-200 dark:border-slate-800 transition-all duration-300 relative hover:shadow-md ${getCategoryBorderColor(entry.categoria)} ${editingId === entry.id ? 'ring-1 ring-primary/20 shadow-lg' : ''}`}
              >
                {/* Botões de Ação */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {canManage && (
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      title="Editar registro"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClick(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir registro"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3 pr-16">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{entry.data} • {entry.hora}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getCategoryColor(entry.categoria)} shadow-sm`}>{entry.categoria}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${entry.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {entry.status}
                  </span>
                </div>

                <h4 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white mb-1">{entry.titulo}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{entry.descricao}</p>

                {entry.status === 'Resolvido' && entry.solucao && (
                  <div className="mb-4 p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">task_alt</span>
                      Solução Aplicada
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{entry.solucao}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                  <div className="size-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registrado por: {entry.usuario}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={`text-center flex flex-col items-center justify-center bg-white dark:bg-[#1d222a] rounded-[32px] border border-dashed border-slate-300 dark:border-slate-800 ${showForm ? 'py-12' : 'py-32'}`}>
              <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800">auto_stories</span>
              </div>
              <p className="text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-xs">Nenhuma Ocorrência Hoje</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Clique aqui para começar o registro
              </button>
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
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Excluir Ocorrência?</h3>
              <p className="text-slate-500 text-sm mt-2">Esta ação é irreversível e será registrada em log.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo da Exclusão *</label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ex: Erro de digitação ou cancelamento"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white text-sm min-h-[100px] resize-none"
                />
              </div>

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

export default DiarioBordo;
