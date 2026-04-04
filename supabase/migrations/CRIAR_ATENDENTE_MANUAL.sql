-- 🔧 CRIAR USUÁRIO ATENDENTE MANUALMENTE (VERSÃO CORRIGIDA)
-- Execute este script no Supabase SQL Editor

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_identity_id uuid := gen_random_uuid();
  v_email text := 'teste@classtower.com.br'; -- ALTERE AQUI
  v_password text := 'Teste@2026'; -- ALTERE AQUI
  v_full_name text := 'Teste'; -- ALTERE AQUI
  v_role text := 'atendente'; -- ALTERE AQUI (admin, atendente, sala)
  v_encrypted_password text;
BEGIN
  -- Gerar senha criptografada
  v_encrypted_password := crypt(v_password, gen_salt('bf'));
  
  -- Criar usuário na tabela auth.users
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
  ) 
  SELECT
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    format('{"full_name":"%s","role":"%s"}', v_full_name, v_role)::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = v_email
  );

  -- Criar identity
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    v_identity_id,
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', v_user_id, v_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE provider = 'email' AND provider_id = v_user_id::text
  );

  -- Criar perfil
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  SELECT
    v_user_id,
    v_email,
    v_full_name,
    v_role,
    now(),
    now()
  WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_user_id
  );

  RAISE NOTICE '✅ Usuário criado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: %', v_password;
  RAISE NOTICE 'Role: %', v_role;
END $$;

-- Verificar se foi criado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'atende@classtower.com.br'; -- ALTERE AQUI
