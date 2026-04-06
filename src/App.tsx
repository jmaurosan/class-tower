import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OneSignalProvider } from './components/OneSignalProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RootLayout from './components/layout/RootLayout';

// Páginas Públicas
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

// Páginas Privadas
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import AuditLogs from './pages/AuditLogs';
import Avisos from './pages/Avisos';
import DiarioBordo from './pages/DiarioBordo';
import Documentos from './pages/Documentos';
import PrestadoresServico from './pages/Empresas';
import Encomendas from './pages/Encomendas';
import Lembretes from './pages/Lembretes';
import Salas from './pages/Salas';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Usuarios from './pages/Usuarios';
import Vencimentos from './pages/Vencimentos';
import Vistorias from './pages/Vistorias';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import ResponsibilityTerm from './pages/ResponsibilityTerm';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <OneSignalProvider user={user}>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/atualizar-senha" element={<UpdatePassword />} />

        {/* Rotas Protegidas (Layout com Sidebar/Header) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user!} />} />
            <Route path="/encomendas" element={<Encomendas user={user!} />} />
            <Route path="/agendamentos" element={<Agendamentos user={user!} />} />
            <Route path="/avisos" element={<Avisos user={user!} />} />
            <Route path="/diario" element={<DiarioBordo user={user!} />} />
            <Route path="/documentos" element={<Documentos user={user!} />} />
            <Route path="/empresas" element={<PrestadoresServico user={user!} />} />
            <Route path="/lembretes" element={<Lembretes />} />
            
            {/* Rotas restritas via ProtectedRoute (passando prop 'page' opcional para check extra) */}
            <Route element={<ProtectedRoute page="vistorias" />}>
              <Route path="/vistorias" element={<Vistorias user={user!} />} />
            </Route>
            <Route element={<ProtectedRoute page="vencimentos" />}>
              <Route path="/vencimentos" element={<Vencimentos />} />
            </Route>
            <Route element={<ProtectedRoute page="usuarios" />}>
              <Route path="/usuarios" element={<Usuarios currentUser={user!} />} />
            </Route>
            <Route element={<ProtectedRoute page="salas" />}>
              <Route path="/salas" element={<Salas user={user!} />} />
            </Route>
            <Route element={<ProtectedRoute page="audit-logs" />}>
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>

            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfUse />} />
            <Route path="responsibility" element={<ResponsibilityTerm />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OneSignalProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
