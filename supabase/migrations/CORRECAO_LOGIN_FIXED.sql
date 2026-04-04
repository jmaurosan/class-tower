-- 🔧 CORREÇÃO DEFINITIVA DO LOGIN - ClassTower (VERSÃO CORRIGIDA)
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
-- PARTE 2: VERIFICAR ESTRUTURA DA TABELA PROFILES
-- ============================================

-- Verificar se a coluna 'email' existe na tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) THEN
    -- Adicionar coluna email se não existir
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada à tabela profiles';
  ELSE
    RAISE NOTICE 'Coluna email já existe na tabela profiles';
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
    v_user_id::text, -- provider_id deve ser o mesmo que user_id convertido para texto
    v_user_id,
    format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', v_user_id, v_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  );

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

-- Verificar criação completa
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  u.created_at as usuario_criado_em,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.role,
  i.provider as identity_provider,
  i.provider_id,
  'Login: admin@classtower.com.br | Senha: Admin@2026' as credenciais
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email = 'admin@classtower.com.br';

-- Testar senha
SELECT 
  '🔐 TESTE DE SENHA' as status,
  email,
  crypt('Admin@2026', encrypted_password) = encrypted_password as senha_correta,
  CASE 
    WHEN crypt('Admin@2026', encrypted_password) = encrypted_password 
    THEN '✅ Senha está correta!'
    ELSE '❌ Senha está incorreta!'
  END as resultado
FROM auth.users
WHERE email = 'admin@classtower.com.br';

-- Verificar RLS
SELECT 
  '🔒 ROW LEVEL SECURITY' as status,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
Você deve ver:
✅ email_confirmado: true
✅ profile_email: admin@classtower.com.br
✅ full_name: Administrador
✅ role: admin
✅ provider_id: (mesmo valor do user_id)
✅ senha_correta: true

Se todos os checks estiverem OK, o login deve funcionar!
*/
