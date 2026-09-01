-- 🔧 CORREÇÃO DEFINITIVA DO LOGIN - ClassTower (VERSÃO V3 - FINAL)
-- Execute este script no Supabase SQL Editor
-- Projeto: xddmtbuuqairndciiepn

-- ============================================
-- PARTE 1: LIMPEZA COMPLETA
-- ============================================

-- Deletar usuário admin existente (se houver)
DO $$
BEGIN
  -- Deletar identities
  DELETE FROM auth.identities 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
  );
  
  -- Deletar perfil
  DELETE FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
  );
  
  -- Deletar usuário
  DELETE FROM auth.users 
  WHERE email = 'admin@classtower.com.br';
  
  RAISE NOTICE 'Limpeza concluída!';
END $$;

-- ============================================
-- PARTE 2: VERIFICAR E CORRIGIR ESTRUTURA DA TABELA PROFILES
-- ============================================

DO $$
BEGIN
  -- 1. Verificar coluna 'email'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada à tabela profiles';
  END IF;

  -- 2. Verificar coluna 'created_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Coluna created_at adicionada à tabela profiles';
  END IF;

  -- 3. Verificar coluna 'updated_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Coluna updated_at adicionada à tabela profiles';
  END IF;
END $$;

-- ============================================
-- PARTE 3: CRIAR USUÁRIO ADMIN CORRETAMENTE
-- ============================================

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_identity_id uuid := gen_random_uuid();
  v_email text := 'admin@classtower.com.br';
  v_password text := 'Admin@2026';
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
    '{"full_name":"Administrador"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Criar identity com provider_id correto
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
  );

  -- Criar perfil (Agora seguro pois as colunas foram verificadas)
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
    'Administrador',
    'admin',
    now(),
    now()
  );

  RAISE NOTICE 'Usuário admin criado com sucesso! ID: %', v_user_id;
END $$;

-- ============================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  u.id as user_id,
  u.email,
  p.full_name,
  p.role,
  p.created_at as profile_created_at,
  'Login: admin@classtower.com.br | Senha: Admin@2026' as credenciais
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';
