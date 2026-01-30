import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
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
    categoria: 'Outros' as DiarioEntry['categoria']
  });

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedData: DiarioEntry[] = data.map(item => ({
          id: item.id,
          data: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
          hora: new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          titulo: item.titulo,
          descricao: item.descricao,
          categoria: item.categoria,
          usuario: item.usuario_nome,
          sala_id: item.sala_id
        }));
        setEntries(mappedData);
      }
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('ocorrencias_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      if (editingId) {
        const { error } = await supabase
          .from('ocorrencias')
          .update({
            titulo: newEntry.titulo,
            descricao: newEntry.descricao,
            categoria: newEntry.categoria
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('ocorrencias')
          .insert([{
            titulo: newEntry.titulo,
            descricao: newEntry.descricao,
            categoria: newEntry.categoria,
            usuario_nome: user.name,
            sala_id: user.sala_numero
          }]);

        if (error) throw error;
      }

      setNewEntry({ titulo: '', descricao: '', categoria: 'Outros' });
      setShowForm(false);
    } catch (err) {
      console.error('Erro ao salvar ocorrência:', err);
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const handleEdit = (entry: DiarioEntry) => {
    setNewEntry({
      titulo: entry.titulo,
      descricao: entry.descricao,
      categoria: entry.categoria
    });
    setEditingId(entry.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('ocorrencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao excluir ocorrência:', err);
      alert('Erro ao excluir do banco de dados.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setNewEntry({ titulo: '', descricao: '', categoria: 'Outros' });
  };

  const isAdmin = user.role === 'admin';
  const isAtendente = user.role === 'atendente';
  const canManage = isAdmin || isAtendente;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ocorrências</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Histórico oficial de ocorrências e atividades</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-sm">security</span>
              Logs Ativos
            </div>
          )}
          {!showForm && canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 hover:opacity-90"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Nova Entrada
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário Coluna Esquerda */}
        {showForm && (
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all"
                    value={newEntry.categoria}
                    onChange={e => setNewEntry({ ...newEntry, categoria: e.target.value as any })}
                  >
                    <option>Segurança</option>
                    <option>Manutenção</option>
                    <option>Limpeza</option>
                    <option>Reclamação</option>
                    <option>Aviso</option>
                    <option>Outros</option>
                  </select>
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
                <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'Salvar Alterações' : 'Registrar Agora'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Lista Coluna Direita */}
        <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div key={entry.id} className="group flex gap-6">
                <div className="flex flex-col items-center">
                  <div className={`size-12 rounded-2xl ${getCategoryColor(entry.categoria)} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                    <span className="material-symbols-outlined">
                      {getCategoryIcon(entry.categoria)}
                    </span>
                  </div>
                  <div className="w-[1px] flex-1 bg-slate-200 dark:bg-slate-800 my-4"></div>
                </div>

                <div className={`flex-1 bg-white dark:bg-[#1d222a] p-6 rounded-2xl border transition-all duration-300 relative group-hover:shadow-md ${editingId === entry.id ? 'border-primary ring-1 ring-primary/20 shadow-lg' : 'border-slate-200 dark:border-slate-800'}`}>
                  {/* Botões de Ação */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Editar registro"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir registro"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-2 pr-20">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{entry.data} • {entry.hora}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getCategoryColor(entry.categoria)} shadow-sm`}>{entry.categoria}</span>
                    </div>
                  </div>

                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{entry.titulo}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{entry.descricao}</p>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                    <div className="size-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registrado por: {entry.usuario}</span>
                  </div>
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
