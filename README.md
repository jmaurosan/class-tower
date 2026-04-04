# 🏢 Class Tower - Sistema de Gestão Condominial

Bem-vindo ao **Class Tower**, uma plataforma premium para gestão operacional de condomínios residenciais e comerciais. O sistema foi modernizado com uma arquitetura baseada em Contextos e Roteamento avançado para garantir escalabilidade e segurança.

## 🚀 Funcionalidades

- **Dashboard Real-time:** Visão geral de métricas vitais e dados em tempo real.
- **Gestão de Encomendas:** Registro com foto, baixa digital e sistema de auditoria.
- **Portal de Avisos:** Comunicação categorizada por urgência com suporte a Push Notifications.
- **Controle de Vistorias:** Laudos técnicos detalhados com status e histórico.
- **Agendamentos:** Reserva de espaços e gestão de mudanças integrada ao calendário.
- **Segurança Avançada:** Dados protegidos por Row Level Security (RLS) e navegação controlada por perfis.

## 🏗️ Arquitetura e Tech Stack

- **Frontend:** React 19 + TypeScript + Vite.
- **Roteamento:** React Router v7 com suporte a `ProtectedRoute` para controle de acesso granular.
- **Gestão de Estado (Contextos):**
  - `AuthContext`: Centraliza a autenticação, perfil do usuário e sincronização com Supabase.
  - `ThemeContext`: Gestão nativa de Modo Escuro (Dark Mode).
- **Estilização:** Tailwind CSS com Design System premium e animações fluidas.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **PWA:** Vite Plugin PWA (Totalmente instalável em dispositivos móveis).
- **Estabilidade:** `ErrorBoundary` global para captura de falhas em tempo de execução.

## 🔒 Segurança

- **Política de Senhas:** Exigência mínima de 8 caracteres e presença de números para maior proteção.
- **Proteção de Rotas:** Uso de `ProtectedRoute` para validar sessões e permissões (Admin, Atendente, Sala).
- **Auditoria:** Logs de auditoria para ações críticas do sistema.

## 📦 Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/jmaurosan/class-tower.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente (`.env.local` ou `.env`):
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_key_anon_supabase
   VITE_ONESIGNAL_APP_ID=seu_id_onesignal
   ```

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## 📂 Estrutura do Projeto

- `/src/context`: Provedores de estado global (Auth, Theme).
- `/src/components/auth`: Componentes de proteção de rotas.
- `/src/hooks`: Hooks customizados (`useAuth`, `usePermissions`).
- `/supabase/migrations`: Scripts de banco de dados e definições de schema.

## ☁️ Deploy na Vercel

O projeto está otimizado para a Vercel. Certifique-se de configurar as variáveis de ambiente acima no painel da Vercel. As rotas SPA são tratadas automaticamente via `vercel.json`.

---
> [!NOTE]
> Este projeto foi modernizado para utilizar os padrões mais recentes do React e Supabase, focando em uma experiência de usuário (UX) premium.
