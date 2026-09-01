import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Sidebar from '../components/layout/Sidebar';
import { ToastProvider } from '../context/ToastContext';
import { User } from '../types';

// O Sidebar usa useLocation() e useToast(), então precisa dos dois providers.
// A versão anterior deste arquivo renderizava o componente solto e passava as
// props currentPage/setCurrentPage, que deixaram de existir na migração para o
// React Router — os cinco testes falhavam com
// "useLocation() may be used only in the context of a <Router>".
const renderSidebar = (user: User, rota = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <ToastProvider>
        <Sidebar user={user} />
      </ToastProvider>
    </MemoryRouter>,
  );

const admin: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
  permissions: {},
  avatar: '',
};

const sala: User = {
  id: '2',
  name: 'Sala User',
  email: 'sala@test.com',
  role: 'sala',
  sala_numero: '101',
  permissions: {},
  avatar: '',
};

const atendente: User = {
  id: '3',
  name: 'Atendente User',
  email: 'atendente@test.com',
  role: 'atendente',
  permissions: {},
  avatar: '',
};

describe('Sidebar', () => {
  it('mostra os itens administrativos para o admin', () => {
    renderSidebar(admin);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cadastro de Usuários')).toBeInTheDocument();
    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
    expect(screen.getByText('Vistorias')).toBeInTheDocument();
  });

  it('esconde os itens administrativos do usuário de sala', () => {
    renderSidebar(sala);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Cadastro de Usuários')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs de Auditoria')).not.toBeInTheDocument();
    expect(screen.queryByText('Vistorias')).not.toBeInTheDocument();
  });

  it('mostra ao usuário de sala apenas os módulos dele', () => {
    renderSidebar(sala);

    expect(screen.getByText('Encomendas')).toBeInTheDocument();
    expect(screen.getByText('Avisos')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos')).toBeInTheDocument();
  });

  it('respeita permissão customizada gravada no perfil', () => {
    renderSidebar({ ...sala, permissions: { vistorias: true } });

    // A permissão explícita do banco tem prioridade sobre o padrão do papel.
    expect(screen.getByText('Vistorias')).toBeInTheDocument();
  });

  it('exibe o rótulo de papel correto', () => {
    const { unmount } = renderSidebar(admin);
    expect(screen.getAllByText('Gestor Predial').length).toBeGreaterThan(0);
    unmount();

    renderSidebar(sala);
    expect(screen.getAllByText('Unidade 101').length).toBeGreaterThan(0);
    expect(screen.queryByText('Gestor Predial')).not.toBeInTheDocument();
  });

  it('mostra o botão de pânico para a equipe e esconde do morador', () => {
    const { unmount } = renderSidebar(atendente);
    expect(screen.getByText('Botão de Pânico')).toBeInTheDocument();
    unmount();

    renderSidebar(sala);
    expect(screen.queryByText('Botão de Pânico')).not.toBeInTheDocument();
  });

  it('marca como ativo o item da rota atual', () => {
    renderSidebar(admin, '/encomendas');

    const link = screen.getByText('Encomendas').closest('a');
    expect(link).toHaveAttribute('href', '/encomendas');
  });
});
