
import React, { useState, useMemo } from 'react';
import { DocumentoVencimento } from '../types';

interface VencimentosProps {
  documentos: DocumentoVencimento[];
  setDocumentos: React.Dispatch<React.SetStateAction<DocumentoVencimento[]>>;
  onUpdateStatus: (id: string, status: 'Feito' | 'Em Andamento', alertHandled?: boolean) => void;
}

const Vencimentos: React.FC<VencimentosProps> = ({ documentos, setDocumentos, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: 'Caixa d\'água',
    dataVencimento: '',
    status: 'Em Andamento' as 'Feito' | 'Em Andamento'
  });

  const categorias = useMemo(() => [
    'Caixa d\'água',
    'Dedetização',
    'Incêndio',
    'Licença Ambiental'
  ].sort((a, b) => a.localeCompare(b)), []);

  const docsEmAndamento = useMemo(() => 
    documentos.filter(d => d.status === 'Em Andamento').sort((a, b) => a.titulo.localeCompare(b.titulo))
  , [documentos]);

  const docsFeitos = useMemo(() => 
    documentos.filter(d => d.status === 'Feito').sort((a, b) => a.titulo.localeCompare(b.titulo))
  , [documentos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novoDoc: DocumentoVencimento = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      visto: false
    };
    setDocumentos([...documentos, novoDoc]);
    setShowForm(false);
    setFormData({ titulo: categorias[0], dataVencimento: '', status: 'Em Andamento' });
  };

  const getStatusBadgeStyle = (status: 'Feito' | 'Em Andamento') => {
    switch (status) {
      case 'Feito': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Em Andamento': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getAtencaoColor = (doc: DocumentoVencimento, diffDays: number) => {
    // Se o status for 'Feito', a atenção deve ser sempre verde (Conforme)
    if (doc.status === 'Feito') return 'text-emerald-500';

    const threshold = doc.titulo.toLowerCase().includes('incêndio') ? 30 : 15;
    
    if (diffDays < 0 || diffDays <= 5) return 'text-red-500'; // Vermelho: Vencido ou < 5 dias
    if (diffDays <= threshold) return 'text-amber-500';      // Amarelo: Dentro da fase de lembrete (15 ou 30)
    return 'text-emerald-500';                               // Verde: Dentro do prazo (seguro)
  };

  const selectClass = "w-full px-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat transition-all";

  const renderTable = (list: DocumentoVencimento[], title: string, icon: string, emptyMsg: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
        <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</h4>
        <span className="ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{list.length}</span>
      </div>
      <div className="bg-white dark:bg-[#1d222a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atenção</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {list.map((doc) => {
              const expirationDate = new Date(doc.dataVencimento);
              const hoje = new Date();
              hoje.setHours(0,0,0,0);
              const diffDays = Math.ceil((expirationDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{doc.titulo}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {new Date(doc.dataVencimento).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full shrink-0 ${getAtencaoColor(doc, diffDays).replace('text-', 'bg-')}`} />
                      <span className={`text-sm font-bold ${getAtencaoColor(doc, diffDays)}`}>
                        {doc.status === 'Feito' 
                          ? 'Conforme' 
                          : diffDays < 0 ? `Vencido há ${Math.abs(diffDays)}d` : diffDays === 1 ? 'Vence amanhã!' : `Faltam ${diffDays} dias`
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => onUpdateStatus(doc.id, doc.status === 'Feito' ? 'Em Andamento' : 'Feito', false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all hover:scale-105 active:scale-95 ${getStatusBadgeStyle(doc.status)}`}
                    >
                      {doc.status}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setDocumentos(documentos.filter(d => d.id !== doc.id))}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{emptyMsg}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 transition-colors duration-300 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Conformidade</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Controle rigoroso de renovações obrigatórias</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
            showForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white' : 'bg-primary text-white shadow-primary/20'
          }`}
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add_task'}</span>
          {showForm ? 'Cancelar' : 'Nova Obrigação'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-primary/20 shadow-xl space-y-4 transition-colors animate-in slide-in-from-top-4 duration-300 max-w-2xl">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Registrar Nova Obrigação</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Categoria</label>
              <select 
                required 
                className={selectClass}
                value={formData.titulo}
                onChange={e => setFormData({...formData, titulo: e.target.value})}
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Data de Vencimento</label>
              <input 
                required 
                type="date" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm"
                value={formData.dataVencimento}
                onChange={e => setFormData({...formData, dataVencimento: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                Salvar Registro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEÇÃO 1: EM ANDAMENTO */}
      {renderTable(
        docsEmAndamento, 
        "Obrigações em Andamento", 
        "pending_actions", 
        "Nenhuma pendência para hoje"
      )}

      {/* SEÇÃO 2: FEITOS */}
      {renderTable(
        docsFeitos, 
        "Obrigações Concluídas", 
        "task_alt", 
        "Nenhum documento concluído no histórico"
      )}
    </div>
  );
};

export default Vencimentos;
