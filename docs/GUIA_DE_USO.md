# 📖 Guia Rápido de Uso - Class Tower CRM

## 🎯 Para Administradores

### Primeiro Acesso
1. Acesse: `http://localhost:5173` (local) ou `https://seu-projeto.vercel.app` (produção)
2. Faça login com suas credenciais de administrador
3. Você terá acesso total a todas as funcionalidades

---

### 👥 Gerenciar Usuários

#### Criar Novo Usuário
1. Clique em **"Usuários"** no menu lateral
2. Clique no botão verde **"Novo Usuário"**
3. Preencha os dados:
   - **Nome Completo**: Nome do usuário
   - **E-mail**: E-mail corporativo (será usado para login)
   - **Senha Inicial**: Mínimo 6 caracteres (o usuário pode alterar depois)
   - **Perfil de Acesso**:
     - **Administrador**: Acesso total ao sistema
     - **Atendente**: Pode gerenciar avisos e encomendas
     - **Condômino**: Acesso limitado às suas próprias informações
   - **Número do Apartamento**: Apenas para condôminos
4. Clique em **"Criar Usuário"**

#### Editar Usuário
1. Na lista de usuários, clique no ícone de **lápis** (editar)
2. Altere os dados necessários
3. Clique em **"Atualizar"**

#### Excluir Usuário
1. Clique no ícone de **lixeira** (excluir)
2. Confirme a exclusão
3. ⚠️ **Atenção**: Esta ação não pode ser desfeita!

---

### 📢 Gerenciar Avisos

#### Criar Novo Aviso
1. Clique em **"Avisos"** no menu lateral
2. Clique em **"Novo Aviso"**
3. Preencha:
   - **Título**: Título curto e descritivo
   - **Conteúdo**: Descrição completa do aviso
   - **Prioridade**:
     - 🔴 **Alta**: Urgente, requer atenção imediata
     - 🟡 **Média**: Importante, mas não urgente
     - 🟢 **Baixa**: Informativo
   - **Data**: Quando o aviso é relevante
   - **Hora**: Horário relacionado ao aviso
4. Clique em **"Salvar"**

#### Editar Aviso
1. Clique no ícone de **lápis** no aviso desejado
2. Faça as alterações
3. Salve

#### Excluir Aviso
1. Clique no ícone de **lixeira**
2. Confirme a exclusão

---

### 📦 Gerenciar Encomendas

#### Registrar Nova Encomenda
1. Clique em **"Encomendas"** no menu lateral
2. Clique em **"Nova Encomenda"**
3. Preencha:
   - **Descrição**: Ex: "Caixa média - Correios"
   - **Sala**: Número do apartamento do destinatário
   - **Destinatário**: Nome do morador
   - **Remetente**: Empresa/pessoa que enviou (Ex: Correios, Amazon)
   - **Categoria**: Tipo de encomenda
   - **Características**: Detalhes visuais (tamanho, cor, peso)
4. Clique em **"Salvar"**

#### Registrar Retirada
1. Localize a encomenda na lista de **Pendentes**
2. Clique em **"Registrar Retirada"**
3. Informe quem retirou
4. Confirme
5. A encomenda mudará para status **"Retirada"** automaticamente

#### Filtrar Encomendas
- **Todas**: Mostra todas as encomendas
- **Pendentes**: Apenas encomendas aguardando retirada
- **Retiradas**: Encomendas já retiradas (histórico)

---

### 📊 Dashboard

O Dashboard mostra:
- **Total de Usuários** cadastrados
- **Encomendas Pendentes** (aguardando retirada)
- **Avisos Ativos** publicados
- **Outras estatísticas** relevantes

Acesse clicando em **"Dashboard"** no menu.

---

## 🎯 Para Atendentes

### O que você pode fazer:
- ✅ Gerenciar **Avisos** (criar, editar, excluir)
- ✅ Gerenciar **Encomendas** (registrar, dar baixa)
- ✅ Visualizar **Dashboard**
- ❌ **NÃO** pode gerenciar usuários (apenas Admin)

### Fluxo Típico de Trabalho

#### Ao Chegar uma Encomenda:
1. Acesse **"Encomendas"**
2. Clique em **"Nova Encomenda"**
3. Registre todos os dados
4. Informe o morador (por telefone, WhatsApp, etc.)

#### Quando o Morador Retirar:
1. Localize a encomenda
2. Clique em **"Registrar Retirada"**
3. Informe quem retirou
4. Pronto! A encomenda sai da lista de pendentes

#### Publicar Avisos:
1. Acesse **"Avisos"**
2. Crie novo aviso com as informações
3. Escolha a prioridade correta
4. Publique

