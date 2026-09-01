-- 🔧 CORREÇÃO FINAL V4 - "UPSERT" (A PROVA DE FALHAS)
-- Este script funciona mesmo se houver triggers automáticos no banco
-- Execute no Supabase SQL Editor

-- 1. GARANTIR QUE AS COLUNAS EXISTEM (Sem isso, o trigger ou insert falham)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. LIMPEZA SEGURA (Remove o admin antigo para recriar)
DO $$
DECLARE
  v_admin_email text := 'admin@classtower.com.br';
BEGIN
  -- Remove identities e profiles associados e depois o user (Clean slate)
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_admin_email);
  DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = v_admin_email);
  DELETE FROM auth.users WHERE email = v_admin_email;
END $$;

-- 3. CRIAÇÃO DO ADMIN COM PROTEÇÃO CONTRA DUPLICIDADE
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email text := 'admin@classtower.com.br';
  v_password text := 'Admin@2026';
BEGIN
  -- A. Inserir Usuário (Auth)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, 
    crypt(v_password, gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Administrador"}'::jsonb, 
    now(), now(), '', '', '', ''
  );

  -- B. Inserir Identity (Necessário para login) - CORRIGIDO O PROVIDER_ID
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id::text, v_user_id, 
    format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb, 
    'email', now(), now(), now()
  );

  -- C. Inserir ou Atualizar Perfil (A MÁGICA "ON CONFLICT")
  -- Se o trigger criou, isso atualiza. Se não criou, isso insere.
  INSERT INTO public.profiles (
    id, email, full_name, role, created_at, updated_at
  ) VALUES (
    v_user_id, v_email, 'Administrador', 'admin', now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    full_name = 'Administrador',
    email = EXCLUDED.email;

  RAISE NOTICE '✅ SUCESSO: Admin recriado. ID: %', v_user_id;

END $$;

-- 4. VALIDAÇÃO FINAL (Para confirmar que deu certo)
SELECT 
  u.email, 
  p.full_name, 
  p.role, 
  CASE WHEN p.id IS NOT NULL THEN '✅ OK' ELSE '❌ ERRO' END as perfil_existe
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id 
WHERE u.email = 'admin@classtower.com.br';
