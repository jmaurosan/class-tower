import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OneSignalProvider } from './components/OneSignalProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RootLayout from './components/layout/RootLayout';

// Login é a primeira tela de todo visitante: fica no bundle inicial.
import Login from './pages/Login';

// As demais páginas viram chunks sob demanda. Antes, as 21 telas iam num
// único arquivo de 753 kB que todo mundo baixava só para ver o login.
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agendamentos = lazy(() => import('./pages/Agendamentos'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Avisos = lazy(() => import('./pages/Avisos'));
const DiarioBordo = lazy(() => import('./pages/DiarioBordo'));
const Documentos = lazy(() => import('./pages/Documentos'));
const PrestadoresServico = lazy(() => import('./pages/Empresas'));
const Encomendas = lazy(() => import('./pages/Encomendas'));
const Lembretes = lazy(() => import('./pages/Lembretes'));
const Salas = lazy(() => import('./pages/Salas'));
const Settings = lazy(() => import('./pages/Settings'));
const Support = lazy(() => import('./pages/Support'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Vencimentos = lazy(() => import('./pages/Vencimentos'));
const Vistorias = lazy(() => import('./pages/Vistorias'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const ResponsibilityTerm = lazy(() => import('./pages/ResponsibilityTerm'));

const CarregandoPagina: React.FC = () => (
  <div className="h-full w-full min-h-[50vh] flex items-center justify-center">
    <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
);

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <OneSignalProvider user={user}>
      <Suspense fallback={<CarregandoPagina />}>
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
      </Suspense>
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