---

## 🎯 Para Condôminos

### O que você pode fazer:
- ✅ Visualizar **suas encomendas** (apenas do seu apartamento)
- ✅ Visualizar **avisos** publicados
- ✅ Ver informações do **Dashboard** (limitado)
- ❌ **NÃO** vê encomendas de outros apartamentos
- ❌ **NÃO** pode criar/editar avisos ou encomendas

### Como Usar

#### Verificar Encomendas:
1. Faça login
2. Acesse **"Encomendas"**
3. Você verá apenas encomendas do **seu apartamento**
4. Verifique se há encomendas **pendentes** para retirar

#### Ver Avisos:
1. Acesse **"Avisos"**
2. Leia os comunicados importantes
3. Fique atento aos avisos de **alta prioridade** (vermelho)

---

## 🌓 Trocar Tema (Claro/Escuro)

1. Clique no ícone de **sol** ☀️ ou **lua** 🌙 no canto superior direito
2. O tema mudará instantaneamente
3. Sua preferência será salva automaticamente

---

## 🔐 Alterar Senha

1. Faça logout
2. Na tela de login, clique em **"Esqueceu a senha?"**
3. Digite seu e-mail
4. Siga as instruções enviadas por e-mail
5. Defina uma nova senha

**Requisitos de Senha:**
- ✅ Mínimo 6 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial (@, #, $, etc.)

---

## 📱 Usar no Celular

O sistema é **totalmente responsivo**:

1. Acesse pelo navegador do celular
2. O menu aparecerá como **ícone de 3 linhas** (☰)
3. Clique para abrir/fechar o menu
4. Todas as funcionalidades funcionam igual

---

## 🆘 Problemas Comuns

### Não consigo fazer login
- ✅ Verifique se o e-mail está correto
- ✅ Verifique se a senha está correta (cuidado com maiúsculas/minúsculas)
- ✅ Tente redefinir a senha

### Não vejo minhas encomendas
- ✅ Verifique se está logado com o usuário correto
- ✅ Confirme se o apartamento está cadastrado corretamente
- ✅ Entre em contato com o administrador

### Página em branco
- ✅ Recarregue a página (F5)
- ✅ Limpe o cache do navegador
- ✅ Tente em outro navegador

### Sistema lento
- ✅ Verifique sua conexão com a internet
- ✅ Feche abas desnecessárias do navegador
- ✅ Recarregue a página

---

## 📞 Suporte

Se precisar de ajuda:

1. **Administrador do Sistema**: Entre em contato com o administrador do condomínio
2. **Suporte Técnico**: [Inserir contato de suporte]
3. **E-mail**: [Inserir e-mail de suporte]

---

## 🎓 Dicas de Uso

### Para Administradores:
- 📌 Crie usuários com e-mails corporativos
- 📌 Use senhas fortes e únicas
- 📌 Revise periodicamente a lista de usuários
- 📌 Exclua usuários inativos
- 📌 Mantenha avisos importantes sempre visíveis

### Para Atendentes:
- 📌 Registre encomendas imediatamente ao recebê-las
- 📌 Seja detalhado nas características (facilita identificação)
- 📌 Dê baixa assim que o morador retirar
- 📌 Use prioridades corretas nos avisos

### Para Condôminos:
- 📌 Verifique encomendas regularmente
- 📌 Leia os avisos com atenção
- 📌 Mantenha seus dados atualizados
- 📌 Entre em contato com a portaria se tiver dúvidas

---

## ✅ Boas Práticas

### Segurança:
- 🔒 Nunca compartilhe sua senha
- 🔒 Faça logout ao usar computadores compartilhados
- 🔒 Altere sua senha periodicamente
- 🔒 Use senhas diferentes para cada sistema

### Organização:
- 📋 Mantenha descrições claras e objetivas
- 📋 Use categorias consistentes
- 📋 Exclua dados antigos desnecessários
- 📋 Revise encomendas retiradas periodicamente

---

## 🚀 Atalhos de Teclado (Desktop)

- `Ctrl + K`: Busca rápida (se disponível)
- `Esc`: Fechar modais/pop-ups
- `Tab`: Navegar entre campos de formulário
- `Enter`: Submeter formulário

---

## 📱 Compatibilidade

### Navegadores Suportados:
- ✅ Google Chrome (recomendado)
- ✅ Microsoft Edge
- ✅ Mozilla Firefox
- ✅ Safari (Mac/iOS)

### Dispositivos:
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet (iPad, Android)
- ✅ Smartphone (iPhone, Android)

---

**Versão do Guia:** 1.0  
**Última Atualização:** Janeiro 2026
