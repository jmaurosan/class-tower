-- 🔍 VERIFICAR E CORRIGIR LOGIN DO ADMIN
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o admin existe e está correto
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as has_password,
  p.full_name,
  p.role,
  p.sala_numero
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';

-- 2. Se o admin existe mas o perfil está NULL ou incorreto, execute:
-- (Substitua 'USER_ID_AQUI' pelo ID que apareceu acima)

/*
INSERT INTO public.profiles (id, full_name, role)
VALUES (
  'USER_ID_AQUI',
  'Administrador',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET full_name = 'Administrador', role = 'admin';
*/

-- 3. Se o admin NÃO existe, crie do zero:

/*
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
*/

-- 4. Verificar novamente
SELECT 
  u.email,
  p.full_name,
  p.role,
  'Login: admin@classtower.com.br | Senha: Admin@2026' as credenciais
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';
