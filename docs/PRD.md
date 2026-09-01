# 📄 Product Requirements Document (PRD) - Class Tower

## 1. Visão Geral do Produto
O **Class Tower** é uma plataforma SaaS premium de gestão condominial e operacional, projetada para modernizar a comunicação, segurança e administração de edifícios residenciais e comerciais de alto padrão. O sistema foca em sincronização em tempo real, transparência de dados e facilidade de uso para gestores e moradores.

---

## 2. Objetivos Estratégicos
*   **Centralização:** Unificar todas as operações do condomínio em um único portal.
*   **Digitalização:** Eliminar o uso de registros em papel (diário de bordo físico, listas de encomendas).
*   **Segurança Jurídica:** Garantir evidências fotográficas e logs de auditoria para todas as movimentações.
*   **Comunicação em Tempo Real:** Reduzir o ruído de comunicação entre administração e moradores.

---

## 3. Público-Alvo e Personas
1.  **Gestor Predial (Admin):** Responsável por tomar decisões, auditar logs e gerenciar permissões.
2.  **Equipe Operacional (Atendente/Porteiro):** Responsável pelo registro de encomendas, avisos e ocorrências.
3.  **Morador/Condômino (Sala):** Usuário que consome informações, retira encomendas e acessa documentos da unidade.

---

## 4. Requisitos Funcionais

### 4.1. Dashboard (Métricas em Tempo Real)
*   Visualização de indicadores de performance (KPIs) como taxa de ocupação, encomendas pendentes e vistorias.
*   Gráficos dinâmicos de visitas técnicas e incidentes mensais.

### 4.2. Portal de Avisos (Comunicados)
*   Criação de avisos com níveis de prioridade (Baixa, Média, Alta, Crítica).
*   Suporte a cores temáticas por urgência.
*   Sincronização instantânea para todos os usuários logados.

### 4.3. Gestão de Encomendas
*   Registro de entrada com captura de foto via câmera (Desktop/Mobile).
*   Armazenamento de fotos no Supabase Storage.
*   Sistema de baixa com registro de quem retirou e carimbo de tempo (Timestamp).

### 4.4. Diário de Bordo (Ocorrências)
*   Registro de incidentes categorizados (Manutenção, Segurança, etc.).
*   Atribuição automática do usuário que realizou o registro.
*   Histórico imutável de ocorrências.

### 4.5. Calendário e Agendamentos
*   Agendamento de mudanças, reformas e reservas de áreas comuns.
*   Status de confirmação controlado pela administração.

### 4.6. Gestão de Unidades (Salas)
*   Cadastro detalhado de responsáveis e contatos de cada unidade.
*   Mapa visual da ocupação do edifício.

### 4.7. Repositório de Documentos
*   Upload de arquivos (PDF, Imagens) organizados por categorias (Atas, Plantas, Seguros).
*   Controle de acesso granular (quem pode ver o quê).

### 4.8. Cadastro de Prestadores (Empresas)
*   Catálogo de empresas homologadas e avaliações.
*   Gestão de status (Homologada, Em Revisão, Inativa).

---

## 5. Requisitos Não-Funcionais

### 5.1. Segurança e Privacidade
*   **Autenticação:** Gerenciada pelo Supabase Auth.
*   **RBAC (Role-Based Access Control):** Proteção de nível de linha (RLS) no banco de dados baseada em perfis (`admin`, `atendente`, `sala`).
*   **CORS:** Configuração restrita para domínios autorizados.

### 5.2. Performance e Escalabilidade
*   Interface reativa (React + Vite).
*   Utilização de Supabase Realtime para evitar F5 (atualização forçada).
*   Otimização de imagens para o Storage.

### 5.3. Design e UX
*   **Premium Aesthetics:** Interface limpa, moderna e responsiva.
*   **Dark Mode:** Suporte completo a tema escuro/claro.
*   **Micro-interações:** Feedback visual imediato em ações de salvamento.

---

## 6. Stack Tecnológica
*   **Frontend:** React (TypeScript), Tailwind CSS.
*   **Backend as a Service:** Supabase (Auth, Database, Storage, Realtime).
*   **Gráficos:** Recharts.
*   **Ícones:** Google Material Symbols.

---

## 7. Roadmap Futuro
*   **V2:** App Mobile Nativo (PWA já em implementação).
*   **V2:** Notificações Push via Service Workers.
*   **V3:** Integração com dispositivos de IoT (Câmeras e Sensores).
*   **V3:** Módulo de Vistorias Técnicas com IA para análise de fotos.

---
*Class Tower - 2026. Documento de Requisitos de Produto.*
