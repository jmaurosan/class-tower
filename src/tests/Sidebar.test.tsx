import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/layout/Sidebar';
import { User } from '../types';

const mockAdmin: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
  permissions: {},
  avatar: ''
};

const mockSala: User = {
  id: '2',
  name: 'Sala User',
  email: 'sala@test.com',
  role: 'sala',
  sala_numero: '101',
  permissions: {},
  avatar: ''
};

describe('Sidebar Component', () => {
  it('renders admin options for admin user', () => {
    const setCurrentPage = vi.fn();
    render(<Sidebar user={mockAdmin} currentPage="dashboard" setCurrentPage={setCurrentPage} />);

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
  });

  it('does NOT render admin options for sala user', () => {
    const setCurrentPage = vi.fn();
    render(<Sidebar user={mockSala} currentPage="dashboard" setCurrentPage={setCurrentPage} />);

    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
    expect(screen.queryByText('Suporte')).not.toBeInTheDocument();
  });

  it('navigates when clicked', () => {
    const setCurrentPage = vi.fn();
    render(<Sidebar user={mockAdmin} currentPage="dashboard" setCurrentPage={setCurrentPage} />);

    // Note: Material symbols might be rendered as text if ligatures are used.
    // We search by text label which is present in the span.
    fireEvent.click(screen.getByText('Portal de Avisos'));
    expect(setCurrentPage).toHaveBeenCalledWith('avisos');
  });

  it('shows correct role label for admin', () => {
    render(<Sidebar user={mockAdmin} currentPage="dashboard" setCurrentPage={() => { }} />);
    const labels = screen.getAllByText('Gestor Predial');
    expect(labels.length).toBeGreaterThan(0);
    expect(screen.queryByText('Morador / Sala')).not.toBeInTheDocument();
  });

  it('shows correct role label for sala', () => {
    render(<Sidebar user={mockSala} currentPage="dashboard" setCurrentPage={() => { }} />);
    const labels = screen.getAllByText('Unidade 101');
    expect(labels.length).toBeGreaterThan(0);
  });
});
