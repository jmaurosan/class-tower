import React, { useEffect, useState } from 'react';
import PasswordChecklist from '../components/ui/PasswordChecklist';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { isPasswordValid } from '../utils/validators';

interface UsuariosProps {
  currentUser: User;
}

interface UserForm {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'atendente' | 'sala';
  sala_numero: string;
  permissions: Record<string, boolean>;
}

const Usuarios: React.FC<UsuariosProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<UserForm>({
    email: '',
    password: '',
    name: '',
    role: 'sala',
    sala_numero: '0000',
    permissions: {}
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carregar usuários
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar senha apenas na criação
    if (!editingUser && !isPasswordValid(formData.password)) {
      setError('A senha não atende aos requisitos de segurança.');
      return;
    }

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            role: formData.role,
            sala_numero: formData.sala_numero,
            permissions: formData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        // Cria usuário via Edge Function - functions.invoke() injeta o token automaticamente
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            sala_numero: formData.sala_numero,
            permissions: formData.permissions
          }
        });

        if (fnError) {
          throw new Error(fnError.message || 'Erro ao criar usuário');
        }

        if (fnData?.error) {
          throw new Error(fnData.error);
        }

        setSuccess('Usuário criado com sucesso! O acesso está disponível imediatamente.');
      }

      // Resetar formulário e recarregar lista
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'sala',
        sala_numero: '0000',
        permissions: {}
      });
      setShowModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      password: '',
      name: user.full_name || '',
      role: user.role || 'sala',
      sala_numero: user.sala_numero || '',
      permissions: user.permissions || {}
    });
    setShowModal(true);
  };

  const toggleBlockStatus = async (user: any) => {
    const newStatus = user.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado';
    if (!confirm(`Deseja realmente ${newStatus === 'Bloqueado' ? 'Bloquear' : 'Desbloquear'} este usuário?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      setSuccess(`Usuário ${newStatus === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao alternar status:', err);
      setError('Erro ao alterar status do usuário');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      // Deletar perfil (o usuário auth será deletado via cascade ou manualmente)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setSuccess('Usuário excluído com sucesso!');
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError('Erro ao excluir usuário');
    }
  };

  const getRoleBadge = (role: string) => {
    const lowerRole = (role || '').toLowerCase();
    let normalizedRole = 'sala';

    if (lowerRole.includes('admin')) normalizedRole = 'admin';
    else if (lowerRole.includes('atendente') || lowerRole.includes('colaborador')) normalizedRole = 'atendente';

    const labels = {
      admin: 'Admin',
      atendente: 'Atendente',
      sala: 'Unidade Comercial'
    };

    const colors = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      atendente: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      sala: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colors[normalizedRole as keyof typeof colors]}`}>
        {labels[normalizedRole as keyof typeof labels]}
      </span>
    );
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cadastro de Usuários</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setError('');
            setSuccess('');
            setFormData({
              email: '',
              password: '',
              name: '',
              role: 'sala',
              sala_numero: '0000',
              permissions: {}
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 bg-primary text-white font-bold rounded-xl text-xs md:text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-lg md:text-xl">add</span>
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white dark:bg-[#1d222a] p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white truncate">{user.full_name || 'Sem nome'}</h4>
                    {getRoleBadge(user.role)}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${user.status === 'Bloqueado' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {user.status || 'Ativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email || 'Sem email'}</p>
                  {user.sala_numero && <p className="text-[10px] text-slate-400 mt-0.5">Unidade: {user.sala_numero}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleBlockStatus(user)}
                    className={`p-1.5 ${user.status === 'Bloqueado' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-500/10'} rounded-lg transition-colors`}
                    title={user.status === 'Bloqueado' ? 'Desbloquear' : 'Bloquear'}
                    disabled={user.id === currentUser.id}
                  >
                    <span className="material-symbols-outlined text-base">{user.status === 'Bloqueado' ? 'lock_open' : 'lock'}</span>
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    disabled={user.id === currentUser.id}
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                  placeholder="João da Silva"
                />
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      placeholder="usuario@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Senha Inicial</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <PasswordChecklist password={formData.password} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Perfil de Acesso</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                >
                  <option value="sala">Unidade Comercial</option>
                  <option value="atendente">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.role === 'sala' && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Número da Unidade / Sala</label>
                  <input
                    type="text"
                    required
                    value={formData.sala_numero}
                    onChange={(e) => setFormData({ ...formData, sala_numero: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    placeholder="Ex: 101 ou Sala 502"
                  />
                </div>
              )}

              {/* Seção de Permissões */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-black text-slate-400 uppercase mb-4">Permissões de Acesso (Menu)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'avisos', label: 'Avisos' },
                    { id: 'encomendas', label: 'Encomendas' },
                    { id: 'vistorias', label: 'Vistorias' },
                    { id: 'diario', label: 'Ocorrências' },
                    { id: 'documentos', label: 'Documentos' },
                    { id: 'salas', label: 'Salas' },
                    { id: 'empresas', label: 'Prestadores' }
                  ].map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions[mod.id] ?? false}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, [mod.id]: e.target.checked }
                          })}
                          className="peer appearance-none size-5 rounded-md border border-slate-200 dark:border-slate-700 checked:bg-primary checked:border-primary transition-all"
                        />
                        <span className="material-symbols-outlined absolute text-white text-sm scale-0 peer-checked:scale-100 transition-transform pointer-events-none">check</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:scale-105 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-all"
                >
                  {editingUser ? 'Atualizar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
