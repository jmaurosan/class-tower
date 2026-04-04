import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import Sidebar from './Sidebar';
import NotificationBell from '../NotificationBell';
import WhatIsNewModal from '../business/WhatIsNewModal';
import { SyncProvider } from '../SyncProvider';
import { ToastProvider } from '../../context/ToastContext';
import ToastContainer from '../ui/Toast';

const RootLayout: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNews, setShowNews] = useState(false);
  
  const { isPageAllowed } = usePermissions(user);

  // Descobrir o nome da página atual baseada na URL
  const pathname = window.location.pathname.substring(1) || 'dashboard';

  const getPageTitle = (path: string) => {
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
      encomendas: 'Encomendas',
      vistorias: 'Vistorias',
      documentos: 'Documentos',
      salas: 'Salas',
      support: 'Suporte'
    };
    return pageNames[path] || path.replace('-', ' ');
  };

  if (!user) return null;

  return (
    <ToastProvider>
      <SyncProvider>
        <div className={`min-h-[100dvh] w-full flex overflow-x-hidden bg-slate-50 dark:bg-[#15191e] transition-colors duration-300 font-sans`}>
          <Sidebar
            user={user}
            currentPage={pathname as any}
            setCurrentPage={() => {}} // Agora o React Router gerencia isso via links
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
            <header className="h-20 bg-white dark:bg-[#1d222a] border-b border-slate-100 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-500"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {getPageTitle(pathname)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={toggleDarkMode} className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="material-symbols-outlined text-slate-500">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                </button>

                <NotificationBell user={user} />

                <button onClick={logout} className="size-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-slate-900 transition-all ml-2" title="Sair do Sistema">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
              <WhatIsNewModal isOpen={showNews} onClose={() => setShowNews(false)} />
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Outlet />
            </div>
          </main>
        </div>
        <ToastContainer />
      </SyncProvider>
    </ToastProvider>
  );
};

export default RootLayout;
