import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PasswordChecklist from '../components/ui/PasswordChecklist';
import PasswordInput from '../components/ui/PasswordInput';
import { supabase } from '../services/supabase';
import { isPasswordValid } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';

const SignUp: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    salaNumero: '',
    nomeCompleto: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não correspondem.');
      return;
    }

    if (!isPasswordValid(formData.senha)) {
      setError('A senha não atende aos requisitos de segurança.');
      return;
    }

    setLoading(true);

    try {
      // A validação real (sala existe / nome bate com o responsável / ainda não
      // há usuário para a sala) roda na Edge Function `signup-morador`, com
      // service_role. Quando essas checagens ficavam aqui, bastava chamar
      // /auth/v1/signup direto no navegador para pular todas elas e ainda
      // escolher o próprio `role`.
      const { data, error: fnError } = await supabase.functions.invoke('signup-morador', {
        body: {
          salaNumero: formData.salaNumero.trim(),
          nomeCompleto: formData.nomeCompleto.trim(),
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha
        }
      });

      // functions.invoke() devolve FunctionsHttpError sem o corpo em respostas
      // 4xx, então lemos a mensagem do servidor a partir da própria resposta.
      if (fnError) {
        const detalhe = await (fnError as any)?.context?.json?.().catch(() => null);
        throw new Error(detalhe?.error || 'Erro ao realizar cadastro. Tente novamente.');
      }

      if (data?.error) throw new Error(data.error);

      setSuccess(
        'CADASTRO REALIZADO!\n\n' +
        'Sua conta já está ativa. Você será redirecionado para a tela de login.'
      );

      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);

    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:items-center md:justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 py-8 overflow-y-auto transition-colors duration-500">
      <div className="w-full max-w-md my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl mb-4">
            <span className="material-symbols-outlined text-white text-3xl">apartment</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Primeiro Acesso
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cadastre-se para acessar o sistema
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Número da Sala */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Número da Sala/Apartamento
              </label>
              <input
                type="text"
                value={formData.salaNumero}
                onChange={(e) => setFormData({ ...formData, salaNumero: e.target.value })}
                placeholder="Ex: 101"
                required
                className="w-full px-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-primary focus:border-transparent
                  placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
              />
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                placeholder="Conforme cadastrado na administração"
                required
                className="w-full px-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-primary focus:border-transparent
                  placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Digite exatamente como está cadastrado na administração
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-primary focus:border-transparent
                  placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
              />
            </div>

            {/* Senha */}
            <PasswordInput
              label="Senha"
              value={formData.senha}
              onChange={(senha) => setFormData({ ...formData, senha })}
              placeholder="Crie uma senha segura"
              required
            />

            {/* Confirmar Senha */}
            <PasswordInput
              label="Confirmar Senha"
              value={formData.confirmarSenha}
              onChange={(confirmarSenha) => setFormData({ ...formData, confirmarSenha })}
              placeholder="Digite a senha novamente"
              required
            />

            {/* Password Checklist */}
            {formData.senha && (
              <PasswordChecklist password={formData.senha} />
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-lg mt-0.5">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20
                hover:scale-[1.02] active:scale-95 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Criando conta...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  <span className="text-sm uppercase tracking-widest">Criar Conta</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Voltar para o login
            </Link>
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

export default SignUp;
