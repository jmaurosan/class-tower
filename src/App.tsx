
import React, { useEffect, useState } from 'react';
import ModalNovoRegistro from './components/business/ModalNovoRegistro';
import Sidebar from './components/layout/Sidebar';
import { useAuth } from './hooks/useAuth';
import Agendamentos from './pages/Agendamentos';
import Avisos from './pages/Avisos';
import Dashboard from './pages/Dashboard';
import DiarioBordo from './pages/DiarioBordo';
import Documentos from './pages/Documentos';
import PrestadoresServico from './pages/Empresas';
import Encomendas from './pages/Encomendas';
import Login from './pages/Login';
import Salas from './pages/Salas';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Vencimentos from './pages/Vencimentos';
import Vistorias from './pages/Vistorias';
import { DocumentoVencimento, Notificacao, Page, UserRole, Vistoria } from './types';

const App: React.FC = () => {
  const { user, loading, logout, setUser, signIn } = useAuth(); // Added setUser and signIn
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Mapeamento de Permissões por Role (Rigoroso)
  const permissions: Record<UserRole, Page[]> = {
    admin: ['dashboard', 'encomendas', 'vistorias', 'vencimentos', 'agendamentos', 'diario', 'documentos', 'empresas', 'settings', 'support', 'salas', 'audit-logs', 'avisos'],
    atendente: ['dashboard', 'encomendas', 'agendamentos', 'diario', 'salas', 'empresas', 'support', 'avisos'],
    sala: ['dashboard', 'encomendas', 'documentos', 'empresas', 'support', 'avisos']
  };

  // Proteção de Rota
  useEffect(() => {
    if (user && !permissions[user.role].includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, user, permissions]); // Added permissions to dependency array

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Estados locais para dados
  const [documentos, setDocumentos] = useState<DocumentoVencimento[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);

  // State for audit logs
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [mockLogs] = useState([
    { id: '1', acao: 'INSERT', user: 'Carlos (Zelador)', data: '24/10 09:30', item: 'Troca de lâmpadas' },
    { id: '2', acao: 'UPDATE', user: 'Ana (Adm)', data: '24/10 14:20', item: 'Entrega material' },
    { id: '3', acao: 'DELETE', user: 'Admin', data: '25/10 10:05', item: 'Registro Teste' },
  ]);

  const handleUpdateDocStatus = (id: string, newStatus: 'Feito' | 'Em Andamento', alertHandled: boolean = false) => {
    setDocumentos(prev => prev.map(doc =>
      doc.id === id ? { ...doc, status: newStatus, visto: alertHandled } : doc
    ));
  };

  const handleAddVistoria = (novaVistoria: Vistoria) => {
    setVistorias([novaVistoria, ...vistorias]);
    setCurrentPage('vistorias');
  };

  const renderContent = () => {
    if (!user) return null;

    switch (currentPage) {
      case 'dashboard': return <Dashboard documentos={documentos} onUpdateStatus={handleUpdateDocStatus} user={user} />;
      case 'vistorias': return <Vistorias vistoriasList={vistorias} user={user} />;
      case 'vencimentos': return <Vencimentos documentos={documentos} setDocumentos={setDocumentos} onUpdateStatus={handleUpdateDocStatus} user={user} />;
      case 'diario': return <DiarioBordo user={user} />;
      case 'agendamentos': return <Agendamentos user={user} />;
      case 'documentos': return <Documentos user={user} />;
      case 'empresas': return <PrestadoresServico user={user} />;
      case 'salas': return <Salas user={user} />;
      case 'avisos': return <Avisos user={user} />;
      case 'settings': return <Settings user={user} onUpdateUser={setUser} />;
      case 'support': return <Support />;
      case 'encomendas': return <Encomendas user={user} />;
      case 'audit-logs': return (
        <div className="p-8">
          <div className="bg-slate-900 dark:bg-black text-white p-8 rounded-[32px] border border-slate-800 shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">security</span>
                <h4 className="text-sm font-black uppercase tracking-[0.2em]">Painel de Auditoria (Exclusivo Admin)</h4>
              </div>
              <button onClick={() => setCurrentPage('dashboard')} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockLogs.map(log => (
                <div key={log.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-2 relative group overflow-hidden">
                  <div className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${log.acao === 'DELETE' ? 'bg-red-500' : log.acao === 'UPDATE' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                    {log.acao}
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500">{log.data}</span>
                    <span className="text-[10px] font-bold text-primary">{log.user}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300 truncate">Item: {log.item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              <span className="material-symbols-outlined text-xs">info</span>
              Os logs são gerados automaticamente via Postgres Triggers no Supabase.
            </div>
          </div>
        </div>
      );
      default: return <Dashboard documentos={documentos} onUpdateStatus={handleUpdateDocStatus} user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#15191e]">
        <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
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

  const unreadCount = notificacoes.filter(n => !n.lida).length;
  const isAdmin = user.role === 'admin';

  const getPageTitle = (page: Page) => {
    if (page === 'diario') return 'Ocorrências';
    if (page === 'salas') return 'Cadastro de Salas';
    if (page === 'agendamentos') return 'Calendário';
    if (page === 'documentos') return 'Documentos';
    if (page === 'audit-logs') return 'Logs de Auditoria';
    return page.replace('-', ' ');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbfcfc] dark:bg-[#15191e] transition-colors duration-300 relative">
      <Sidebar
        user={user}
        currentPage={currentPage}
        setCurrentPage={(p) => { setCurrentPage(p); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-[#1d222a] border-b border-slate-200 dark:border-slate-800 shrink-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined text-slate-500">menu</span>
            </button>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white capitalize truncate tracking-tight">
              {getPageTitle(currentPage)}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {isAdmin && (
              <button
                onClick={() => setCurrentPage('audit-logs')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-bold text-sm shadow-sm active:scale-95 animate-in fade-in zoom-in-95 duration-200"
                title="Ver Logs de Auditoria"
              >
                <span className="material-symbols-outlined">history</span>
                <span className="hidden sm:inline">Logs</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all relative"
              >
                <span className="material-symbols-outlined text-slate-500">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1d222a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-[100] animate-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notificações</span>
                    <button onClick={() => setNotificacoes([])} className="text-[10px] font-bold text-primary hover:underline">Limpar</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notificacoes.length > 0 ? (
                      notificacoes.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                          <div className="flex gap-3">
                            <div className={`size-2 rounded-full mt-1.5 shrink-0 ${n.prioridade === 'Alta' ? 'bg-red-500' : n.prioridade === 'Media' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{n.titulo}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">{n.mensagem}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Sem alertas novos</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="material-symbols-outlined text-slate-500">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {currentPage === 'vistorias' && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-sm active:scale-95 animate-in fade-in zoom-in-95 duration-200">
                <span className="material-symbols-outlined text-xl">add</span>
                <span className="hidden sm:inline">Novo</span>
              </button>
            )}

            <button onClick={logout} className="size-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-50 hover:text-white transition-all ml-2" title="Sair do Sistema">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      <ModalNovoRegistro isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddVistoria} />
    </div>
  );
};

export default App;
