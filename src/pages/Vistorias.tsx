
import React, { useMemo, useState } from 'react';
import { useVistorias } from '../hooks/useVistorias';
import { User, Vistoria } from '../types';

interface VistoriasProps {
  user: User;
}

const Vistorias: React.FC<VistoriasProps> = ({ user }) => {
  const { vistorias, loading, addVistoria, updateVistoriaStatus } = useVistorias();
  const [filter, setFilter] = useState<'Todos' | 'Pendente' | 'Concluído' | 'Em Andamento'>('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    unidade: '',
    local: '',
    urgencia: 'Baixa' as Vistoria['urgencia'],
    tecnico: user.name,
    descricao: ''
  });

  const filteredVistorias = useMemo(() => {
    if (filter === 'Todos') return vistorias;
    return vistorias.filter(v => v.status === filter);
  }, [filter, vistorias]);

  const selectedVistoria = useMemo(() => {
    return vistorias.find(v => v.id === selectedId);
  }, [selectedId, vistorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVistoria({
        ...formData,
        status: 'Pendente',
        fotoUrl: `https://picsum.photos/seed/${Math.random()}/400/300`
      });
      setShowForm(false);
      setFormData({
        unidade: '',
        local: '',
        urgencia: 'Baixa',
        tecnico: user.name,
        descricao: ''
      });
    } catch (err) {
      console.error('Erro ao salvar vistoria:', err);
      alert('Falha ao registrar vistoria.');
    }
  };

  const markAsCompleted = async (id: string | undefined) => {
    if (!id) return;
    try {
      await updateVistoriaStatus(id, 'Concluído');
    } catch (err) {
      console.error('Erro ao concluir:', err);
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

  const isAdmin = user.role === 'admin' || user.role === 'atendente';

  if (loading && vistorias.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden animate-in fade-in duration-500 transition-colors duration-300">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            {(['Todos', 'Pendente', 'Em Andamento', 'Concluído'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === status
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add_task</span>
              Nova Vistoria
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-8 bg-white dark:bg-[#1d222a] p-6 rounded-3xl border border-primary/20 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Registrar Laudo de Vistoria</h4>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Unidade (Ex: 1402)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.unidade} onChange={e => setFormData({ ...formData, unidade: e.target.value })} />
                <input required placeholder="Local (Ex: Hall de Entrada)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.urgencia} onChange={e => setFormData({ ...formData, urgencia: e.target.value as any })}>
                  <option value="Baixa">Urgência Baixa</option>
                  <option value="Média">Urgência Média</option>
                  <option value="Alta">Urgência Alta</option>
                </select>
                <input placeholder="Técnico" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" value={formData.tecnico} onChange={e => setFormData({ ...formData, tecnico: e.target.value })} />
              </div>
              <textarea rows={3} placeholder="Descrição técnica do problema/vistoria..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
              <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Salvar Vistoria</button>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-[#1d222a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unidade / Local</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Urgência</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Técnico</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVistorias.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/80 ${selectedId === v.id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${v.status === 'Concluído' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                        v.status === 'Pendente' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVistorias.length === 0 && (
            <div className="p-20 text-center text-slate-400 uppercase text-xs font-bold tracking-widest">Nenhuma vistoria encontrada</div>
          )}
        </div>
      </div>

      {selectedVistoria && (
        <aside className="w-[400px] bg-white dark:bg-[#1d222a] border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shadow-2xl transition-colors duration-300">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Vistoria #{selectedVistoria.id.substring(0, 8)}</span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedVistoria.unidade}</h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedVistoria.local}</span>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${getUrgenciaBadge(selectedVistoria.urgencia)}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">
                  {selectedVistoria.urgencia === 'Alta' ? 'priority_high' : selectedVistoria.urgencia === 'Média' ? 'medium' : 'low_priority'}
                </span>
                <span className="text-sm font-black uppercase tracking-widest">Prioridade {selectedVistoria.urgencia}</span>
              </div>
              <span className="text-[10px] font-bold opacity-60">{selectedVistoria.hora}</span>
            </div>

            <section className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Progresso do Laudo</h3>
              <div className="mb-6">
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

            <div className="space-y-3 pt-4 sticky bottom-0 bg-white dark:bg-[#1d222a] pb-4">
              {selectedVistoria.status !== 'Concluído' && isAdmin && (
                <button
                  onClick={() => markAsCompleted(selectedVistoria.id)}
                  className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mb-3"
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Concluir Vistoria
                </button>
              )}
              <button className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                Exportar Laudo Técnico
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Vistorias;
