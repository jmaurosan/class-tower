-- 🚨 SOLUÇÃO EMERGENCIAL: DESABILITAR RLS TEMPORARIAMENTE
-- Execute este script para desabilitar RLS e permitir que a aplicação funcione

-- ============================================
-- 1. DESABILITAR RLS COMPLETAMENTE
-- ============================================

-- Desabilitar RLS em profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS em salas
ALTER TABLE public.salas DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. REMOVER TODAS AS POLÍTICAS
-- ============================================

-- Remover todas as políticas de profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

-- Remover todas as políticas de salas
DROP POLICY IF EXISTS "salas_select_policy" ON public.salas;
DROP POLICY IF EXISTS "salas_all_policy" ON public.salas;
DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;

-- ============================================
-- 3. RECARREGAR CACHE
-- ============================================
NOTIFY pgrst, 'reload config';

SELECT '✅ RLS DESABILITADO! Aplicação deve funcionar agora.' as status;
SELECT '⚠️  ATENÇÃO: Reabilite RLS em produção!' as aviso;
