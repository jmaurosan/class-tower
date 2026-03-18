import React, { useEffect, useRef, useState } from 'react';
import { AppNotification, useNotifications } from '../hooks/useNotifications';
import { User } from '../types';

interface NotificationBellProps {
  user: User;
}

// Formata hora relativa (ex: "há 5 minutos")
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${days}d`;
};

const sourceIcon = (source: AppNotification['source']) =>
  source === 'encomenda' ? 'package_2' : 'campaign';

const sourceColor = (source: AppNotification['source']) =>
  source === 'encomenda' ? 'text-amber-500 bg-amber-500/10' : 'text-primary bg-primary/10';

// Toast que aparece no canto da tela
export const NotificationToast: React.FC<{ notification: AppNotification }> = ({ notification }) => (
  <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
    <div className="bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-4 max-w-sm">
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${sourceColor(notification.source)}`}>
        <span className="material-symbols-outlined text-xl">{sourceIcon(notification.source)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          {notification.source === 'encomenda' ? 'Nova Encomenda' : 'Novo Aviso'}
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
        )}
      </div>
    </div>
  </div>
);

// Componente pricipal: sino com badge e dropdown
const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, toastNotification, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications(user);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {/* Toast de nova notificação */}
      {toastNotification && <NotificationToast notification={toastNotification} />}

      {/* Botão Sino */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="notification-bell-btn"
          onClick={() => setIsOpen(prev => !prev)}
          className="relative size-10 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Notificações"
        >
          <span className="material-symbols-outlined text-slate-500">
            {unreadCount > 0 ? 'notifications_active' : 'notifications'}
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown de notificações */}
        {isOpen && (
          <div className="absolute top-12 right-0 w-80 max-h-[480px] bg-white dark:bg-[#1d222a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[999] flex flex-col animate-in fade-in zoom-in-95 duration-150 origin-top-right">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Notificações</h3>
                <p className="text-[10px] text-slate-400">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <span className="material-symbols-outlined text-5xl text-slate-200">notifications_off</span>
                  <p className="text-xs text-slate-400 font-medium">Nenhuma notificação recente</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-start gap-3 ${!notif.read ? 'bg-primary/3' : ''}`}
                  >
                    {/* Ícone de tipo */}
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${sourceColor(notif.source)}`}>
                      <span className="material-symbols-outlined text-base">{sourceIcon(notif.source)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs leading-tight truncate ${notif.read ? 'font-medium text-slate-600 dark:text-slate-400' : 'font-bold text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="size-2 bg-primary rounded-full shrink-0" />
                        )}
                      </div>
                      {notif.message && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                      )}
                      <p className="text-[9px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Rodapé */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-center text-[9px] text-slate-400">Mostrando notificações das últimas 48h</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
