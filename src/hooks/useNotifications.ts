import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';

// Tipos de notificação suportados
export type NotificationSource = 'aviso' | 'encomenda';

export interface AppNotification {
  id: string;
  source: NotificationSource;
  title: string;
  message: string;
  createdAt: string;
  sala_numero?: string;
  read: boolean;
}

// Chave para persistir notificações lidas no localStorage
const STORAGE_KEY = 'classtower_read_notifications';

const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
};

const markAsRead = (id: string) => {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

const markAllAsRead = (ids: string[]) => {
  const existing = getReadIds();
  ids.forEach(id => existing.add(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
};

export function useNotifications(user: User) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);
  const isFirstLoad = useRef(true);

  // Carrega notificações recentes do banco (últimas 48h)
  const fetchRecent = async () => {
    const readIds = getReadIds();
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const results: AppNotification[] = [];

    // Buscar avisos recentes
    try {
      let avisosQuery = supabase
        .from('avisos')
        .select('id, titulo, conteudo, created_at, sala_numero')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);

      // Usuário de sala: só avisos sem sala (gerais) ou para a sua sala
      if (user.role === 'sala' && user.sala_numero) {
        avisosQuery = avisosQuery.or(`sala_numero.is.null,sala_numero.eq.${user.sala_numero}`);
      }

      const { data: avisos } = await avisosQuery;
      if (avisos) {
        avisos.forEach(a => {
          results.push({
            id: `aviso_${a.id}`,
            source: 'aviso',
            title: a.titulo,
            message: a.conteudo?.substring(0, 100) || '',
            createdAt: a.created_at,
            sala_numero: a.sala_numero,
            read: readIds.has(`aviso_${a.id}`)
          });
        });
      }
    } catch (err) {
      console.warn('[Notifications] Erro ao buscar avisos:', err);
    }

    // Buscar encomendas recentes
    try {
      let encomendasQuery = supabase
        .from('encomendas')
        .select('id, descricao, sala_numero, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);

      // Usuário de sala: só encomendas da sua sala
      if (user.role === 'sala' && user.sala_numero) {
        encomendasQuery = encomendasQuery.eq('sala_numero', user.sala_numero);
      }

      const { data: encomendas } = await encomendasQuery;
      if (encomendas) {
        encomendas.forEach(e => {
          results.push({
            id: `encomenda_${e.id}`,
            source: 'encomenda',
            title: `📦 Encomenda para Unidade ${e.sala_numero}`,
            message: e.descricao || 'Nova encomenda recebida na portaria',
            createdAt: e.created_at,
            sala_numero: e.sala_numero,
            read: readIds.has(`encomenda_${e.id}`)
          });
        });
      }
    } catch (err) {
      console.warn('[Notifications] Erro ao buscar encomendas:', err);
    }

    // Ordena por data decrescente
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(results);
  };

  // Adiciona nova notificação em tempo real e exibe toast (exceto na carga inicial)
  const addRealtime = (notification: AppNotification) => {
    if (!isFirstLoad.current) {
      setToastNotification(notification);
      setTimeout(() => setToastNotification(null), 5000);
    }
    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    fetchRecent().then(() => { isFirstLoad.current = false; });

    // Canal de avisos em tempo real
    const avisoChannel = supabase
      .channel(`notifications_avisos_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'avisos'
      }, (payload) => {
        const a = payload.new as any;
        // Filtra: admin/atendente vê todos; sala vê apenas os seus ou gerais
        if (user.role === 'sala' && user.sala_numero) {
          if (a.sala_numero && a.sala_numero !== user.sala_numero) return;
        }
        const notif: AppNotification = {
          id: `aviso_${a.id}`,
          source: 'aviso',
          title: a.titulo,
          message: a.conteudo?.substring(0, 100) || '',
          createdAt: a.created_at || new Date().toISOString(),
          sala_numero: a.sala_numero,
          read: false
        };
        addRealtime(notif);
      })
      .subscribe();

    // Canal de encomendas em tempo real
    const encomendasChannel = supabase
      .channel(`notifications_encomendas_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'encomendas'
      }, (payload) => {
        const e = payload.new as any;
        // Filtra: sala vê apenas as suas encomendas
        if (user.role === 'sala' && user.sala_numero && e.sala_numero !== user.sala_numero) return;

        const notif: AppNotification = {
          id: `encomenda_${e.id}`,
          source: 'encomenda',
          title: `📦 Encomenda — Unidade ${e.sala_numero}`,
          message: e.descricao || 'Nova encomenda recebida na portaria',
          createdAt: e.created_at || new Date().toISOString(),
          sala_numero: e.sala_numero,
          read: false
        };
        addRealtime(notif);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(avisoChannel);
      supabase.removeChannel(encomendasChannel);
    };
  }, [user.id, user.sala_numero, user.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    const ids = notifications.map(n => n.id);
    markAllAsRead(ids);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return {
    notifications,
    unreadCount,
    toastNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };
}
