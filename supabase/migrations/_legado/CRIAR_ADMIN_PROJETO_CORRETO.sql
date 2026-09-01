-- 🔧 SCRIPT COMPLETO PARA CRIAR ADMIN NO PROJETO CORRETO
-- Execute este script no Supabase SQL Editor do projeto: xddmtbuuqairndciiepn

-- 1. VERIFICAR SE ADMIN JÁ EXISTE
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';

-- Se aparecer resultado, pule para o passo 3
-- Se NÃO aparecer resultado, execute o passo 2

-- 2. CRIAR ADMIN (Execute apenas se NÃO existir)
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
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (v_user_id, 'Administrador', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', full_name = 'Administrador';

  RAISE NOTICE 'Admin configurado com sucesso!';
END $$;

-- 3. CONFIRMAR EMAIL DO ADMIN (Execute SEMPRE)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@classtower.com.br';

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  p.full_name,
  p.role,
  'Login: admin@classtower.com.br | Senha: Admin@2026' as credenciais
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';

-- Deve aparecer:
-- email_confirmado: true
-- full_name: Administrador
-- role: admin
