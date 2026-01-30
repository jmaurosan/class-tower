
import React, { useState, useMemo } from 'react';
import { Vistoria } from '../types';

interface ModalNovoRegistroProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ModalNovoRegistro: React.FC<ModalNovoRegistroProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const selectClass = "w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat transition-all";

  const [areas, setAreas] = useState(['Elétrica', 'Hidráulica', 'Estrutural', 'HVAC', 'Segurança']);
  const [isManagingAreas, setIsManagingAreas] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  
  const unidadesOptions = useMemo(() => {
    const andares = Array.from({ length: 17 }, (_, i) => `${i + 1}º Andar`);
    const locais = ['Algibre', 'Estacionamento', 'Jardim', 'Recepção', 'Subsolo 1', 'Subsolo 2', 'Subsolo 3', 'Terraço'];
    return [...andares, ...locais];
  }, []);

  const [formData, setFormData] = useState<Omit<Vistoria, 'id' | 'data'>>({
    unidade: unidadesOptions[0],
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    local: '',
    area: 'Elétrica',
    tecnico: '',
    urgencia: 'Média',
    status: 'Pendente',
    descricao: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    onClose();
  };

  const urgenciaOptions: Vistoria['urgencia'][] = ['Baixa', 'Média', 'Alta'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-[#1d222a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Novo Registro de Vistoria</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
              <select 
                required
                className={selectClass}
                value={formData.unidade}
                onChange={e => setFormData({...formData, unidade: e.target.value})}
              >
                {unidadesOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Horário</label>
              <input 
                required
                type="time"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                value={formData.hora}
                onChange={e => setFormData({...formData, hora: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Local</label>
            <input 
              required
              type="text"
              placeholder="Ex: Sala de máquinas, Hall A..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
              value={formData.local}
              onChange={e => setFormData({...formData, local: e.target.value})}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Área de Atuação</label>
              <button 
                type="button" 
                onClick={() => setIsManagingAreas(!isManagingAreas)}
                className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded transition-colors ${isManagingAreas ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                {isManagingAreas ? 'Concluir' : 'Gerenciar'}
              </button>
            </div>

            {isManagingAreas ? (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nova área..." 
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-primary"
                    value={newAreaInput}
                    onChange={e => setNewAreaInput(e.target.value)}
                  />
                  <button type="button" onClick={() => { if(newAreaInput.trim()) setAreas([...areas, newAreaInput.trim()]); setNewAreaInput(''); }} className="p-2 bg-primary text-white rounded-lg"><span className="material-symbols-outlined text-sm">add</span></button>
                </div>
              </div>
            ) : (
              <select 
                className={selectClass}
                value={formData.area}
                onChange={e => setFormData({...formData, area: e.target.value})}
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nível de Urgência</label>
            <div className="flex gap-2">
              {urgenciaOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormData({...formData, urgencia: opt})}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    formData.urgencia === opt 
                    ? opt === 'Alta' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' :
                      opt === 'Média' ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' :
                      'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição dos Problemas</label>
            <textarea 
              rows={3}
              placeholder="Relate as irregularidades..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all resize-none"
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Técnico</label>
              <input 
                required
                type="text"
                placeholder="Nome"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                value={formData.tecnico}
                onChange={e => setFormData({...formData, tecnico: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <select 
                className={selectClass}
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option>Pendente</option>
                <option>Em Andamento</option>
                <option>Concluído</option>
              </select>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1d222a] shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm">Cancelar</button>
            <button onClick={handleSubmit} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNovoRegistro;
