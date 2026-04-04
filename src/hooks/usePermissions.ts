import { useMemo } from 'react';
import { Page, User, UserRole } from '../types';

export const defaultPermissions: Record<UserRole, Page[]> = {
  admin: ['dashboard', 'encomendas', 'vistorias', 'vencimentos', 'agendamentos', 'diario', 'documentos', 'empresas', 'settings', 'support', 'salas', 'audit-logs', 'avisos', 'usuarios'],
  atendente: ['encomendas', 'agendamentos', 'diario', 'salas', 'empresas', 'support', 'avisos', 'settings'],
  sala: ['encomendas', 'agendamentos', 'documentos', 'empresas', 'support', 'avisos']
};

export const usePermissions = (user: User | null) => {
  const isPageAllowed = useMemo(() => (page: Page) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Se houver permissão customizada no banco, ela manda
    if (user.permissions && typeof user.permissions[page] === 'boolean') {
      return user.permissions[page];
    }

    // Normalização de segurança: Se a role não for padrão, assumimos 'sala' (menos privilegiado)
    let safeRole: UserRole = 'sala';
    const lowerRole = (user.role || '').toLowerCase();

    if (lowerRole.includes('admin')) safeRole = 'admin';
    else if (lowerRole.includes('atendente') || lowerRole.includes('colaborador')) safeRole = 'atendente';

    return defaultPermissions[safeRole].includes(page);
  }, [user]);

  const firstAllowedPage = useMemo(() => {
    if (!user) return 'login';
    const safeRole: UserRole = user.role.includes('admin') ? 'admin' : (user.role.includes('atendente') ? 'atendente' : 'sala');
    return defaultPermissions[safeRole].find(p => isPageAllowed(p)) || 'avisos';
  }, [user, isPageAllowed]);

  return { isPageAllowed, firstAllowedPage };
};
