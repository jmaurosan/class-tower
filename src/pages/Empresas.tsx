import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Empresa, User } from '../types';

interface EmpresasProps {
  user: User;
}

const PrestadoresServico: React.FC<EmpresasProps> = ({ user }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterSetor, setFilterSetor] = useState<string>('Todos');
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>('PJ');
  const [novoSetorInput, setNovoSetorInput] = useState('');
  const [isAddingNewSetor, setIsAddingNewSetor] = useState(false);

  const [setores, setSetores] = useState<string[]>(['Limpeza', 'Elétrica', 'Hidráulica', 'Segurança', 'Elevadores', 'Outros']);

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    setor: 'Outros' as Empresa['setor'],
    contato: '',
    telefone: '',
    email: ''
  });

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setEmpresas(data);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();

    const channel = supabase
      .channel('prestadores_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestadores' }, () => {
        fetchEmpresas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEmpresas = filterSetor === 'Todos'
    ? empresas
    : empresas.filter(e => e.setor === filterSetor);

  const getStatusColor = (status: Empresa['status']) => {
    switch (status) {
      case 'Homologada': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Em Revisão': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Inativa': return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
  };

  const getIconSetor = (setor: string) => {
    switch (setor) {
      case 'Limpeza': return 'cleaning_services';
      case 'Elétrica': return 'bolt';
      case 'Hidráulica': return 'water_drop';
      case 'Segurança': return 'security';
      case 'Elevadores': return 'unfold_more';
      default: return 'business_center';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSetor = formData.setor;
    if (isAddingNewSetor && novoSetorInput.trim()) {
      finalSetor = novoSetorInput.trim() as any;
    }

    try {
      const { error } = await supabase
        .from('prestadores')
        .insert([{
          ...formData,
          setor: finalSetor,
          status: 'Em Revisão',
          rating: 0
        }]);

      if (error) throw error;
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar prestador:', err);
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este prestador permanentemente?')) return;
    try {
      const { error } = await supabase
        .from('prestadores')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir do banco de dados.');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      setor: 'Outros',
      contato: '',
      telefone: '',
      email: ''
    });
    setNovoSetorInput('');
    setIsAddingNewSetor(false);
    setTipoPessoa('PJ');
  };

  const isAdmin = user.role === 'admin';
  const isAtendente = user.role === 'atendente';
  const canManage = isAdmin || isAtendente;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Prestadores de Serviço</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Catálogo de fornecedores e parceiros homologados</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${showForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white' : 'bg-primary text-white shadow-primary/20'
              }`}
          >
            <span className="material-symbols-outlined">{showForm ? 'close' : 'person_add'}</span>
            {showForm ? 'Cancelar' : 'Novo Prestador'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1d222a] p-8 rounded-2xl border border-primary/20 shadow-2xl animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setTipoPessoa('PJ')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tipoPessoa === 'PJ' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
              >
                Pessoa Jurídica
              </button>
              <button
                type="button"
                onClick={() => setTipoPessoa('PF')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tipoPessoa === 'PF' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
              >
                Pessoa Física
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome / Razão Social</label>
                <input required name="nome" value={formData.nome} onChange={handleInputChange} type="text" placeholder={tipoPessoa === 'PJ' ? "Ex: Master Elevadores LTDA" : "Ex: João da Silva"} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                <input required name="cnpj" value={formData.cnpj} onChange={handleInputChange} type="text" placeholder={tipoPessoa === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setor / Especialidade</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSetor(!isAddingNewSetor)}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    {isAddingNewSetor ? 'Ver Lista' : '+ Novo Setor'}
                  </button>
                </div>
                {isAddingNewSetor ? (
                  <input
                    required
                    type="text"
                    placeholder="Digite o novo setor..."
                    value={novoSetorInput}
                    onChange={(e) => setNovoSetorInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-primary/30 dark:border-primary/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                ) : (
                  <select name="setor" value={formData.setor} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white">
                    {setores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável / Contato</label>
                <input required name="contato" value={formData.contato} onChange={handleInputChange} type="text" placeholder="Nome do representante" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                <input required name="telefone" value={formData.telefone} onChange={handleInputChange} type="tel" placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="contato@servico.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                Salvar Cadastro de Prestador
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['Todos', ...setores].map(setor => (
          <button
            key={setor}
            onClick={() => setFilterSetor(setor)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${filterSetor === setor
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50'
              }`}
          >
            {setor}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmpresas.map((empresa) => (
          <div key={empresa.id} className="group bg-white dark:bg-[#1d222a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="h-24 bg-slate-50 dark:bg-slate-900/50 p-6 flex justify-between items-start border-b border-slate-100 dark:border-slate-800 relative">
              <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">{getIconSetor(empresa.setor)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-tighter ${getStatusColor(empresa.status)}`}>
                  {empresa.status}
                </span>
                {canManage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(empresa.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate" title={empresa.nome}>{empresa.nome}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{empresa.cnpj}</p>
              </div>

              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-sm ${i < (empresa.rating || 0) ? 'text-amber-400 fill-1' : 'text-slate-200 dark:text-slate-700'}`}>star</span>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-400">({empresa.rating || 0}.0)</span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg">person</span>
                  <span className="text-sm font-medium">{empresa.contato}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg">call</span>
                  <span className="text-sm font-medium">{empresa.telefone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  <span className="text-sm font-medium truncate">{empresa.email}</span>
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-2">
                <a href={`tel:${empresa.telefone}`} className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all">
                  Ligar
                </a>
                <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all">
                  Contratos
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmpresas.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-[#1d222a] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">domain_disabled</span>
          <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum prestador encontrado</p>
        </div>
      )}
    </div>
  );
};

export default PrestadoresServico;
