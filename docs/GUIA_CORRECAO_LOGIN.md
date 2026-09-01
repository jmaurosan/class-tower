# 🚨 GUIA DE CORREÇÃO DO LOGIN - ClassTower

## Problema Atual
O login com `admin@classtower.com.br` fica em loop infinito e não conecta.

## Solução em 5 Passos

### 📋 PASSO 1: Executar Script de Correção

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `CORRECAO_DEFINITIVA_LOGIN.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **RUN**

**O que este script faz:**
- ✅ Remove qualquer usuário admin antigo
- ✅ Verifica se a estrutura da tabela `profiles` está correta
- ✅ Cria o usuário admin corretamente
- ✅ Confirma o email automaticamente
- ✅ Testa se a senha está correta
- ✅ Mostra o resultado final

### 📊 PASSO 2: Verificar Resultado

Após executar o script, você deve ver na aba **Results**:

```
✅ VERIFICAÇÃO FINAL
- email_confirmado: true
- profile_email: admin@classtower.com.br
- full_name: Administrador
- role: admin

🔐 TESTE DE SENHA
- senha_correta: true
- resultado: ✅ Senha está correta!
```

**Se algum item estiver ❌ (incorreto):**
- Me envie um print da tela de resultados
- Vou investigar o problema específico

### 🔑 PASSO 3: Verificar Credenciais do Supabase

1. No Supabase Dashboard, vá em **Settings** → **API**
2. Copie:
   - **Project URL**
   - **anon/public key**

3. Abra o arquivo `.env` do projeto
4. Confirme se os valores estão EXATAMENTE iguais:

```env
VITE_SUPABASE_URL=https://xddmtbuuqairndciiepn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Se estiverem diferentes:**
- Atualize o arquivo `.env` com os valores corretos
- Reinicie o servidor (`npm run dev`)

### 🧹 PASSO 4: Limpar Cache do Navegador

1. Abra o DevTools (F12)
2. Vá em **Application** → **Storage**
3. Clique em **Clear site data**
4. Feche o DevTools
5. Recarregue a página com **Ctrl + Shift + R**

### 🔍 PASSO 5: Testar Login com Logs

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Tente fazer login com:
   - **Email:** `admin@classtower.com.br`
   - **Senha:** `Admin@2026`

4. Observe os logs no console. Você deve ver:

```
🔐 [AUTH] Iniciando login... { email: 'admin@classtower.com.br' }
🔐 [AUTH] Supabase URL: https://xddmtbuuqairndciiepn.supabase.co
✅ [AUTH] Login bem-sucedido! { ... }
👤 [PROFILE] Buscando perfil... { id: '...' }
✅ [PROFILE] Perfil encontrado: { ... }
```

**Se aparecer algum erro:**
- Tire um print do console completo
- Me envie para análise

## 🆘 Troubleshooting

### Erro: "Invalid login credentials"
**Causa:** Senha incorreta ou usuário não existe
**Solução:** Execute novamente o `CORRECAO_DEFINITIVA_LOGIN.sql`

### Erro: "Could not establish connection"
**Causa:** Credenciais do Supabase incorretas
**Solução:** Verifique o PASSO 3

### Erro: "Cannot destructure property 'table'"
**Causa:** Cliente Supabase não inicializado corretamente
**Solução:** 
1. Verifique se o `.env` está correto
2. Reinicie o servidor
3. Limpe o cache do navegador

### Login fica em loop infinito
**Causa:** Perfil não encontrado após autenticação
**Solução:**
1. Verifique se o perfil foi criado: Execute `VERIFICAR_ESTRUTURA_COMPLETA.sql`
2. Se não houver perfil, execute `CORRECAO_DEFINITIVA_LOGIN.sql` novamente

## 📝 Checklist Final

Antes de testar o login, confirme:

- [ ] Script `CORRECAO_DEFINITIVA_LOGIN.sql` executado com sucesso
- [ ] Todos os checks da verificação estão ✅
- [ ] Arquivo `.env` tem as credenciais corretas
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Cache do navegador limpo
- [ ] DevTools aberto na aba Console

## 🎯 Próximos Passos

1. Execute o PASSO 1 (script SQL)
2. Me envie um print do resultado
3. Se tudo estiver OK, execute os PASSOS 2-5
4. Se der erro em qualquer etapa, me envie o print do erro

Estou aqui para ajudar! 🚀
