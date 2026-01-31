
import React, { useState } from 'react';
import PasswordChecklist from '../components/ui/PasswordChecklist';
import { supabase } from '../services/supabase';
import { isPasswordValid } from '../utils/validators';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid(password)) {
      setError('A senha não atende aos requisitos de segurança.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setSuccess('Senha redefinida com sucesso! Você já pode fechar esta página e logar no sistema.');

      // Opcional: Redirecionar para o login após alguns segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (err: any) {
      console.error('Error updating password:', err);
      setError('Ocorreu um erro ao tentar mudar sua senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#15191e] p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-[#1d222a] p-8 md:p-12 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Nova Senha</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Crie uma senha forte e segura.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock_open</span>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
              />
            </div>
          </div>

          <PasswordChecklist password={password} />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {success}
            </div>
          )}

          <button
            disabled={isLoading}
            type="submit"
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-sm uppercase tracking-widest">Atualizar Senha</span>
                <span className="material-symbols-outlined text-lg">save</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
