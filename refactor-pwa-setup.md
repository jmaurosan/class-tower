# Plano de Reestruturação Profissional e Configuração PWA - ClassTower

Este plano detalha a transição do projeto ClassTower para uma arquitetura em camadas (Layered Architecture), refatoração de lógica e implementação de funcionalidades PWA.

## 📋 Visão Geral
- **Objetivo**: Organizar o código para escalabilidade, extrair lógica de negócio para hooks e configurar suporte offline via PWA.
- **Tipo de Projeto**: WEB (React + Vite + TypeScript)

## 🎯 Critérios de Sucesso
- [ ] Estrutura de pastas padronizada (`src/components`, `src/hooks`, `src/services`, etc.).
- [ ] `App.tsx` limpo, focado em roteamento e layout global.
- [ ] Camada de serviço Supabase isolada.
- [ ] PWA funcional (instalável, offline mode, ícones configurados).
- [ ] Build e Dev server funcionando sem erros de importação.

## 🏗️ Nova Estrutura de Pastas
```plaintext
src/
├── assets/             # Imagens, ícones, fontes
├── components/         # Componentes React
│   ├── ui/             # Componentes genéricos (Botões, Inputs, Modais)
│   ├── layout/         # Sidebar, Header, Footer
│   └── business/       # Componentes ligados a regras de negócio
├── hooks/              # Lógica compartilhada e State Management
├── pages/              # Antigos componentes que funcionam como telas
├── services/           # Integração com Supabase e APIs externas
├── types/              # Definições de TypeScript
└── utils/              # Funções utilitárias (formatação, validação)
```

## 🛠️ Tech Stack
- **Vite Plugin PWA**: Gestão de Service Worker e Manifesto.
- **Supabase JS**: Cliente de banco de dados e Auth.
- **React Hooks**: Gerenciamento de estado extraído.

---

## 📅 Cronograma de Tarefas

### Fase 1: Fundação e PWA
- [x] **T-1: Instalação de Dependências**
  - **Agente**: `devops-engineer`
  - **Ação**: Instalar `vite-plugin-pwa` e `@supabase/supabase-js`.
- [x] **T-2: Configuração do PWA**
  - **Agente**: `devops-engineer`
  - **Ação**: Configurar `vite.config.ts` (manifest, icons, workbox).
  - **Verificar**: Presença do manifesto no build.
- [x] **T-3: Geração de Ativos PWA**
  - **Agente**: `frontend-specialist`
  - **Ação**: Gerar ícones 192x192 e 512x512.

### Fase 2: Reestruturação de Pastas
- [x] **T-4: Criação da Estrutura `src/`**
  - **Agente**: `project-planner`
  - **Ação**: Criar diretórios base.
- [x] **T-5: Migração de Arquivos**
  - **Agente**: `frontend-specialist`
  - **Ação**: Mover componentes para `src/components`, telas para `src/pages` e tipos para `src/types`.
  - **Verificar**: Ajuste de todos os imports relativos.

### Fase 3: Refatoração de Lógica
- [ ] **T-6: Extração de Hooks**
  - **Agente**: `frontend-specialist`
  - **Ação**: Criar `useAuth.ts`, `useNotifications.ts` e `useDocuments.ts`.
- [ ] **T-7: Refatoração do `App.tsx`**
  - **Agente**: `frontend-specialist`
  - **Ação**: Limpar estado local e usar os novos hooks.

### Fase 4: Camada Supabase
- [ ] **T-8: Setup de Services**
  - **Agente**: `backend-specialist`
  - **Ação**: Configurar `src/services/supabase.ts` e classes de serviço para módulos (Ex: `vistoriasService.ts`).

### Fase X: Verificação Final
- [ ] Executar `npm run build` para validar PWA e imports.
- [ ] Validar registro do Service Worker no `main.tsx`.
- [ ] Audit de UX e Performance.

---

## ✅ PHASE 2 COMPLETE
- Status: 🟢 Concluído (Estrutura e PWA)
- Data: 2026-01-28
