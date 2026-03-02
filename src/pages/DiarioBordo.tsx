import React, { useEffect, useState } from 'react';
import { diarioService } from '../services/diarioService';
import { DiarioEntry, User } from '../types';

interface DiarioBordoProps {
  user: User;
}

const DiarioBordo: React.FC<DiarioBordoProps> = ({ user }) => {
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
      await fetchEntries();
    } catch (err) {
      console.error('Erro ao salvar ocorrência:', err);
      alert('Erro ao salvar no banco de dados.');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro permanentemente?')) return;

    const motivo = prompt('Por favor, detalhe o motivo da exclusão:');
    if (!motivo) {
      alert('A exclusão foi cancelada. É necessário informar um motivo.');
      return;
    }

    try {
      await diarioService.delete(id, motivo, user.id, user.name);
      await fetchEntries();
      alert('Registro excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir ocorrência:', err);
      alert('Erro ao excluir do banco de dados.');
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário Coluna Esquerda */}
        {showForm ? (
          <div className="lg:col-span-1 animate-in slide-in-from-left duration-300 h-fit sticky top-8">
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 ring-1 ring-primary/5">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  {editingId ? 'Editar Registro' : 'Informar Ocorrência'}
                </h4>
                <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Título</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Vazamento no subsolo"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all"
                    value={newEntry.titulo}
                    onChange={e => setNewEntry({ ...newEntry, titulo: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
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
                      <option value="Nova">+ Criar Nova Categoria</option>
                    </select>
                  </div>
                  {isNovaCategoria && (
                    <div className="space-y-1 animate-in slide-in-from-left duration-200">
                      <label className="text-[10px] font-bold text-primary uppercase ml-1">Nome da Nova Categoria</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Elétrica"
                        className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                        value={newEntry.novaCategoria}
                        onChange={e => setNewEntry({ ...newEntry, novaCategoria: e.target.value })}
                      />
                    </div>
                  )}
                  {editingId && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                        value={newEntry.status}
                        onChange={e => setNewEntry({ ...newEntry, status: e.target.value as any })}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Resolvido">Resolvido</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva o ocorrido com detalhes..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none transition-all"
                    value={newEntry.descricao}
                    onChange={e => setNewEntry({ ...newEntry, descricao: e.target.value })}
                  />
                </div>
                {newEntry.status === 'Resolvido' && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase ml-1">Solução Efetivada</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Qual foi a solução aplicada?"
                      className="w-full px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white resize-none transition-all"
                      value={newEntry.solucao}
                      onChange={e => setNewEntry({ ...newEntry, solucao: e.target.value })}
                    />
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'Salvar Alterações' : 'Registrar Agora'}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Lista Coluna Direita */}
        <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
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
                      onClick={() => handleDelete(entry.id)}
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
            <div className="text-center py-20 bg-white dark:bg-[#1d222a] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">auto_stories</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhuma Ocorrência Registrada</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary font-bold text-sm hover:underline"
              >
                Clique aqui para começar o registro de hoje
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiarioBordo;
