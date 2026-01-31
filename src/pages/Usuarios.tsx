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
    role: 'sala', // Changed from morador to match UserRole 'sala'
    sala_numero: '0000'
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
            name: formData.name,
            role: formData.role,
            sala_numero: formData.sala_numero,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário via Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role,
              sala_numero: formData.sala_numero
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (authError) throw authError;

        // O perfil será criado via Trigger no Supabase, 
        // mas garantimos que a lista atualize ou damos feedback se o e-mail foi enviado
        setSuccess('Usuário convidado! Um e-mail de confirmação foi enviado.');
      }

      // Resetar formulário e recarregar lista
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'sala',
        sala_numero: '0000'
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
      name: user.name || '',
      role: user.role || 'sala',
      sala_numero: user.sala_numero || '0000'
    });
    setShowModal(true);
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
    const styles = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      atendente: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      sala: 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    const labels = {
      admin: 'Admin',
      atendente: 'Atendente',
      sala: 'Morador'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Gerencie todos os usuários do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              password: '',
              name: '',
              role: 'sala',
              sala_numero: '0000'
            });
            setShowModal(true);
          }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
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
        <div className="bg-white dark:bg-[#1d222a] rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Perfil</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Apartamento</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{user.name || 'Sem nome'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email || 'Sem email'}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.sala_numero || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      disabled={user.id === currentUser.id}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-2xl shadow-2xl max-w-md w-full p-8">
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
                  <option value="sala">Morador</option>
                  <option value="atendente">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.role === 'sala' && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Número do Apartamento</label>
                  <input
                    type="text"
                    required
                    value={formData.sala_numero}
                    onChange={(e) => setFormData({ ...formData, sala_numero: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    placeholder="101"
                  />
                </div>
              )}

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
