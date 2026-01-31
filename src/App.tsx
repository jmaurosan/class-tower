
import React, { useEffect, useState } from 'react';
import WhatIsNewModal from './components/business/WhatIsNewModal';
import Sidebar from './components/layout/Sidebar';
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
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Salas from './pages/Salas';
import Settings from './pages/Settings';
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

  const permissions: Record<UserRole, Page[]> = {
    admin: ['dashboard', 'encomendas', 'vistorias', 'vencimentos', 'agendamentos', 'diario', 'documentos', 'empresas', 'settings', 'support', 'salas', 'audit-logs', 'avisos', 'usuarios'],
    atendente: ['dashboard', 'encomendas', 'agendamentos', 'diario', 'salas', 'empresas', 'support', 'avisos'],
    sala: ['dashboard', 'encomendas', 'documentos', 'empresas', 'support', 'avisos']
  };

  useEffect(() => {
    if (user && !permissions[user.role].includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, user]);

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
      case 'dashboard': return <Dashboard user={user} />;
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

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#15191e]">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (!user) {
    return (
      <Login
        signIn={signIn}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <SyncProvider>
      <div className={`min-h-screen flex bg-slate-50 dark:bg-[#15191e] transition-colors duration-300 font-sans`}>
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
                  {currentPage === 'dashboard' ? 'Overview Geral' : currentPage.replace('-', ' ')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleOpenNews}
                className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 relative hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Novidades"
              >
                <span className="material-symbols-outlined text-slate-500">celebration</span>
                {hasNewUpdates && (
                  <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-white dark:border-[#1d222a]" />
                )}
              </button>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="material-symbols-outlined text-slate-500">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              </button>

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
    </SyncProvider>
  );
};

export default App;
