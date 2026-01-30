# 🏢 Class Tower - Sistema de Gestão Condominial

Bem-vindo ao **Class Tower**, uma plataforma premium para gestão operacional de condomínios residenciais e comerciais.

## 🚀 Funcionalidades

- **Dashboard Real-time:** Visão geral de métricas vitais.
- **Gestão de Encomendas:** Registro com foto, baixa digital e auditoria.
- **Portal de Avisos:** Comunicação categorizada por urgência.
- **Controle de Vistorias:** Laudos técnicos detalhados com status.
- **Agendamentos:** Reserva de espaços e gestão de mudanças.
- **Segurança (RLS):** Dados protegidos por nível de acesso (Admin, Atendente, Morador).

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Estilização:** Tailwind CSS + Design System Customizado
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **PWA:** Vite Plugin PWA (Instalável em Mobile)

## 📦 Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/jmaurosan/class-tower.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz e adicione:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_key_anon_supabase
   GEMINI_API_KEY=sua_api_key (opcional se usar IA no Edge)
   ```

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## ☁️ Como Fazer Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com).
2. Clique em **"Add New Project"** e importe este repositório do GitHub.
3. Nas configurações do projeto ("Environment Variables"), adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (se necessário)
4. Clique em **Deploy**.

> **Nota:** As rotas de SPA já estão configuradas via `vercel.json`.
