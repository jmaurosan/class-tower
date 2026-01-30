
import React, { useState, useMemo, useEffect } from 'react';
import { Vistoria } from '../types';

interface VistoriasProps {
  vistoriasList: Vistoria[];
}

const Vistorias: React.FC<VistoriasProps> = ({ vistoriasList }) => {
  const [filter, setFilter] = useState<'Todos' | 'Pendente' | 'Concluído' | 'Em Andamento'>('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && vistoriasList.length > 0) {
      setSelectedId(vistoriasList[0].id);
    }
  }, [vistoriasList, selectedId]);

  const filteredVistorias = useMemo(() => {
    if (filter === 'Todos') return vistoriasList;
    return vistoriasList.filter(v => v.status === filter);
  }, [filter, vistoriasList]);

  const selectedVistoria = useMemo(() => {
    return vistoriasList.find(v => v.id === selectedId) || vistoriasList[0];
  }, [selectedId, vistoriasList]);

  const getUrgenciaBadge = (urgencia: Vistoria['urgencia']) => {
    switch (urgencia) {
      case 'Alta': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Média': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Baixa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  if (!selectedVistoria && vistoriasList.length === 0) {
    return <div className="p-8 text-center text-slate-400 dark:text-slate-600">Nenhuma vistoria cadastrada.</div>;
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
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === status 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                      v.status === 'Concluído' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                      v.status === 'Pendente' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVistoria && (
        <aside className="w-[400px] bg-white dark:bg-[#1d222a] border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shadow-2xl transition-colors duration-300">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Vistoria #{selectedVistoria.id}</span>
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
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Finalizado</span>
                  <span className="text-xs font-bold text-primary">{selectedVistoria.status === 'Concluído' ? '100%' : '60%'}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: selectedVistoria.status === 'Concluído' ? '100%' : '60%' }}></div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-3">Observações Técnicas</h3>
              {selectedVistoria.descricao ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedVistoria.descricao}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Sem observações.</p>
              )}
            </section>

            <div className="space-y-3 pt-4 sticky bottom-0 bg-white dark:bg-[#1d222a] pb-4">
              <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
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
