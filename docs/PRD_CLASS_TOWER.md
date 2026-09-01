# PRD - Class Tower: Sistema de Gestão Predial Premium

## 1. Visão Geral do Produto
O **Class Tower** é uma plataforma SaaS (Software as a Service) desenvolvida para digitalizar e otimizar a gestão operacional de condomínios comerciais e residenciais. O sistema centraliza vistorias técnicas, controle de encomendas, diário de bordo e gestão de usuários em uma interface moderna e segura.

## 2. Objetivos Estratégicos
*   **Eficiência Operacional:** Substituir processos manuais (papel e planilhas) por fluxos digitais rápidos.
*   **Transparência e Compliance:** Garantir que todas as ações administrativas sejam auditáveis através de logs imutáveis.
*   **Segurança de Dados:** Controle rigoroso de acessos baseado em perfis e permissões.
*   **Mobilidade:** Garantir que funcionários e técnicos possam operar o sistema via smartphones com alta performance.

## 3. Público-Alvo (Personas)
*   **Administrador/Síndico:** Visão total do sistema, gestão de usuários e auditoria.
*   **Atendente/Zelador:** Operação diária de encomendas, avisos e ocorrências.
*   **Técnico:** Realização de vistorias e laudos fotográficos.
*   **Usuário (Unidade/Sala):** Visualização de avisos e recebimento de notificações de encomendas.

## 4. Requisitos Funcionais (Módulos)

### 4.1. Autenticação e Segurança
*   **Login/Signup:** Autenticação segura via Supabase Auth.
*   **Recuperação de Senha:** Fluxo de redefinição via e-mail com tokens de segurança.
*   **Controle de Perfil (RBAC):** Permissões granulares para cada página do sistema.
*   **Bloqueio de Usuários:** Capacidade de suspender acessos instantaneamente.

### 4.2. Gestão de Usuários (Profiles)
*   **Busca Avançada:** Filtro por nome, e-mail, unidade ou cargo.
*   **Cadastro Simplificado:** Criação de novos usuários com definição de permissões customizadas.
*   **Exclusão Segura:** Toda exclusão exige a inserção de um motivo textual obrigatório.

### 4.3. Vistorias Técnicas
*   **Registro Fotográfico:** Captura de fotos diretamente da câmera mobile ou upload de arquivos.
*   **Laudo Técnico:** Descrição técnica detalhada, nível de urgência e status do progresso.
*   **Edição e Auditoria:** Registra no histórico quem alterou dados do laudo original.

### 4.4. Controle de Encomendas
*   **Entrada de Carga:** Registro com foto do pacote e identificação do destinatário.
*   **Notificação:** Indicação visual de encomendas pendentes para cada unidade.
*   **Protocolo de Entrega:** Registro de data/hora e nome de quem retirou a encomenda.

### 4.5. Diário de Bordo (Ocorrências)
*   **Timeline de Eventos:** Registro cronológico de incidentes do prédio.
*   **Categorização:** Classificação por tipo e prioridade.

### 4.6. Logs de Auditoria
*   **Rastreabilidade Total:** Painel que exibe a tabela afetada, o ID do registro, a ação (Delete/Update), o usuário logado e o "antes e depois" dos dados.

## 5. Requisitos Não-Funcionais
*   **Performance:** Carregamento rápido de imagens e dados via Supabase Realtime.
*   **Design System:** Interface baseada em Tailwind CSS com suporte nativo a Dark Mode e animações fluídas.
*   **Offline First (Parcial):** Fila de sincronização para garantir que dados não sejam perdidos em áreas com sinal de internet oscilante.
*   **Escalabilidade:** Arquitetura pronta para suportar o crescimento do volume de dados e arquivos.

## 6. Stack Tecnológica
*   **Frontend:** React (Componentes Funcionais e Hooks) + TypeScript.
*   **Estilização:** Tailwind CSS + Material Symbols (Icons).
*   **Build Tool:** Vite.
*   **Backend & Infra:** Supabase (PostgreSQL, Auth, Storage, Realtime).
*   **Hospedagem:** Vercel (CI/CD automático com GitHub).

---
*Este documento serve como matriz para replicação de lógica em sistemas de gerenciamento similares.*
