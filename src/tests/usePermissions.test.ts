import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePermissions } from '../hooks/usePermissions';
import { User } from '../types';

// usePermissions decide o que cada papel enxerga. É a regra de autorização do
// cliente, então merece cobertura — ainda que a garantia real esteja no RLS.

const usuario = (over: Partial<User>): User => ({
  id: 'x',
  name: 'Teste',
  email: 't@t.com',
  role: 'sala',
  permissions: {},
  ...over,
});

const permissoesDe = (user: User | null) =>
  renderHook(() => usePermissions(user)).result.current;

describe('usePermissions', () => {
  it('nega tudo quando não há usuário', () => {
    const { isPageAllowed, firstAllowedPage } = permissoesDe(null);

    expect(isPageAllowed('dashboard')).toBe(false);
    expect(isPageAllowed('encomendas')).toBe(false);
    expect(firstAllowedPage).toBe('login');
  });

  it('libera todas as páginas para o admin', () => {
    const { isPageAllowed } = permissoesDe(usuario({ role: 'admin' }));

    expect(isPageAllowed('dashboard')).toBe(true);
    expect(isPageAllowed('usuarios')).toBe(true);
    expect(isPageAllowed('audit-logs')).toBe(true);
  });

  it('restringe o morador aos módulos da unidade', () => {
    const { isPageAllowed } = permissoesDe(usuario({ role: 'sala' }));

    expect(isPageAllowed('encomendas')).toBe(true);
    expect(isPageAllowed('avisos')).toBe(true);

    expect(isPageAllowed('usuarios')).toBe(false);
    expect(isPageAllowed('audit-logs')).toBe(false);
    expect(isPageAllowed('vistorias')).toBe(false);
    expect(isPageAllowed('vencimentos')).toBe(false);
    expect(isPageAllowed('dashboard')).toBe(false);
  });

  it('dá ao atendente os módulos operacionais, mas não os de admin', () => {
    const { isPageAllowed } = permissoesDe(usuario({ role: 'atendente' }));

    expect(isPageAllowed('encomendas')).toBe(true);
    expect(isPageAllowed('salas')).toBe(true);
    expect(isPageAllowed('diario')).toBe(true);

    expect(isPageAllowed('usuarios')).toBe(false);
    expect(isPageAllowed('audit-logs')).toBe(false);
  });

  it('deixa a permissão explícita do banco sobrepor o padrão do papel', () => {
    const liberado = permissoesDe(usuario({ role: 'sala', permissions: { vistorias: true } }));
    expect(liberado.isPageAllowed('vistorias')).toBe(true);

    const bloqueado = permissoesDe(usuario({ role: 'sala', permissions: { encomendas: false } }));
    expect(bloqueado.isPageAllowed('encomendas')).toBe(false);
  });

  it('trata papel desconhecido como o menos privilegiado', () => {
    // Um papel fora do enum não pode virar acesso amplo por acidente.
    const { isPageAllowed } = permissoesDe(usuario({ role: 'sindico' as User['role'] }));

    expect(isPageAllowed('usuarios')).toBe(false);
    expect(isPageAllowed('audit-logs')).toBe(false);
    expect(isPageAllowed('encomendas')).toBe(true);
  });

  it('aponta a primeira página permitida de cada papel', () => {
    expect(permissoesDe(usuario({ role: 'admin' })).firstAllowedPage).toBe('dashboard');
    expect(permissoesDe(usuario({ role: 'atendente' })).firstAllowedPage).toBe('encomendas');
    expect(permissoesDe(usuario({ role: 'sala' })).firstAllowedPage).toBe('encomendas');
  });
});
