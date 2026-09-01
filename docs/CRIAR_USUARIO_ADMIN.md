# 🔐 CRIAR USUÁRIO ADMIN - PASSO A PASSO SIMPLES

## ✅ MÉTODO MAIS FÁCIL E SEGURO

### **Passo 1: Criar Usuário via Dashboard**

1. No Supabase Dashboard, vá em **Authentication > Users**
2. Clique no botão verde **"Add user"** (canto superior direito)
3. Preencha:
   - **Email:** `admin@classtower.com.br`
   - **Password:** `Admin@2026`
   - **✅ IMPORTANTE:** Marque **"Auto Confirm User"**
4. Clique em **"Create user"**
5. **Copie o ID do usuário** que apareceu (é um UUID longo)

---

### **Passo 2: Criar Perfil via SQL**

Vá em **SQL Editor** e execute (substitua o ID):

```sql
-- Substitua 'COLE_O_ID_AQUI' pelo ID que você copiou
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  'COLE_O_ID_AQUI',
  'Administrador',
  'admin@classtower.com.br',
  'admin'
);

-- Verificar se foi criado
SELECT * FROM public.profiles WHERE email = 'admin@classtower.com.br';
```

---

## 🚀 MÉTODO ALTERNATIVO (Script Automático)

Se preferir fazer tudo de uma vez, execute este script no **SQL Editor**:

```sql
-- CRIAR USUÁRIO ADMIN COMPLETO
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'admin@classtower.com.br';
  v_password text := 'Admin@2026';
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    -- Criar novo usuário
    v_user_id := gen_random_uuid();
    
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
      '{"provider":"email","providers":["email"]}',
      '{}',
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
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (v_user_id, 'Administrador', v_email, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', name = 'Administrador', email = v_email;

  RAISE NOTICE 'Usuário criado/atualizado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: %', v_password;
END $$;

-- Verificar resultado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';
```

---

## 📋 O que o script faz:

1. ✅ Verifica se o usuário já existe
2. ✅ Cria usuário na tabela `auth.users` com senha criptografada
3. ✅ Cria identity (necessário para autenticação)
4. ✅ Cria perfil na tabela `public.profiles` com role `admin`
5. ✅ Mostra resultado final

---

## 🧪 Testar o Login

Depois de executar:

1. Vá para `http://localhost:3000`
2. Faça login:
   - **Email:** `admin@classtower.com.br`
   - **Senha:** `Admin@2026`

---

## ⚠️ Se der erro:

1. **Copie a mensagem de erro completa**
2. **Tire um print** da tela
3. **Me envie** para eu analisar

---

## 🔍 Verificar estrutura da tabela profiles

Se quiser confirmar as colunas da tabela:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

---

**Execute o MÉTODO ALTERNATIVO (script completo) e me avise o resultado!** 🚀
