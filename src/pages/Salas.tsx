import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { Sala, User } from '../types';

interface SalasProps {
  user: User;
}

const Salas: React.FC<SalasProps> = ({ user }) => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAndar, setSelectedAndar] = useState<number>(1);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);

  const fetchSalas = async () => {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*');

      if (error) throw error;
      if (data) setSalas(data);
    } catch (err) {
      console.error('Erro ao buscar salas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalas();

    const channel = supabase
      .channel('salas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salas' }, () => {
        fetchSalas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentFloorRooms = useMemo(() => {
    const rooms = [];

    if (selectedAndar === 0) {
      // Unidades especiais do Térreo
      const terreoRooms = ['T01', 'CO2'];
      for (const numero of terreoRooms) {
        const existing = salas.find(s => s.numero === numero);
        rooms.push(existing || {
          id: numero,
          numero: numero,
          andar: 0,
          nome: '',
          responsavel1: '',
          telefone1: '',
          responsavel2: '',
          telefone2: ''
        });
      }
    } else {
      const limit = (selectedAndar === 16 || selectedAndar === 17) ? 3 : 6;
      for (let i = 1; i <= limit; i++) {
        const roomNum = selectedAndar * 100 + i;
        const numeroStr = roomNum.toString().padStart(4, '0');
        const existing = salas.find(s => s.numero === numeroStr);
        rooms.push(existing || {
          id: numeroStr,
          numero: numeroStr,
          andar: selectedAndar,
          nome: '',
          responsavel1: '',
          telefone1: '',
          responsavel2: '',
          telefone2: ''
        });
      }
    }
    return rooms;
  }, [selectedAndar, salas]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleSaveSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSala) return;

    try {
      // Upsert sala data
      const { error } = await supabase
        .from('salas')
        .upsert({
          id: editingSala.id,
          numero: editingSala.numero,
          andar: editingSala.andar,
          nome: editingSala.nome,
          responsavel1: editingSala.responsavel1,
          telefone1: editingSala.telefone1,
          responsavel2: editingSala.responsavel2,
          telefone2: editingSala.telefone2
        });

      if (error) throw error;
      setEditingSala(null);
      fetchSalas();

      // Auditoria manual
      await supabase.from('audit_logs').insert([{
        table_name: 'salas',
        record_id: editingSala.numero,
        action: 'UPDATE',
        executed_by: user.id,
        executed_by_name: user.name,
        new_data: editingSala
      }]);

    } catch (err) {
      console.error('Erro ao salvar sala:', err);
      alert('Erro ao salvar dados no banco.');
    }
  };

  const handleDeleteSala = async (numero: string) => {
    try {
      setIsDeleting(true);
      // Na verdade, no modelo de salas, "excluir" significa limpar os dados da unidade para ela ficar "Vaga"
      const { error } = await supabase
        .from('salas')
        .delete()
        .eq('numero', numero);

      if (error) throw error;

      // Auditoria
      await supabase.from('audit_logs').insert([{
        table_name: 'salas',
        record_id: numero,
        action: 'DELETE',
        executed_by: user.id,
        executed_by_name: user.name,
        old_data: salas.find(s => s.numero === numero)
      }]);

      setShowDeleteConfirm(null);
      fetchSalas();
    } catch (err) {
      console.error('Erro ao excluir sala:', err);
      alert('Erro ao remover dados da unidade.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Seletor de andar em card */}
      <div className="bg-white dark:bg-[#1d222a] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
          {Array.from({ length: 18 }, (_, i) => i).map((andar) => (
            <button
              key={andar}
              onClick={() => setSelectedAndar(andar)}
              className={`px-2 py-2.5 rounded-lg text-xs font-bold transition-all border text-center ${selectedAndar === andar
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
            >
              {andar === 0 ? 'T' : `${andar}°A`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 bg-white dark:bg-[#1d222a] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="material-symbols-outlined text-primary text-lg">info</span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {selectedAndar === 0 ? 'Térreo' : `${selectedAndar}º Andar`} · {selectedAndar === 0 ? '2 Unidades' : (selectedAndar === 16 || selectedAndar === 17) ? '3 Salas' : '6 Salas'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFloorRooms.map((sala) => (
            <div
              key={sala.numero}
              className={`group bg-white dark:bg-[#1d222a] rounded-[24px] border transition-all duration-300 relative p-6 ${sala.nome ? 'border-primary/20 shadow-sm' : 'border-slate-200 dark:border-slate-800 border-dashed opacity-80'
                } hover:shadow-xl hover:scale-[1.02]`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="text-lg font-black">{sala.numero}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingSala(sala)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    title="Editar Unidade"
                  >
                    <span className="material-symbols-outlined text-xl">edit_square</span>
                  </button>
                  {sala.nome && (
                    <button
                      onClick={() => setShowDeleteConfirm(sala.numero)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir / Limpar Unidade"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa / Nome</p>
                  <p className={`text-sm font-bold truncate ${sala.nome ? 'text-slate-900 dark:text-white' : 'text-slate-300 italic'}`}>
                    {sala.nome || 'Vago'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável 1</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                      <p className={`text-xs font-bold truncate ${sala.responsavel1 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 italic'}`}>
                        {sala.responsavel1 || 'Não informado'}
                      </p>
                    </div>
                    {sala.telefone1 && (
                      <p className="text-[10px] text-slate-500 ml-5 font-medium">{sala.telefone1}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável 2</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                      <p className={`text-xs font-bold truncate ${sala.responsavel2 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 italic'}`}>
                        {sala.responsavel2 || 'Não informado'}
                      </p>
                    </div>
                    {sala.telefone2 && (
                      <p className="text-[10px] text-slate-500 ml-5 font-medium">{sala.telefone2}</p>
                    )}
                  </div>
                </div>
              </div>

              {sala.nome && (
                <div className="absolute top-4 right-12">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-500">lightbulb</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Estrutura das Unidades</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              Os andares 16 e 17 possuem 3 unidades exclusivas de maior metragem. Os demais andares seguem o padrão de 6 unidades por pavimento.
            </p>
          </div>
        </div>
      </div>

      {editingSala && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1d222a] w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-lg font-black">{editingSala.numero}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">Editar Unidade</h4>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{selectedAndar === 0 ? 'Térreo' : `${selectedAndar}º Andar`}</p>
                  </div>
                </div>
                <button onClick={() => setEditingSala(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveSala} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome / Razão Social</label>
                  <input
                    required
                    autoFocus
                    type="text"
                    placeholder="Ex: Sicredi, Tech Lab, etc."
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                    value={editingSala.nome}
                    onChange={e => setEditingSala({ ...editingSala, nome: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável 1</label>
                    <input
                      required
                      type="text"
                      placeholder="Nome"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                      value={editingSala.responsavel1}
                      onChange={e => setEditingSala({ ...editingSala, responsavel1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 1</label>
                    <input
                      type="text"
                      placeholder="(00) 0000-0000"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                      value={editingSala.telefone1}
                      onChange={e => setEditingSala({ ...editingSala, telefone1: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável 2</label>
                    <input
                      type="text"
                      placeholder="Nome"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                      value={editingSala.responsavel2}
                      onChange={e => setEditingSala({ ...editingSala, responsavel2: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone 2</label>
                    <input
                      type="text"
                      placeholder="(00) 0000-0000"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm font-medium"
                      value={editingSala.telefone2}
                      onChange={e => setEditingSala({ ...editingSala, telefone2: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSala(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Salvar Dados
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1d222a] w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center space-y-4">
              <div className="size-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Limpar Unidade?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Isso removerá todos os dados do locatário da sala <span className="font-bold text-slate-900 dark:text-white">{showDeleteConfirm}</span>. A unidade voltará ao estado vago.
              </p>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteSala(showDeleteConfirm)}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  {isDeleting ? 'Limpando...' : 'Confirmar Exclusão'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salas;
