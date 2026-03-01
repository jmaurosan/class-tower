
import React, { useState } from 'react';
import { useAvisos } from '../hooks/useAvisos';
import { Aviso, User } from '../types';

interface AvisosProps {
  user: User;
}

const Avisos: React.FC<AvisosProps> = ({ user }) => {
  const { avisos, loading, addAviso, deleteAviso } = useAvisos();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'Baixa' as Aviso['prioridade']
  });

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
      await addAviso({
        ...formData,
        data: agora.toISOString().split('T')[0],
        hora: agora.toTimeString().split(' ')[0].substring(0, 5),
        criado_por: user.id
      });

      setShowForm(false);
      setFormData({ titulo: '', conteudo: '', prioridade: 'Baixa' });
      // Adicionar feedback de sucesso
      console.log('Aviso salvo com sucesso');
    } catch (err: any) {
      console.error('Erro ao postar aviso:', err);
      const errorMessage = err.message || 'Erro desconhecido ao salvar o aviso.';
      alert(`Erro ao salvar o aviso: ${errorMessage}`);
    }
  };

  const canManage = user.role === 'admin' || user.role === 'atendente';

  const filteredAvisos = React.useMemo(() => {
    if (canManage) return avisos;

    return avisos.filter(aviso => {
      const creatorRole = aviso.creator?.role;
      // Mostrar se foi criado por staff (admin/atendente)
      if (creatorRole === 'admin' || creatorRole === 'atendente') return true;
      // Mostrar se foi criado pelo próprio usuário
      return aviso.criado_por === user.id;
    });
  }, [avisos, user.id, canManage]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este aviso?')) return;
    try {
      await deleteAviso(id);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir aviso.');
    }
  };


  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
      {canManage && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_alert'}</span>
          {showForm ? 'Cancelar' : 'Novo Comunicado'}
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Lado Esquerdo: Formulário (Apenas Staff) */}
        {canManage && showForm && (
          <div className="lg:col-span-1 animate-in slide-in-from-left duration-500">
            <div className="bg-white dark:bg-[#1d222a] p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl sticky top-8">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Criar Comunicado</h4>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                  <input required type="text" placeholder="Ex: Manutenção Elevadores" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm font-medium transition-all" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteúdo</label>
                  <textarea required rows={5} placeholder="Descreva os detalhes do aviso..." className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm font-medium resize-none transition-all" value={formData.conteudo} onChange={e => setFormData({ ...formData, conteudo: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgência</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm font-bold transition-all appearance-none cursor-pointer" value={formData.prioridade} onChange={e => setFormData({ ...formData, prioridade: e.target.value as any })}>
                    <option value="Baixa">Informativo (Cinza)</option>
                    <option value="Media">Importante (Azul)</option>
                    <option value="Alta">Urgente (Laranja)</option>
                    <option value="Critica">Crítico (Vermelho)</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] mt-2">Publicar Agora</button>
              </form>
            </div>
          </div>
        )}

        {/* Lado Direito: Feed de Avisos */}
        <div className={`${showForm && canManage ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 md:space-y-8`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando avisos...</p>
            </div>
          ) : filteredAvisos.length > 0 ? (
            filteredAvisos.map((aviso) => (
              <div key={aviso.id} className="group relative bg-white dark:bg-[#1d222a] p-8 md:p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-5 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${getPriorityStyle(aviso.prioridade)}`}>
                        {getPriorityLabel(aviso.prioridade)}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(aviso.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {aviso.hora}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight leading-tight">{aviso.titulo}</h4>
                      <div className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed whitespace-pre-wrap max-w-4xl">
                        {aviso.conteudo}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(aviso.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-3 text-slate-400 md:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all shrink-0"
                      title="Excluir Aviso"
                    >
                      <span className="material-symbols-outlined text-2xl">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white dark:bg-[#1d222a] rounded-[48px] border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center">
              <div className="size-24 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-800">campaign</span>
              </div>
              <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-sm">Nenhum comunicado no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Avisos;
