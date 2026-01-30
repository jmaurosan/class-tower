
import React from 'react';
import { Page, User } from '../../types';

interface SidebarProps {
  user: User;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setCurrentPage, isOpen, onClose }) => {
  // Configuração centralizada de itens de menu
  const allMenuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'atendente', 'sala'] },
    { id: 'avisos', icon: 'campaign', label: 'Portal de Avisos', roles: ['admin', 'atendente', 'sala'] },
    { id: 'encomendas', icon: 'package_2', label: 'Encomendas', roles: ['admin', 'atendente', 'sala'] },
    { id: 'vistorias', icon: 'fact_check', label: 'Vistorias', roles: ['admin'] },
    { id: 'vencimentos', icon: 'assignment_late', label: 'Vencimentos', roles: ['admin'] },
    { id: 'agendamentos', icon: 'calendar_today', label: 'Calendário', roles: ['admin', 'atendente'] },
    { id: 'diario', icon: 'menu_book', label: 'Ocorrências', roles: ['admin', 'atendente'] },
    { id: 'documentos', icon: 'folder_open', label: 'Documentos', roles: ['admin', 'sala'] },
    { id: 'salas', icon: 'meeting_room', label: 'Cadastro de Salas', roles: ['admin', 'atendente'] },
    { id: 'empresas', icon: 'engineering', label: 'Prestadores de Serviço', roles: ['admin', 'atendente', 'sala'] },
  ];

  // Filtra itens permitidos para a role atual
  const visibleMenuItems = allMenuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1d222a] 
      flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">domain</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-lg font-extrabold leading-tight">Class Tower</h1>
            <p className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Gestão Condominial</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id as Page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${currentPage === item.id
              ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === item.id ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-sm ${currentPage === item.id ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        ))}

        <div className="pt-8 pb-4">
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Sistemas</p>
        </div>

        <button
          onClick={() => setCurrentPage('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'settings'
            ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <span className={`material-symbols-outlined ${currentPage === 'settings' ? 'fill-1' : ''}`}>settings</span>
          <span className={`text-sm ${currentPage === 'settings' ? 'font-bold' : 'font-medium'}`}>Configurações</span>
        </button>
        <button
          onClick={() => setCurrentPage('support')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'support'
            ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <span className={`material-symbols-outlined ${currentPage === 'support' ? 'fill-1' : ''}`}>contact_support</span>
          <span className={`text-sm ${currentPage === 'support' ? 'font-bold' : 'font-medium'}`}>Suporte</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div
          onClick={() => setCurrentPage('settings')}
          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
        >
          <img
            src={user.avatar}
            alt="Profile"
            className="size-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user.name}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">{user.role === 'admin' ? 'Gestor Predial' : 'Colaborador'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
