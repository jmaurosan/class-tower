import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Page, User } from '../../types';
import { supabase } from '../../services/supabase';
import { avisosService } from '../../services/avisosService';
import { useToast } from '../../context/ToastContext';

interface SidebarProps {
  user: User;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const { showToast } = useToast();
  const location = useLocation();
  const [isSignalingSOS, setIsSignalingSOS] = React.useState(false);

  const currentPage = location.pathname.substring(1) || 'dashboard';

  // Configuração centralizada de itens de menu
  const allMenuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['admin'] },
    { id: 'agendamentos', icon: 'calendar_today', label: 'Agendamentos', roles: ['admin', 'atendente', 'sala'] },
    { id: 'encomendas', icon: 'package_2', label: 'Encomendas', roles: ['admin', 'atendente', 'sala'] },
    { id: 'diario', icon: 'menu_book', label: 'Ocorrências', roles: ['admin', 'atendente'] },
    { id: 'avisos', icon: 'campaign', label: 'Avisos', roles: ['admin', 'atendente', 'sala'] },
    { id: 'documentos', icon: 'folder_open', label: 'Documentos', roles: ['admin', 'sala'] },
    { id: 'vistorias', icon: 'fact_check', label: 'Vistorias', roles: ['admin'] },
    { id: 'vencimentos', icon: 'assignment_late', label: 'Vencimentos', roles: ['admin'] },
    { id: 'usuarios', icon: 'group', label: 'Cadastro de Usuários', roles: ['admin'] },
    { id: 'salas', icon: 'meeting_room', label: 'Cadastro de Salas', roles: ['admin', 'atendente'] },
    { id: 'empresas', icon: 'engineering', label: 'Prestadores de Serviço', roles: ['admin', 'atendente', 'sala'] },
    { id: 'audit-logs', icon: 'history', label: 'Logs de Auditoria', roles: ['admin'] },
  ];

  // Filtra itens permitidos para o usuário atual
  const visibleMenuItems = allMenuItems.filter(item => {
    // Admin sempre vê tudo por padrão (segurança de redundância)
    if (user.role === 'admin') return true;

    // Se houver uma permissão específica gravada no banco para este usuário, ela tem prioridade
    if (user.permissions && typeof user.permissions[item.id] === 'boolean') {
      return user.permissions[item.id];
    }

    // Caso contrário, segue a regra padrão da Role
    return item.roles.includes(user.role);
  });

  const getRoleLabel = (role: string) => {
    const lowerRole = (role || '').toLowerCase();

    if (lowerRole.includes('admin')) return 'Gestor Predial';
    if (lowerRole.includes('atendente') || lowerRole.includes('colaborador')) return 'Colaborador';

    // Padrão para todos os outros casos (incluindo 'sala', 'condômino', 'locatário', etc)
    // Isso garante que termos residenciais nunca sejam exibidos no rótulo frontal
    if (user.sala_numero && user.sala_numero !== '0000') {
      return `Unidade ${user.sala_numero}`;
    }

    return 'Unidade Comercial';
  };

  const triggerEmergency = async () => {
    setIsSignalingSOS(true);
    try {
      await avisosService.create({
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        titulo: '🚨 ALERTA DE EMERGÊNCIA / SOS 🚨',
        conteudo: `Emergência acionada fisicamente pela portaria/gestão. Por favor, verifiquem imediatamente as instalações ou acionem o suporte de segurança caso não haja resposta.`,
        prioridade: 'Critica',
        criado_por: user.name,
        status: 'Ativo'
      });

      await supabase.from('audit_logs').insert([{
        table_name: 'seguranca',
        record_id: 'sos-' + Date.now(),
        action: 'EMERGENCY_TRIGGER',
        executed_by: user.id,
        executed_by_name: user.name,
        new_data: { type: 'SOS_MANUAL_BTN' }
      }]);

      showToast('Alerta de Emergência disparado com sucesso!', 'error');
    } catch (error) {
      console.error('Erro ao acionar emergência', error);
      showToast('Falha ao disparar alerta. Tente novamente.', 'error');
    } finally {
      setIsSignalingSOS(false);
    }
  };

  return (
    <>
      {/* Overlay para mobile - fecha o sidebar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

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
              <h1 className="text-slate-900 dark:text-white text-lg font-extrabold leading-tight">Class Tower Business</h1>
              <div className="flex flex-col -gap-0.5">
                <p className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider truncate max-w-[150px]">{user.name}</p>
                {user.sala_numero ? (
                  <p className="text-primary text-[9px] font-black uppercase tracking-tight">Unidade {user.sala_numero}</p>
                ) : (
                  <p className="text-slate-400 text-[9px] font-medium uppercase tracking-tight">Perfil de Acesso</p>
                )}
              </div>
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
            <Link
              key={item.id}
              to={`/${item.id}`}
              onClick={onClose}
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
            </Link>
          ))}

          {user.role !== 'sala' && (
            <div className="pt-6 pb-2 px-2">
              <button
                onClick={() => {
                  if (window.confirm("⚠️ ALERTA DE EMERGÊNCIA DA PORTARIA ⚠️\nIsso disparará um aviso imediato com prioridade MÁXIMA para todos os administradores e logs do sistema.\n\nTem certeza que deseja acionar o PÂNICO?")) {
                    triggerEmergency();
                  }
                }}
                disabled={isSignalingSOS}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-600 dark:bg-red-700 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/30 active:scale-95 transition-all animate-pulse disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
                {isSignalingSOS ? 'Disparando...' : 'Botão de Pânico'}
              </button>
            </div>
          )}

          {user.role === 'admin' && (
            <>
              <div className="pt-8 pb-4">
                <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Sistemas</p>
              </div>

              <Link
                to="/settings"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'settings'
                  ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <span className={`material-symbols-outlined ${currentPage === 'settings' ? 'fill-1' : ''}`}>settings</span>
                <span className={`text-sm ${currentPage === 'settings' ? 'font-bold' : 'font-medium'}`}>Configurações</span>
              </Link>
            </>
          )}

          {/* AJUDA E TERMOS - VISÍVEL PARA TODOS */}
          <div className="pt-8 pb-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Ajuda e Termos</p>
          </div>

          <Link
            to="/support"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'support'
              ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === 'support' ? 'fill-1' : ''}`}>contact_support</span>
            <span className={`text-sm ${currentPage === 'support' ? 'font-bold' : 'font-medium'}`}>Suporte Técnico</span>
          </Link>

          <Link
            to="/privacy"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'privacy'
              ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === 'privacy' ? 'fill-1' : ''}`}>verified_user</span>
            <span className={`text-sm ${currentPage === 'privacy' ? 'font-bold' : 'font-medium'}`}>Privacidade</span>
          </Link>

          <Link
            to="/terms"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'terms'
              ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === 'terms' ? 'fill-1' : ''}`}>gavel</span>
            <span className={`text-sm ${currentPage === 'terms' ? 'font-bold' : 'font-medium'}`}>Termos de Uso</span>
          </Link>

          <Link
            to="/responsibility"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentPage === 'responsibility'
              ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-r-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === 'responsibility' ? 'fill-1' : ''}`}>assignment_turned_in</span>
            <span className={`text-sm ${currentPage === 'responsibility' ? 'font-bold' : 'font-medium'}`}>Responsabilidades</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/settings"
            onClick={() => {
              if (user.role === 'admin' || user.role === 'atendente') {
                onClose?.();
              }
            }}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${user.role === 'admin' || user.role === 'atendente'
              ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
              : 'cursor-default pointer-events-none'
              }`}
          >
            <img
              src={user.avatar}
              alt="Profile"
              className="size-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">{getRoleLabel(user.role)}</span>
            </div>
          </Link>
          <div className="mt-2 flex justify-center">
            <span className="text-[9px] text-slate-400 dark:text-slate-600 font-medium">v1.5.0-comercial</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
