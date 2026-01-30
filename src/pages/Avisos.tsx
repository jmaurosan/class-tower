
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Aviso, User } from '../types';

interface AvisosProps {
  user: User;
}

const Avisos: React.FC<AvisosProps> = ({ user }) => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'Baixa' as Aviso['prioridade']
  });

  const fetchAvisos = async () => {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      if (data) setAvisos(data);
    } catch (err) {
      console.error('Erro ao buscar avisos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();

    const channel = supabase
      .channel('avisos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, () => {
        fetchAvisos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityStyle = (prioridade: Aviso['prioridade']) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Media': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Alta': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Critica': return 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse';
    }
  };

  const getPriorityLabel = (prioridade: Aviso['prioridade']) => {
    switch (prioridade) {
      case 'Baixa': return 'Informativo';
      case 'Media': return 'Importante';
      case 'Alta': return 'Urgente';
      case 'Critica': return 'Crítico';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const agora = new Date();
    try {
      const { error } = await supabase
        .from('avisos')
        .insert([{
          ...formData,
          data: agora.toISOString().split('T')[0],
          hora: agora.toTimeString().split(' ')[0].substring(0, 5),
          criado_por: user.name
        }]);

      if (error) throw error;
      setShowForm(false);
      setFormData({ titulo: '', conteudo: '', prioridade: 'Baixa' });
    } catch (err) {
      console.error('Erro ao postar aviso:', err);
      alert('Erro ao salvar o aviso.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este aviso?')) return;
    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir aviso.');
    }
  };

  const canManage = user.role === 'admin' || user.role === 'atendente';

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Portal de Avisos</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Comunicados oficiais e informações gerais</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined">{showForm ? 'close' : 'add_alert'}</span>
            {showForm ? 'Cancelar' : 'Novo Aviso'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Lado Esquerdo: Formulário (Apenas Staff) */}
        {canManage && showForm && (
          <div className="lg:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-8 animate-in slide-in-from-left duration-300">
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">Criar Comunicado</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Título</label>
                  <input required type="text" placeholder="Ex: Manutenção Elevadores" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Conteúdo</label>
                  <textarea required rows={4} placeholder="Descreva os detalhes do aviso..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm resize-none" value={formData.conteudo} onChange={e => setFormData({ ...formData, conteudo: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Urgência</label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm" value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value as any })}>
                    <option value="Baixa">Informativo (Cinza)</option>
                    <option value="Media">Importante (Azul)</option>
                    <option value="Alta">Urgente (Laranja)</option>
                    <option value="Critica">Crítico (Vermelho)</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Publicar Agora</button>
              </form>
            </div>
          </div>
        )}

        {/* Lado Direito: Feed de Avisos */}
        <div className={`${showForm && canManage ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
          {avisos.length > 0 ? (
            avisos.map((aviso) => (
              <div key={aviso.id} className="group relative bg-white dark:bg-[#1d222a] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getPriorityStyle(aviso.prioridade)}`}>
                        {getPriorityLabel(aviso.prioridade)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {new Date(aviso.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {aviso.hora}</span>
                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">• Por: {aviso.criado_por}</span>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{aviso.titulo}</h4>
                      <div className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                        {aviso.conteudo}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(aviso.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Excluir Aviso"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white dark:bg-[#1d222a] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">campaign</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum comunicado no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Avisos;
