# 🔍 DIAGNÓSTICO COMPLETO - ClassTower Login

## Problema Identificado

O login com `admin@classtower.com.br` fica em loop infinito sem conectar.

## Erros Detectados (Console do Navegador)

1. **Erro de Conexão**: "Could not establish connection. Receiving end does not exist"
2. **Erro TypeSplit**: "e.type.split is not a function"
3. **Erro de Propriedade**: "Cannot destructure property 'table' of 'Intermediate value' as it is null"
4. **Erro 404**: Recursos não encontrados

## Causas Prováveis

### 1. Credenciais do Supabase Incorretas
- As variáveis de ambiente podem estar incorretas
- O projeto pode estar apontando para o Supabase errado

### 2. Usuário Não Criado Corretamente
- O usuário pode não ter sido criado no projeto correto
- O email pode não estar confirmado
- A senha pode estar incorreta

### 3. Problemas de CORS/Rede
- O Supabase pode estar bloqueando requisições
- Problemas de configuração de rede

## Solução Passo a Passo

### PASSO 1: Verificar Projeto Supabase Correto

Execute no SQL Editor do Supabase (projeto: xddmtbuuqairndciiepn):

```sql
-- Verificar qual projeto estamos usando
SELECT current_database();

-- Verificar se o admin existe
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as tem_senha,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';
```

**Resultado Esperado:**
- Deve mostrar o usuário com `email_confirmed_at` preenchido
- `tem_senha` deve ser `true`
- `role` deve ser `admin`

### PASSO 2: Verificar Credenciais no .env

Seu arquivo `.env` atual:
```
VITE_SUPABASE_URL=https://xddmtbuuqairndciiepn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ação:** Vá ao Supabase Dashboard → Settings → API e confirme:
- ✅ Project URL está correto
- ✅ Anon/Public Key está correto

### PASSO 3: Testar Conexão Diretamente

Execute este script SQL no Supabase para testar o login:

```sql
-- Testar autenticação direta
SELECT 
  email,
  encrypted_password,
  crypt('Admin@2026', encrypted_password) = encrypted_password as senha_correta
FROM auth.users
WHERE email = 'admin@classtower.com.br';
```

**Resultado Esperado:**
- `senha_correta` deve ser `true`

### PASSO 4: Recriar Usuário (Se Necessário)

Se os testes acima falharem, execute:

```sql
-- Deletar usuário existente
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
);
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
);
DELETE FROM auth.users WHERE email = 'admin@classtower.com.br';

-- Recriar com senha forte
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email text := 'admin@classtower.com.br';
  v_password text := 'Admin@2026';
BEGIN
  -- Criar usuário
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Criar identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, v_email, 'Administrador', 'admin');

  RAISE NOTICE 'Usuário criado com ID: %', v_user_id;
END $$;

-- Verificar criação
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  p.full_name,
  p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';
```

### PASSO 5: Limpar Cache do Navegador

1. Abra DevTools (F12)
2. Vá em Application → Storage
3. Clique em "Clear site data"
4. Recarregue a página (Ctrl+Shift+R)

### PASSO 6: Adicionar Logs de Debug

Vou criar uma versão melhorada do hook de autenticação com logs detalhados.

## Próximos Passos

1. Execute o PASSO 1 e me envie o resultado
2. Confirme se as credenciais do PASSO 2 estão corretas
3. Execute o PASSO 3 e me envie o resultado

Com essas informações, poderei identificar exatamente onde está o problema.
