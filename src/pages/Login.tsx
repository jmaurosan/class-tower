
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  signIn: (email: string, password: string) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Login: React.FC<LoginProps> = ({ signIn, isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<'login' | 'forgot-password'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (err.message === 'Email not confirmed') {
        setError('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        setError('Ocorreu um erro ao tentar acessar o sistema. Tente novamente mais tarde.');
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error('Error reset password:', err);
      setError('Erro ao enviar e-mail de recuperação. Verifique o e-mail digitado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#15191e] p-4 transition-colors duration-500 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#1d222a] rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-700">

        {/* Lado Esquerdo: Branding/Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden text-white">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover grayscale"
              alt="Building"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">domain</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">Class Tower</h1>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4">A excelência na gestão do seu condomínio.</h2>
            <p className="text-white/70 font-medium">Controle total de vistorias, encomendas e manutenções em uma plataforma única e intuitiva.</p>
          </div>

          <div className="relative z-10 text-xs font-bold uppercase tracking-widest text-white/50">
            © 2024 Class Tower Systems • Premium Management
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="p-8 md:p-16 flex flex-col justify-center relative">
          <button
            onClick={toggleDarkMode}
            className="absolute top-8 right-8 size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <div className="max-w-sm mx-auto w-full space-y-8">
            {view === 'login' ? (
              <>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bem-vindo</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Insira suas credenciais para acessar o painel.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                      <input
                        required
                        data-testid="email-input"
                        type="email"
                        placeholder="exemplo@classtower.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                      <button
                        type="button"
                        onClick={() => setView('forgot-password')}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                      <input
                        required
                        data-testid="password-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {error}
                    </div>
                  )}

                  <button
                    disabled={isLoading}
                    type="submit"
                    data-testid="login-submit-button"
                    className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-sm uppercase tracking-widest">Acessar Sistema</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>


              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <button
                  onClick={() => setView('login')}
                  className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-6"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Voltar ao Login
                </button>

                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recuperar Senha</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Enviaremos um link de redefinição para o seu e-mail.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5 mt-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Cadastro</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                      <input
                        required
                        type="email"
                        placeholder="exemplo@classtower.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                      />
                    </div>
                  </div>

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
                        <span className="text-sm uppercase tracking-widest">Enviar Instruções</span>
                        <span className="material-symbols-outlined text-lg">send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
