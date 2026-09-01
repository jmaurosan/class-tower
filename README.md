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

- **Política de Senhas:** mínimo de 6 caracteres, com maiúscula, número e caractere especial (`src/utils/validators.ts`).
- **Cadastro de morador:** validado no servidor pela Edge Function `signup-morador`, que confere a sala e o nome do responsável antes de criar a conta. O papel do usuário é fixado em `sala` — nunca vem do cliente.
- **Gestão de usuários:** as Edge Functions `create-user` e `delete-user` exigem um administrador autenticado.
- **Proteção de Rotas:** `ProtectedRoute` valida sessão e permissões (Admin, Atendente, Sala). É uma conveniência de navegação; a autorização real é o RLS.
- **Isolamento por unidade:** aplicado por Row Level Security no Postgres — cada morador só enxerga as encomendas e avisos da própria sala.
- **Auditoria:** `audit_logs` é append-only, legível apenas por administradores, e não permite forjar o autor da ação.

> O estado de segurança do banco está em
> `supabase/migrations/20260831120000_hardening_seguranca.sql`. Os scripts em
> `supabase/migrations/_legado/` são histórico e não devem ser executados.

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
