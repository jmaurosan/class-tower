-- 🔍 VERIFICAÇÃO COMPLETA DA ESTRUTURA DO BANCO DE DADOS

-- 1. VERIFICAR SE A TABELA PROFILES EXISTE
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'profiles'
  AND table_schema = 'public';

-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE O USUÁRIO ADMIN EXISTE
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.encrypted_password IS NOT NULL as tem_senha
FROM auth.users u
WHERE u.email = 'admin@classtower.com.br';

-- 4. VERIFICAR SE O PERFIL DO ADMIN EXISTE
SELECT 
  p.*
FROM public.profiles p
WHERE p.id IN (
  SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
);

-- 5. VERIFICAR RELAÇÃO COMPLETA
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  u.created_at as user_criado_em,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.role,
  p.sala_numero,
  p.created_at as profile_criado_em
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@classtower.com.br';

-- 6. TESTAR SENHA
SELECT 
  email,
  crypt('Admin@2026', encrypted_password) = encrypted_password as senha_correta
FROM auth.users
WHERE email = 'admin@classtower.com.br';

-- 7. VERIFICAR IDENTITIES
SELECT 
  i.*
FROM auth.identities i
WHERE i.user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@classtower.com.br'
);

-- 8. VERIFICAR RLS (Row Level Security) NA TABELA PROFILES
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- 9. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- 10. CONTAR TOTAL DE USUÁRIOS
SELECT 
  'Total de usuários' as descricao,
  COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
  'Total de perfis' as descricao,
  COUNT(*) as quantidade
FROM public.profiles
UNION ALL
SELECT 
  'Usuários sem perfil' as descricao,
  COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
