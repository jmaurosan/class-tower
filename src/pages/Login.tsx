import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // ✨ DESTRAVE: Se o usuário logou, mas a tela de login ainda está aberta, 
  // nós forçamos o redirecionamento para o Dashboard.
  useEffect(() => {
    if (user && !loading) {
      console.log('🚀 [LOGIN] Usuário detectado, redirecionando para o Dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail para reenviar a confirmação.');
      return;
    }
    setResendLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      if (error) throw error;
      setSuccess('E-mail de confirmação reenviado! Verifique sua caixa de entrada.');
      setIsEmailNotConfirmed(false);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('Erro ao reenviar e-mail: ' + (err.message || 'Tente novamente.'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setIsEmailNotConfirmed(false);

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      await signIn(sanitizedEmail, password);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || '';
      
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (msg.includes('Email not confirmed') || err.status === 400) {
        setError('Seu e-mail ainda não foi confirmado.');
        setIsEmailNotConfirmed(true);
      } else {
        setError('Erro ao acessar o sistema. Tente novamente mais tarde.');
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
      const sanitizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
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
    <div className="min-h-screen w-full flex flex-col md:items-center md:justify-center bg-slate-50 dark:bg-[#15191e] p-4 py-8 md:p-8 overflow-y-auto transition-colors duration-500 relative">
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-2 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                      </div>
                      
                      {isEmailNotConfirmed && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          className="mt-2 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {resendLoading ? (
                            <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-sm">mail</span>
                          )}
                          Reenviar E-mail de Confirmação
                        </button>
                      )}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {success}
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

                {/* Primeiro Acesso */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Primeiro acesso?
                  </p>
                  <Link
                    to="/signup"
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Cadastre-se aqui
                  </Link>
                </div>


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
