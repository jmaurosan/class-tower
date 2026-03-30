import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import { Empresa, User } from '../types';

interface EmpresasProps {
  user: User;
}

const PrestadoresServico: React.FC<EmpresasProps> = ({ user }) => {
  const { showToast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>('PJ');
  const [novoSetorInput, setNovoSetorInput] = useState('');
  const [isAddingNewSetor, setIsAddingNewSetor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const SETORES_PADRAO = ['Limpeza', 'Elétrica', 'Hidráulica', 'Segurança', 'Elevadores'];
  const [setores, setSetores] = useState<string[]>([...SETORES_PADRAO]);

  // Rating States
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');

  const handleOpenRating = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setUserRating(0);
    setUserComment('');
    setRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!selectedEmpresa || userRating === 0) return;

    try {
      const { error } = await supabase.from('avaliacoes_empresas').upsert({
        empresa_id: selectedEmpresa.id,
        user_id: user.id,
        rating: userRating,
        comentario: userComment
      });

      if (error) throw error;
      setRatingModalOpen(false);
      fetchEmpresas(); // Recarregar média
      showToast('Avaliação enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao avaliar:', error);
      showToast(error.message || 'Erro ao enviar avaliação.', 'error');
    }
  };

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    setor: 'Limpeza',
    contato: '',
    telefone: '',
    email: ''
  });

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) {
        setEmpresas(data);
        // Extrair setores personalizados dos dados existentes
        const setoresExistentes = new Set(data.map((e: Empresa) => e.setor).filter(Boolean));
        const todosSetores = new Set([...SETORES_PADRAO, ...setoresExistentes]);
        setSetores(Array.from(todosSetores).sort());
      }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => {
        fetchEmpresas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEmpresas = React.useMemo(() => {
    if (!searchTerm.trim()) return empresas;
    const term = searchTerm.toLowerCase();
    return empresas.filter(e =>
      e.nome?.toLowerCase().includes(term) ||
      e.setor?.toLowerCase().includes(term) ||
      e.contato?.toLowerCase().includes(term) ||
      e.email?.toLowerCase().includes(term) ||
      e.cnpj?.toLowerCase().includes(term) ||
      e.telefone?.includes(term)
    );
  }, [empresas, searchTerm]);

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
      finalSetor = novoSetorInput.trim();
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('empresas')
          .update({
            ...formData,
            cnpj: tipoPessoa === 'PJ' ? formData.cnpj : null,
            setor: finalSetor
          })
          .eq('id', editingId);

        if (error) throw error;
        showToast('Prestador atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert([{
            ...formData,
            cnpj: tipoPessoa === 'PJ' ? formData.cnpj : null,
            setor: finalSetor,
            status: 'Em Revisão',
            rating: 0,
            sala_id: user.sala_numero
          }]);

        if (error) throw error;
        showToast('Prestador cadastrado com sucesso!');
      }

      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error('Erro ao salvar prestador:', err);
      showToast(err.message || 'Erro ao salvar no banco de dados.', 'error');
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingId(empresa.id);

    // Verificar se o setor atual é um setor personalizado (não está na lista padrão)
    const setorAtual = empresa.setor || '';
    const isCustomSetor = setorAtual && !SETORES_PADRAO.includes(setorAtual) && !setores.includes(setorAtual);

    setFormData({
      nome: empresa.nome,
      cnpj: empresa.cnpj || '',
      setor: isCustomSetor ? SETORES_PADRAO[0] : setorAtual,
      contato: empresa.contato,
      telefone: empresa.telefone,
      email: empresa.email
    });

    if (isCustomSetor) {
      setIsAddingNewSetor(true);
      setNovoSetorInput(setorAtual);
    } else {
      setIsAddingNewSetor(false);
      setNovoSetorInput('');
    }

    setTipoPessoa(empresa.cnpj ? 'PJ' : 'PF');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este prestador permanentemente?')) return;
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Prestador excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      showToast(err.message || 'Erro ao excluir do banco de dados.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      setor: SETORES_PADRAO[0],
      contato: '',
      telefone: '',
      email: ''
    });
    setNovoSetorInput('');
    setIsAddingNewSetor(false);
    setTipoPessoa('PJ');
    setEditingId(null);
  };

  const isAdmin = user.role === 'admin';
  const isAtendente = user.role === 'atendente';
  const canManage = isAdmin || isAtendente;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {canManage && (
        <button
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm ${showForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white' : 'bg-primary text-white shadow-primary/20'
            }`}
        >
          <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'person_add'}</span>
          {showForm ? 'Cancelar' : 'Novo Prestador'}
        </button>
      )}

      {showForm && (
        <div className="bg-white dark:bg-[#1d222a] p-5 md:p-8 rounded-2xl border border-primary/20 shadow-2xl animate-in slide-in-from-top duration-300">
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
              {tipoPessoa === 'PJ' && (
                <div className="space-y-1 animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ</label>
                  <input required name="cnpj" value={formData.cnpj} onChange={handleInputChange} type="text" placeholder="00.000.000/0000-00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                </div>
              )}
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
              <button type="submit" className="w-full md:w-auto px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm">
                {editingId ? 'Salvar Alterações' : 'Salvar Cadastro de Prestador'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#1d222a] p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input
            type="text"
            placeholder="Pesquisar por nome, setor, contato, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredEmpresas.length} {filteredEmpresas.length === 1 ? 'resultado' : 'resultados'}
          </p>
        )}
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(empresa); }}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(empresa.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate" title={empresa.nome}>{empresa.nome}</h4>
                {empresa.cnpj && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{empresa.cnpj}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={"material-symbols-outlined text-base text-primary"}>{getIconSetor(empresa.setor)}</span>
                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {empresa.setor || 'Sem setor'}
                </span>
              </div>

              <div
                className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); handleOpenRating(empresa); }}
                title="Clique para avaliar"
              >
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-sm ${i < (empresa.average_rating || empresa.rating || 0) ? 'text-amber-400 fill-1' : 'text-slate-200 dark:text-slate-700'}`}>star</span>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-400">
                  ({empresa.average_rating || empresa.rating || 0})
                  {empresa.ratings_count ? ` • ${empresa.ratings_count} avaliações` : ''}
                </span>
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

      {ratingModalOpen && selectedEmpresa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRatingModalOpen(false)}>
          <div className="bg-white dark:bg-[#1d222a] p-5 md:p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Avaliar Prestador</h3>
              <p className="text-sm text-slate-500 font-medium">{selectedEmpresa.nome}</p>
            </div>

            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={`material-symbols-outlined text-4xl ${star <= userRating ? 'text-amber-400 fill-1' : 'text-slate-200 dark:text-slate-700'}`}>star</span>
                </button>
              ))}
            </div>

            <textarea
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none text-sm"
              rows={3}
              placeholder="Conte sua experiência com este prestador (opcional)..."
              value={userComment}
              onChange={e => setUserComment(e.target.value)}
            />

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setRatingModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
              <button
                onClick={submitRating}
                disabled={userRating === 0}
                className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Enviar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestadoresServico;
