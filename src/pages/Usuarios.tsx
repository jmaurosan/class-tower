import React, { useEffect, useState } from 'react';
import PasswordChecklist from '../components/ui/PasswordChecklist';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { isPasswordValid } from '../utils/validators';
import { useToast } from '../context/ToastContext';

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

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    dashboard: true,
    avisos: true,
    encomendas: true,
    vistorias: true,
    diario: true,
    documentos: true,
    salas: true,
    empresas: true
  },
  atendente: {
    dashboard: true,
    encomendas: true,
    diario: true,
    salas: true,
    avisos: true,
    empresas: true
  },
  sala: {
    encomendas: true,
    avisos: true,
    documentos: true,
    empresas: true
  }
};

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
    permissions: DEFAULT_PERMISSIONS.sala
  });
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senha apenas na criação
    if (!editingUser && !isPasswordValid(formData.password)) {
      showToast('A senha não atende aos requisitos de segurança.', 'error');
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
        showToast('Usuário atualizado com sucesso!');
      } else {
        // Cria usuário via Edge Function - functions.invoke() injeta o token automaticamente
        const sanitizedEmail = formData.email.trim().toLowerCase();
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
          body: {
            email: sanitizedEmail,
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
        showToast('Usuário criado com sucesso!');
      }

      // Resetar formulário e recarregar lista
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'sala',
        sala_numero: '0000',
        permissions: DEFAULT_PERMISSIONS.sala
      });
      setShowModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      showToast(err.message || 'Erro ao salvar usuário', 'error');
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
    // Por enquanto vamos manter o confirm simples aqui ou sugerir que o usuário use o botão de edit
    // Para ser consistente com o report, vamos apenas garantir que a deleção está perfeita.
    // Mas o usuário pediu para tirar Diálogos Nativos. Vou trocar.
    if (!window.confirm(`Deseja realmente ${newStatus === 'Bloqueado' ? 'Bloquear' : 'Desbloquear'} este usuário?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      showToast(`Usuário ${newStatus === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao alternar status:', err);
      showToast('Erro ao alterar status do usuário', 'error');
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !deleteReason.trim()) return;

    try {
      setIsDeleting(true);

      // 1. Buscar dados do usuário antes de deletar para log
      const { data: oldUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToDelete)
        .single();

      if (fetchError) throw fetchError;

      // 2. Deletar o usuário através da Edge Function (Auth + Database)
      const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete }
      });

      if (fnError) throw new Error(fnError.message || 'Erro ao excluir usuário no servidor');
      if (fnData?.error) throw new Error(fnData.error);

      // 3. Registrar Log de Auditoria
      const { error: logError } = await supabase.from('audit_logs').insert({
        action: 'DELETE',
        table_name: 'profiles',
        record_id: userToDelete,
        executed_by: currentUser.id,
        executed_by_name: currentUser.name,
        old_data: oldUser,
        new_data: { reason: deleteReason }
      });

      if (logError) console.error('Erro ao registrar log de auditoria:', logError);
      showToast('Usuário excluído com sucesso!');
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      showToast(err.message || 'Erro ao excluir usuário', 'error');
    } finally {
      setIsDeleting(false);
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

  const filteredUsers = users.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.sala_numero || '').toLowerCase().includes(searchLower) ||
      (u.role || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              password: '',
              name: '',
              role: 'sala',
              sala_numero: '0000',
              permissions: DEFAULT_PERMISSIONS.sala
            });
            setShowModal(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Novo Usuário
        </button>

        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
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
                      onClick={() => handleDeleteClick(user.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      disabled={user.id === currentUser.id}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#1d222a] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">person_search</span>
              <p className="text-slate-500 text-sm">Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-2xl shadow-2xl max-w-md w-full p-5 md:p-8 max-h-[90vh] overflow-y-auto">
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

              {/* Campos de Login (E-mail e Senha) - Escondidos para perfil 'sala' em novo cadastro */}
              {formData.role === 'sala' && !editingUser ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-xl">info</span>
                    <span className="text-sm font-bold">Fluxo de Primeiro Acesso</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Usuários do tipo <strong>Unidade Comercial</strong> realizam seu próprio cadastro através da tela de <strong>"Primeiro Acesso"</strong> no login.
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    * Certifique-se de que a Unidade e os Responsáveis já estejam cadastrados no menu <strong>Salas</strong>.
                  </p>
                </div>
              ) : (
                <>
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
                  {editingUser && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Email do Usuário</label>
                      <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">O e-mail não pode ser alterado após o cadastro.</p>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Perfil de Acesso</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      // Só aplica padrões automaticamente na criação de novo usuário
                      permissions: !editingUser ? DEFAULT_PERMISSIONS[newRole] || {} : formData.permissions
                    });
                  }}
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
                  disabled={formData.role === 'sala' && !editingUser}
                  className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all ${
                    formData.role === 'sala' && !editingUser 
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-primary text-white hover:scale-105'
                  }`}
                >
                  {editingUser ? 'Atualizar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-[#1d222a] rounded-[24px] shadow-2xl max-w-sm w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Excluir Usuário?</h3>
              <p className="text-slate-500 text-sm mt-2">Esta ação é irreversível e será registrada em log.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo da Exclusão *</label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ex: Usuário mudou do condomínio"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white text-sm min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!deleteReason.trim() || isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
