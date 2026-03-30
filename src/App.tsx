
import React, { useEffect, useState } from 'react';
import WhatIsNewModal from './components/business/WhatIsNewModal';
import NotificationBell from './components/NotificationBell';
import Sidebar from './components/layout/Sidebar';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/Toast';
import { SyncProvider } from './components/SyncProvider';
import { currentVersion } from './config/changelog';
import { useAuth } from './hooks/useAuth';
import Agendamentos from './pages/Agendamentos';
import AuditLogs from './pages/AuditLogs';
import Avisos from './pages/Avisos';
import Dashboard from './pages/Dashboard';
import DiarioBordo from './pages/DiarioBordo';
import Documentos from './pages/Documentos';
import PrestadoresServico from './pages/Empresas';
import Encomendas from './pages/Encomendas';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Salas from './pages/Salas';
import Settings from './pages/Settings';
import SignUp from './pages/SignUp';
import Support from './pages/Support';
import Usuarios from './pages/Usuarios';
import Vencimentos from './pages/Vencimentos';
import Vistorias from './pages/Vistorias';
import { Page, UserRole } from './types';

const App: React.FC = () => {
  const { user, loading, logout, setUser, signIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('last_news_view');
    if (lastSeen !== currentVersion) {
      setHasNewUpdates(true);
    }
  }, []);

  const handleOpenNews = () => {
    setShowNews(true);
    setHasNewUpdates(false);
    localStorage.setItem('last_news_view', currentVersion);
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const defaultPermissions: Record<UserRole, Page[]> = {
    admin: ['dashboard', 'encomendas', 'vistorias', 'vencimentos', 'agendamentos', 'diario', 'documentos', 'empresas', 'settings', 'support', 'salas', 'audit-logs', 'avisos', 'usuarios'],
    atendente: ['encomendas', 'agendamentos', 'diario', 'salas', 'empresas', 'support', 'avisos', 'settings'],
    sala: ['encomendas', 'agendamentos', 'documentos', 'empresas', 'support', 'avisos']
  };

  const isPageAllowed = (page: Page) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Se houver permissão customizada no banco, ela manda
    if (user.permissions && typeof user.permissions[page] === 'boolean') {
      const allowed = user.permissions[page];
      console.log(`🔐 [ACCESS] Checando permissão customizada para ${page}:`, allowed);
      return allowed;
    }

    // Normalização de segurança: Se a role não for padrão, assumimos 'sala' (menos privilegiado)
    let safeRole: UserRole = 'sala';
    const lowerRole = (user.role || '').toLowerCase();

    if (lowerRole.includes('admin')) safeRole = 'admin';
    else if (lowerRole.includes('atendente') || lowerRole.includes('colaborador')) safeRole = 'atendente';

    const allowed = defaultPermissions[safeRole].includes(page);
    // console.log(`🔐 [ACCESS] Checando permissão padrão (Role Real: ${user.role} -> ${safeRole}) para ${page}:`, allowed);
    return allowed;
  };

  useEffect(() => {
    if (user && !isPageAllowed(currentPage)) {
      console.warn(`🚀 [ROUTER] Acesso negado à página ${currentPage}. Redirecionando...`);
      // Tenta redirecionar para 'avisos' ou para a primeira página disponível
      const firstAllowed = defaultPermissions[user.role].find(p => isPageAllowed(p)) || 'avisos';
      setCurrentPage(firstAllowed as Page);
    }
  }, [currentPage, user]);

  // Tela de Bloqueio caso o usuário esteja inativo
  if (user && user.status === 'Bloqueado') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#15191e] p-8 text-center transition-colors duration-300">
        <div className="size-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="material-symbols-outlined text-5xl font-bold">block</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Acesso Suspenso</h1>
        <p className="text-slate-500 max-w-md mb-8">
          Sua conta foi temporariamente bloqueada pela administração.
          Entre em contato com o síndico para regularizar seu acesso ao Class Tower.
        </p>
        <button
          onClick={logout}
          className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Sair do Sistema
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const renderContent = () => {
    if (!user) return null;

    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} setCurrentPage={setCurrentPage} />;
      case 'vistorias': return <Vistorias user={user} />;
      case 'vencimentos': return <Vencimentos />;
      case 'diario': return <DiarioBordo user={user} />;
      case 'agendamentos': return <Agendamentos user={user} />;
      case 'documentos': return <Documentos user={user} />;
      case 'empresas': return <PrestadoresServico user={user} />;
      case 'salas': return <Salas user={user} />;
      case 'avisos': return <Avisos user={user} />;
      case 'settings': return <Settings user={user} onUpdateUser={setUser} />;
      case 'support': return <Support />;
      case 'encomendas': return <Encomendas user={user} />;
      case 'usuarios': return <Usuarios currentUser={user} />;
      case 'audit-logs': return <AuditLogs />;
      default: return <Dashboard user={user} />;
    }
  };

  // Efeito para garantir que o carregamento pare caso algo dê errado no useAuth
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [APP] Carregamento demorando demais. Forçando parada...');
        // Note: loading em useAuth é read-only aqui, mas App.tsx pode ter seu próprio estado local se necessário
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#15191e]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Class Tower carregando...</p>
        </div>
      </div>
    );
  }

  // Roteamento Público (Sem Autenticação)
  const isPublicPath = ['/signup', '/forgot-password', '/atualizar-senha'].includes(window.location.pathname);

  if (window.location.pathname === '/atualizar-senha') {
    return <UpdatePassword />;
  }

  if (window.location.pathname === '/signup') {
    return (
      <SignUp
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  if (window.location.pathname === '/forgot-password') {
    return (
      <ForgotPassword
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  // Se não estiver logado e não for rota pública, força tela de login no path raiz
  if (!user) {
    // Se o usuário tentar acessar uma rota interna diretamente sem estar logado
    if (window.location.pathname !== '/' && !isPublicPath) {
      window.location.href = '/';
      return null;
    }

    return (
      <Login
        signIn={signIn}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <ToastProvider>
      <SyncProvider>
        <div className={`min-h-screen w-full flex overflow-x-hidden bg-slate-50 dark:bg-[#15191e] transition-colors duration-300 font-sans`}>
          <Sidebar
            user={user}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-20 bg-white dark:bg-[#1d222a] border-b border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {(() => {
                      const pageNames: Record<string, string> = {
                        dashboard: 'Dashboard',
                        diario: 'Ocorrências',
                        'audit-logs': 'Logs de Auditoria',
                        avisos: 'Avisos',
                        vencimentos: 'Vencimentos',
                        agendamentos: 'Agendamentos',
                        usuarios: 'Cadastro de Usuários',
                        empresas: 'Prestadores de Serviços',
                        settings: 'Configurações',
                      };
                      return pageNames[currentPage] || currentPage.replace('-', ' ');
                    })()}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="material-symbols-outlined text-slate-500">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                </button>

                {/* Sino de Notificações — filtra por sala do usuário */}
                <NotificationBell user={user} />

                <button onClick={logout} className="size-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-slate-900 transition-all ml-2" title="Sair do Sistema">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
              <WhatIsNewModal isOpen={showNews} onClose={() => setShowNews(false)} />
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {renderContent()}
            </div>
          </main>
        </div>
        <ToastContainer />
      </SyncProvider>
    </ToastProvider>
  );
};

export default App;
