
import React, { useState } from 'react';
import PasswordChecklist from '../components/ui/PasswordChecklist';
import { supabase } from '../services/supabase';
import { User, UserRole } from '../types';
import { isPasswordValid } from '../utils/validators';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [notifications, setNotifications] = useState({
    system: true,
    email: false,
    sms: true
  });

  const [localUser, setLocalUser] = useState<User>(user);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSave = () => {
    onUpdateUser(localUser);
    alert("Configurações salvas com sucesso!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setStatus({ type: 'error', message: 'A senha não atende aos requisitos.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setStatus({ type: 'success', message: 'Senha alterada com sucesso!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setStatus({ type: '', message: '' });
      }, 2000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Configurações do Sistema</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie suas preferências e segurança da conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Perfil do Usuário</h4>
          <p className="text-xs text-slate-500">Suas informações básicas e nível de acesso no sistema.</p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <img src={localUser.avatar} alt="Avatar" className="size-20 rounded-2xl object-cover border-4 border-slate-100 dark:border-slate-800" />
              <button className="absolute -bottom-2 -right-2 size-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 dark:text-white">{localUser.name}</h5>
              <p className="text-xs text-slate-500">Status: Ativo • ID: {localUser.id}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase mt-1">
                {localUser.role}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={localUser.name}
                onChange={e => setLocalUser({ ...localUser, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
              <input
                type="email"
                value={localUser.email}
                onChange={e => setLocalUser({ ...localUser, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso (RBAC)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { role: 'admin', label: 'Administrador', desc: 'Acesso total a todos os módulos e configurações.' },
                  { role: 'atendente', label: 'Atendente', desc: 'Gestão de encomendas, calendário, ocorrências e salas.' },
                  { role: 'sala', label: 'Sala (Condômino)', desc: 'Acesso a encomendas, documentos e prestadores.' },
                ].map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setLocalUser({ ...localUser, role: r.role as UserRole })}
                    className={`p-4 rounded-xl border text-left transition-all ${localUser.role === r.role ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${localUser.role === r.role ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>{r.label}</span>
                      {localUser.role === r.role && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                    </div>
                    <p className="text-[10px] text-slate-500">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 space-y-2 pt-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notificações</h4>
          <p className="text-xs text-slate-500">Controle como e quando você deseja ser alertado.</p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {[
            { id: 'system', label: 'Alertas do Sistema', desc: 'Notificações de novas vistorias e mensagens' },
            { id: 'email', label: 'Relatórios por E-mail', desc: 'Resumo semanal de atividades e KPIs' },
            { id: 'sms', label: 'Alertas Críticos via SMS', desc: 'Urgências e falhas de infraestrutura' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifications] }))}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${notifications[item.id as keyof typeof notifications] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`size-4 bg-white rounded-full shadow-sm transition-transform ${notifications[item.id as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="md:col-span-1 space-y-2 pt-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Segurança</h4>
          <p className="text-xs text-slate-500">Mantenha sua conta protegida com as melhores práticas.</p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-[#1d222a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-3 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">lock_reset</span>
            Alterar Senha de Acesso
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={() => setLocalUser(user)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Descartar</button>
        <button onClick={handleSave} className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Salvar Alterações</button>
      </div>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1d222a] rounded-[32px] shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Alterar Senha</h4>
              <button onClick={() => setShowPasswordModal(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                />
              </div>

              <PasswordChecklist password={newPassword} />

              {status.message && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${status.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                  <span className="material-symbols-outlined text-sm">{status.type === 'error' ? 'error' : 'check_circle'}</span>
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirmar Alteração</span>
                    <span className="material-symbols-outlined text-lg">save</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
