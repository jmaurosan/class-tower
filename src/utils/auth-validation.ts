import { UserRole } from '../types';

/**
 * Normaliza a string de role vinda do banco de dados para os tipos aceitos pelo sistema.
 * Trata variações como 'Morador / Sala' ou 'Colaborador'.
 */
export const normalizeUserRole = (rawRole: string | null | undefined): UserRole => {
  const role = (rawRole || '').toLowerCase();

  if (role.includes('admin')) return 'admin';
  if (role.includes('atendente') || role.includes('colaborador')) return 'atendente';
  
  return 'sala';
};

/**
 * Valida se um objeto de perfil possui os campos mínimos necessários para funcionamento.
 */
export const isProfileValid = (data: any): boolean => {
  return !!(data && data.id && data.email);
};

/**
 * Retorna um nome amigável para exibição baseado nos dados disponíveis.
 */
export const getDisplayName = (data: any): string => {
  if (!data) return 'Usuário';
  return data.full_name || data.name || data.email?.split('@')[0] || 'Usuário';
};
