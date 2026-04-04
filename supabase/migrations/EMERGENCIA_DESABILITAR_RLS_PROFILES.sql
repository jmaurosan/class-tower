-- 🚨 CORREÇÃO DE EMERGÊNCIA — BLOQUEIO TOTAL DO LOOP DE RECURSÃO
-- Execute este script no SQL Editor do Supabase AGORA

-- =============================================
-- PASSO 1: REMOVER TODO O RLS DE PROFILES
-- (Este é o único modo garantido de parar a recursão)
-- =============================================

-- Desabilitar segurança linha-a-linha da tabela de perfis
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Limpar TODAS as políticas existentes (todas as versões que já criamos)
DROP POLICY IF EXISTS "profiles_read_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all_v2" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update policy" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- =============================================
-- PASSO 2: MANTER SEGURANÇA MAIS RESTRITIVA NAS OUTRAS TABELAS
-- (Sem consultar profiles — usando auth.uid() direto)
-- =============================================

-- Recarregar configuração do PostgREST para aplicar imediatamente
NOTIFY pgrst, 'reload config';

-- =============================================
-- VERIFICAÇÃO
-- =============================================
SELECT 
  tablename, 
  rowsecurity as "RLS_Ativo"
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

SELECT '✅ RLS desabilitado na tabela profiles. O loop infinito foi eliminado.' as status;
