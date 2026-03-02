import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface ForgotPasswordProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setSuccess(
        'Email de recuperação enviado! ' +
        'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
      );

      setEmail('');
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      setError(
        err.message ||
        'Erro ao enviar email de recuperação. Verifique se o email está correto e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl mb-4">
            <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                data-testid="forgot-password-email-input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl 
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-primary focus:border-transparent
                  placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                data-testid="forgot-password-error-message"
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                data-testid="forgot-password-success-message"
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-lg mt-0.5">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl 
                hover:scale-105 active:scale-95 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Enviar Email de Recuperação
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Voltar para o login
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleDarkMode}
            className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:scale-110 transition-all"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
