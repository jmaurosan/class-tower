import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Page } from '../../types';

interface ProtectedRouteProps {
  page?: Page;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ page }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const { isPageAllowed, firstAllowedPage } = usePermissions(user);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#15191e]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redireciona para o login salvando a página que tentou acessar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status === 'Bloqueado') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#15191e] p-8 text-center transition-colors duration-300">
        <div className="size-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="material-symbols-outlined text-5xl font-bold">block</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Acesso Suspenso</h1>
        <p className="text-slate-500 max-w-md mb-8">
          Sua conta foi temporariamente bloqueada pela administração.
        </p>
      </div>
    );
  }

  // Se uma página específica for passada, verifica permissão
  if (page && !isPageAllowed(page)) {
    console.warn(`🚀 [ROUTER] Acesso negado à página ${page}. Redirecionando para ${firstAllowedPage}...`);
    return <Navigate to={`/${firstAllowedPage}`} replace />;
  }

  // Se tudo certo, renderiza a rota filha
  return <Outlet />;
};
