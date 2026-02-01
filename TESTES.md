# 🧪 Guia Completo de Testes - Class Tower CRM

## 📋 Dados de Teste Criados

### 👥 Usuários de Teste

| Perfil | E-mail | Senha | Sala | Nome |
|--------|--------|-------|------|------|
| **Admin** | `mauromonit@gmail.com` | `Mauro@2026` | - | Mauro (Admin) |
| **Atendente** | `atendente@classtower.com.br` | `Atendente@2026` | - | Carlos Silva |
| **Condômino** | `condomino1@classtower.com.br` | `Condomino@2026` | 101 | Maria Santos |
| **Condômino** | `condomino2@classtower.com.br` | `Condomino@2026` | 205 | João Oliveira |

### 📢 Avisos Criados (5 avisos)

1. **Manutenção Programada - Elevadores** (Alta prioridade)
2. **Assembleia Geral - Fevereiro/2026** (Alta prioridade)
3. **Limpeza da Caixa d'Água** (Média prioridade)
4. **Novo Horário de Funcionamento da Portaria** (Baixa prioridade)
5. **Coleta Seletiva - Novo Cronograma** (Baixa prioridade)

### 📦 Encomendas Criadas (5 encomendas)

**Pendentes (3):**
- Caixa de papelão média - Correios (Sala 101 - Maria Santos)
- Envelope grande - Sedex (Sala 205 - João Oliveira)
- Caixa grande - Amazon (Sala 305 - Pedro Costa)

**Retiradas (2):**
- Pacote pequeno - Mercado Livre (Sala 101 - Maria Santos)
- Envelope - Banco (Sala 205 - João Oliveira)

---

## 🎯 Roteiro de Testes

### **TESTE 1: Autenticação e Controle de Acesso**

#### 1.1 Login como Admin
- [ ] Acessar `http://localhost:5173`
- [ ] Fazer login com `mauromonit@gmail.com` / `Mauro@2026`
- [ ] Verificar se o nome "Mauro (Admin)" aparece no header
- [ ] Verificar se todas as opções do menu estão visíveis
- [ ] Fazer logout

#### 1.2 Login como Atendente
- [ ] Fazer login com `atendente@classtower.com.br` / `Atendente@2026`
- [ ] Verificar se o nome "Carlos Silva (Atendente)" aparece
- [ ] Verificar quais páginas estão acessíveis
- [ ] Tentar acessar "Usuários" (deve ser bloqueado)
- [ ] Fazer logout

#### 1.3 Login como Condômino
- [ ] Fazer login com `condomino1@classtower.com.br` / `Condomino@2026`
- [ ] Verificar se o nome "Maria Santos" aparece
- [ ] Verificar se vê apenas suas próprias encomendas
- [ ] Verificar se não tem acesso a funcionalidades administrativas
- [ ] Fazer logout

#### 1.4 Recuperação de Senha
- [ ] Clicar em "Esqueceu a senha?"
- [ ] Inserir um e-mail válido
- [ ] Verificar se a mensagem de confirmação aparece
- [ ] Voltar para o login

---

### **TESTE 2: Gestão de Usuários (Admin)**

#### 2.1 Visualizar Lista de Usuários
- [ ] Login como Admin
- [ ] Acessar menu "Usuários"
- [ ] Verificar se todos os 4 usuários aparecem na lista
- [ ] Verificar se as badges de perfil estão corretas (Admin, Atendente, Condômino)

#### 2.2 Criar Novo Usuário
- [ ] Clicar em "Novo Usuário"
- [ ] Preencher:
  - Nome: `Ana Paula`
  - E-mail: `ana@classtower.com.br`
  - Senha: `Ana@2026` (verificar checklist de senha)
  - Perfil: `Condômino`
  - Apartamento: `302`
- [ ] Clicar em "Criar Usuário"
- [ ] Verificar mensagem de sucesso
- [ ] Confirmar que o novo usuário aparece na lista

#### 2.3 Editar Usuário
- [ ] Clicar no botão de editar (ícone de lápis) em um usuário
- [ ] Alterar o nome
- [ ] Alterar o apartamento (se for condômino)
- [ ] Clicar em "Atualizar"
- [ ] Verificar se as alterações foram salvas

#### 2.4 Excluir Usuário
- [ ] Tentar excluir o próprio usuário (deve estar desabilitado)
- [ ] Clicar em excluir em outro usuário
- [ ] Confirmar a exclusão
- [ ] Verificar se o usuário foi removido da lista

