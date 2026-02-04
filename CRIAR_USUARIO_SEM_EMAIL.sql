-- 🔧 SOLUÇÃO: CRIAR USUÁRIOS SEM LIMITE DE EMAIL
-- Este script permite criar usuários diretamente no banco de dados
-- contornando o limite de taxa de emails do Supabase Auth

-- ============================================
-- OPÇÃO 1: DESABILITAR CONFIRMAÇÃO DE EMAIL (DESENVOLVIMENTO)
-- ============================================
-- Esta é a solução mais rápida para ambiente de desenvolvimento
-- ATENÇÃO: Não use em produção!

-- Você precisa fazer isso no painel do Supabase:
-- 1. Vá em Authentication > Settings
-- 2. Desabilite "Enable email confirmations"
-- 3. Tente criar o usuário novamente

-- ============================================
-- OPÇÃO 2: CRIAR USUÁRIO MANUALMENTE NO BANCO
-- ============================================
-- Use este script para criar usuários diretamente sem enviar email

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_identity_id uuid := gen_random_uuid();
  v_email text := 'atende@classtower.com.br'; -- ALTERE AQUI
  v_password text := 'Atende@123'; -- ALTERE AQUI
  v_full_name text := 'Atendente Teste'; -- ALTERE AQUI
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
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_password,
    now(), -- Email já confirmado
    '{"provider":"email","providers":["email"]}'::jsonb,
    format('{"full_name":"%s"}', v_full_name)::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING;

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
  ) VALUES (
    v_identity_id,
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', v_user_id, v_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Criar perfil
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_email,
    v_full_name,
    v_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Usuário criado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: %', v_password;
  RAISE NOTICE 'ID: %', v_user_id;
END $$;

-- ============================================
-- VERIFICAR USUÁRIO CRIADO
-- ============================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'atende@classtower.com.br'; -- ALTERE AQUI
