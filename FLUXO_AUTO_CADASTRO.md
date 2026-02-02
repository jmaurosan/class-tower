# 🎯 NOVO FLUXO DE CADASTRO DE CONDÔMINOS

## 📋 RESUMO

Agora os condôminos podem se auto-cadastrar no sistema, criando suas próprias senhas. O sistema valida se o nome corresponde aos responsáveis cadastrados na sala.

---

## 🔄 FLUXO COMPLETO

### **1. Admin/Atendente Cadastra a Sala**

**Menu:** Cadastro de Salas

**Dados obrigatórios:**
- Número da Sala (ex: 101)
- Andar
- Nome do Responsável 1 (ex: João Silva)
- Telefone 1

**Dados opcionais:**
- Responsável 2 (ex: Maria Silva)
- Telefone 2

**Exemplo:**
```
Sala: 101
Andar: 1
Responsável 1: João Silva
Telefone 1: (11) 98765-4321
Responsável 2: Maria Silva
Telefone 2: (11) 98765-4322
```

---

### **2. Condômino Acessa o Sistema**

**URL:** `http://localhost:3000` (ou URL da Vercel)

**Tela de Login:**
- Opção: **"Primeiro acesso? Cadastre-se aqui"**

---

### **3. Condômino Preenche o Formulário de Auto-Cadastro**

**Campos:**
1. **Número da Sala/Apartamento:** `101`
2. **Nome Completo:** `João Silva` (deve corresponder ao cadastrado)
3. **Email:** `joao.silva@gmail.com`
4. **Senha:** (criar senha seguindo as regras)
5. **Confirmar Senha:** (repetir a senha)

**Validações automáticas:**
- ✅ Sala existe no banco de dados
- ✅ Nome corresponde ao Responsável 1 OU Responsável 2
- ✅ Senha atende aos requisitos de segurança
- ✅ Não existe outro usuário para esta sala

---

### **4. Sistema Valida e Cria a Conta**

**Validações:**
1. Busca sala `101` no banco
2. Compara "João Silva" com:
   - Responsável 1: "João Silva" ✅
   - Responsável 2: "Maria Silva" ❌
3. Se corresponder → Cria conta
4. Se NÃO corresponder → Erro: "Nome não corresponde aos responsáveis cadastrados"

**Após criação:**
- Mensagem de sucesso
- Redirecionamento automático para login em 3 segundos

---

### **5. Condômino Faz Login**

**Credenciais:**
- Email: `joao.silva@gmail.com`
- Senha: (a que ele criou)

**O que ele vê:**
- ✅ Dashboard (resumo)
- ✅ Portal de Avisos
- ✅ Encomendas (apenas da sala 101)
- ✅ Documentos
- ✅ Prestadores de Serviço
- ✅ Suporte

---

## 🔐 RECUPERAÇÃO DE SENHA

### **Fluxo:**

1. **Condômino clica em "Esqueceu sua senha?"** na tela de login
2. **Digite o email** cadastrado
3. **Recebe email** com link de recuperação
4. **Clica no link** do email
5. **Cria nova senha**
6. **Faz login** com a nova senha

---

## ✅ VANTAGENS DESTE FLUXO

| Antes | Depois |
|-------|--------|
| ❌ Admin cria senha para cada condômino | ✅ Condômino cria própria senha |
| ❌ Admin gerencia senhas esquecidas | ✅ Condômino recupera sozinho por email |
| ❌ Condômino pode se cadastrar em qualquer sala | ✅ Sistema valida se nome corresponde |
| ❌ Dados duplicados (sala + usuário) | ✅ Dados centralizados na tabela `salas` |
| ❌ Trabalho manual do admin | ✅ Processo automatizado |

---

## 🎨 RECURSOS IMPLEMENTADOS

### **1. Tela de Auto-Cadastro (SignUp)**
- ✅ Validação de sala + nome
- ✅ Criação de senha própria
- ✅ Toggle para mostrar/ocultar senha (ícone de olho)
- ✅ Checklist de requisitos de senha
- ✅ Mensagens de erro claras

### **2. Tela de Recuperação de Senha (ForgotPassword)**
- ✅ Envio de email com link de reset
- ✅ Mensagens de sucesso/erro

### **3. Tela de Login Atualizada**
- ✅ Botão "Primeiro acesso? Cadastre-se aqui"
- ✅ Link "Esqueceu sua senha?"
- ✅ Toggle para mostrar/ocultar senha

### **4. Componente Reutilizável**
- ✅ `PasswordInput.tsx` - Input de senha com toggle

---

## 📊 ESTRUTURA DE DADOS

### **Tabela `salas`:**
```sql
- id (UUID)
- numero (text) - ex: "101"
- andar (integer)
- nome (text) - Responsável 1
- responsavel1 (text) - Mesmo que nome
- telefone1 (text)
- responsavel2 (text) - Opcional
- telefone2 (text) - Opcional
```

### **Tabela `profiles`:**
```sql
- id (UUID) - Mesmo ID do auth.users
- full_name (text)
- email (text)
- role (text) - 'admin', 'atendente', 'sala'
- sala_numero (text) - ex: "101"
```

---

## 🧪 COMO TESTAR

### **1. Cadastrar uma Sala:**
1. Faça login como Admin
2. Vá em "Cadastro de Salas"
3. Clique em "Nova Sala"
4. Preencha:
   - Número: `202`
   - Andar: `2`
   - Responsável 1: `Maria Santos`
   - Telefone 1: `(11) 99999-9999`
5. Salvar

### **2. Auto-Cadastro do Condômino:**
1. Faça logout (ou abra janela anônima)
2. Na tela de login, clique em "Cadastre-se aqui"
3. Preencha:
   - Número da Sala: `202`
   - Nome Completo: `Maria Santos`
   - Email: `maria.santos@gmail.com`
   - Senha: `Maria@2026`
   - Confirmar Senha: `Maria@2026`
4. Clique em "Criar Conta"
5. Aguarde redirecionamento

### **3. Login do Condômino:**
1. Email: `maria.santos@gmail.com`
2. Senha: `Maria@2026`
3. Clique em "Acessar Sistema"
4. Verifique que vê apenas as encomendas da sala 202

### **4. Recuperação de Senha:**
1. Na tela de login, clique em "Esqueceu sua senha?"
2. Digite: `maria.santos@gmail.com`
3. Clique em "Enviar Email de Recuperação"
4. Verifique o email (pode demorar alguns minutos)
5. Clique no link do email
6. Crie nova senha
7. Faça login com a nova senha

---

## ⚠️ IMPORTANTE

### **Configuração do Supabase:**

Para que o envio de emails funcione, você precisa configurar o SMTP no Supabase:

1. Vá em **Project Settings > Auth**
2. Configure o **Email Provider** (SMTP)
3. Ou use o email padrão do Supabase (pode ir para spam)

### **Trigger Automático:**

Execute o script `TRIGGER_CRIAR_PERFIL.sql` no Supabase SQL Editor para garantir que o perfil seja criado automaticamente quando um usuário se cadastra.

---

## 🚀 PRÓXIMOS PASSOS (Opcional)

Se quiser melhorar ainda mais:

1. **Notificações por Email:**
   - Enviar email quando chega encomenda
   - Enviar email quando há novo aviso

2. **Confirmação de Email:**
   - Exigir que condômino confirme email antes de acessar

3. **Múltiplos Usuários por Sala:**
   - Permitir que Responsável 1 e 2 tenham contas separadas

4. **QR Code:**
   - Gerar QR Code para retirada de encomenda

---

**Tudo pronto! O sistema agora permite auto-cadastro seguro de condôminos!** 🎉