---

### **TESTE 3: Gestão de Avisos**

#### 3.1 Visualizar Avisos
- [ ] Acessar menu "Avisos"
- [ ] Verificar se os 5 avisos de teste aparecem
- [ ] Verificar se as prioridades estão corretas (cores diferentes)
- [ ] Verificar se as datas e horários estão formatados corretamente

#### 3.2 Criar Novo Aviso
- [ ] Clicar em "Novo Aviso"
- [ ] Preencher:
  - Título: `Teste de Aviso`
  - Conteúdo: `Este é um aviso de teste criado manualmente`
  - Prioridade: `Média`
  - Data: `Amanhã`
  - Hora: `10:00`
- [ ] Clicar em "Salvar"
- [ ] Verificar mensagem de sucesso
- [ ] Confirmar que o aviso aparece na lista

#### 3.3 Editar Aviso
- [ ] Clicar em editar em um aviso existente
- [ ] Alterar o título e a prioridade
- [ ] Salvar
- [ ] Verificar se as alterações foram aplicadas

#### 3.4 Excluir Aviso
- [ ] Clicar em excluir em um aviso
- [ ] Confirmar a exclusão
- [ ] Verificar se o aviso foi removido

---

### **TESTE 4: Gestão de Encomendas**

#### 4.1 Visualizar Encomendas (Admin/Atendente)
- [ ] Acessar menu "Encomendas"
- [ ] Verificar se as 5 encomendas aparecem
- [ ] Verificar filtros:
  - [ ] Todas
  - [ ] Pendentes (deve mostrar 3)
  - [ ] Retiradas (deve mostrar 2)
- [ ] Verificar se as informações estão completas (destinatário, sala, remetente)

#### 4.2 Registrar Nova Encomenda
- [ ] Clicar em "Nova Encomenda"
- [ ] Preencher:
  - Descrição: `Caixa pequena - Shopee`
  - Sala: `101`
  - Destinatário: `Maria Santos`
  - Remetente: `Shopee`
  - Categoria: `Compras Online`
  - Características: `Caixa pequena, plástico bolha`
- [ ] Salvar
- [ ] Verificar se aparece na lista de pendentes

#### 4.3 Registrar Retirada de Encomenda
- [ ] Localizar uma encomenda pendente
- [ ] Clicar em "Registrar Retirada"
- [ ] Preencher quem retirou
- [ ] Confirmar
- [ ] Verificar se o status mudou para "Retirada"
- [ ] Verificar se a data/hora de retirada foi registrada

#### 4.4 Visualizar como Condômino
- [ ] Fazer logout e login como `condomino1@classtower.com.br`
- [ ] Acessar "Encomendas"
- [ ] Verificar se vê APENAS encomendas da sala 101
- [ ] Verificar se não vê encomendas de outras salas

---

### **TESTE 5: Dashboard e Estatísticas**

#### 5.1 Visualizar Dashboard (Admin)
- [ ] Login como Admin
- [ ] Acessar Dashboard
- [ ] Verificar se os cards de estatísticas aparecem:
  - [ ] Total de Usuários
  - [ ] Encomendas Pendentes
  - [ ] Avisos Ativos
  - [ ] Outras métricas
- [ ] Verificar se os gráficos carregam (se houver)

#### 5.2 Visualizar Dashboard (Condômino)
- [ ] Login como Condômino
- [ ] Verificar se vê apenas informações relevantes para ele
- [ ] Verificar se não vê dados administrativos

---

### **TESTE 6: Funcionalidades Offline**

#### 6.1 Simular Modo Offline
- [ ] Abrir DevTools (F12)
- [ ] Ir em "Network" > "Throttling" > "Offline"
- [ ] Tentar criar um aviso ou encomenda
- [ ] Verificar se aparece indicador de "Offline"
- [ ] Verificar se a ação fica na fila de sincronização

#### 6.2 Sincronização ao Voltar Online
- [ ] Voltar para "Online" no DevTools
- [ ] Verificar se o sistema sincroniza automaticamente
- [ ] Confirmar que os dados foram salvos no Supabase

---

### **TESTE 7: Responsividade e UI/UX**

#### 7.1 Teste em Desktop
- [ ] Redimensionar janela para diferentes tamanhos
- [ ] Verificar se o layout se adapta
- [ ] Verificar se não há quebras visuais

#### 7.2 Teste em Mobile (DevTools)
- [ ] Abrir DevTools (F12)
- [ ] Ativar modo responsivo (Ctrl+Shift+M)
- [ ] Testar em diferentes dispositivos:
  - [ ] iPhone SE
  - [ ] iPhone 12 Pro
  - [ ] iPad
  - [ ] Samsung Galaxy S20
- [ ] Verificar se o menu lateral funciona (hamburger menu)
- [ ] Verificar se os formulários são usáveis

#### 7.3 Modo Escuro/Claro
- [ ] Clicar no botão de tema (sol/lua)
- [ ] Verificar se todas as páginas mudam de tema
- [ ] Verificar se não há problemas de contraste
- [ ] Verificar se a preferência é salva (recarregar página)

---

### **TESTE 8: Performance e Carregamento**

#### 8.1 Tempo de Carregamento
- [ ] Recarregar a página (Ctrl+R)
- [ ] Verificar se carrega em menos de 3 segundos
- [ ] Verificar se não há erros no console (F12)

#### 8.2 Navegação Entre Páginas
- [ ] Navegar entre diferentes páginas do menu
- [ ] Verificar se a transição é suave
- [ ] Verificar se não há delays perceptíveis

---

### **TESTE 9: Segurança e Validações**

#### 9.1 Validação de Formulários
- [ ] Tentar criar usuário sem preencher campos obrigatórios
- [ ] Tentar usar senha fraca (deve mostrar checklist)
- [ ] Tentar usar e-mail inválido
- [ ] Verificar se as mensagens de erro são claras

#### 9.2 Controle de Acesso
- [ ] Como Condômino, tentar acessar URL direta de admin:
  - `http://localhost:5173/usuarios`
- [ ] Verificar se é bloqueado ou redirecionado
- [ ] Verificar mensagem de "Acesso Negado"

#### 9.3 Proteção de Dados
- [ ] Verificar se senhas não aparecem em texto plano
- [ ] Verificar se dados sensíveis não aparecem no console
- [ ] Verificar se tokens não são expostos

---

### **TESTE 10: Bugs Conhecidos e Edge Cases**

#### 10.1 Campos Vazios
- [ ] Tentar salvar formulários com campos vazios
- [ ] Verificar se validações impedem

#### 10.2 Caracteres Especiais
- [ ] Usar caracteres especiais em nomes (ç, á, é, etc.)
- [ ] Verificar se são salvos corretamente
- [ ] Usar emojis (se aplicável)

#### 10.3 Datas e Horários
- [ ] Criar aviso com data passada
- [ ] Criar aviso com data muito futura
- [ ] Verificar formatação de datas em diferentes fusos

#### 10.4 Múltiplas Abas
- [ ] Abrir o sistema em 2 abas
- [ ] Fazer login em uma
- [ ] Verificar se a outra atualiza
- [ ] Fazer logout em uma
- [ ] Verificar comportamento na outra

---

## 📊 Checklist de Aprovação Final

### Funcionalidades Core
- [ ] Login/Logout funcionando
- [ ] Gestão de Usuários completa
- [ ] Gestão de Avisos completa
- [ ] Gestão de Encomendas completa
- [ ] Dashboard com estatísticas
- [ ] Controle de acesso por perfil

### UI/UX
- [ ] Design responsivo (mobile e desktop)
- [ ] Modo escuro/claro funcionando
- [ ] Sem erros visuais
- [ ] Navegação intuitiva
- [ ] Mensagens de feedback claras

### Performance
- [ ] Carregamento rápido (< 3s)
- [ ] Sem travamentos
- [ ] Sem erros no console
- [ ] Sincronização offline funcionando

### Segurança
- [ ] Validações de formulário
- [ ] Controle de acesso
- [ ] Senhas criptografadas
- [ ] Sem dados sensíveis expostos

---

## 🐛 Registro de Bugs Encontrados

Use esta seção para anotar bugs durante os testes:

| # | Página | Descrição | Severidade | Status |
|---|--------|-----------|------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severidades:**
- 🔴 **Crítico**: Impede uso do sistema
- 🟡 **Alto**: Funcionalidade importante quebrada
- 🟢 **Médio**: Bug menor, workaround existe
- 🔵 **Baixo**: Cosmético, não afeta funcionalidade

---

## ✅ Aprovação Final

- [ ] Todos os testes passaram
- [ ] Bugs críticos corrigidos
- [ ] Documentação atualizada
- [ ] Sistema pronto para produção

**Data do Teste:** ___/___/______  
**Testador:** _________________  
**Aprovado por:** _________________
