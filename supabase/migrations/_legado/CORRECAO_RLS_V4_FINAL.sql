-- =============================================
-- 🛡️ CORREÇÃO RLS V4 FINAL - ClassTower
-- Resolve recursão infinita na tabela profiles
-- Execute no Supabase SQL Editor
-- =============================================

-- ============================================
-- 1. FUNÇÕES SECURITY DEFINER (sem alteração)
-- ============================================

-- Função de papel (já é SECURITY DEFINER, mantém)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função de admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função de staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (SELECT role IN ('admin', 'atendente') FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;

-- ============================================
-- 2. LIMPAR TODAS AS POLICIES DE PROFILES
-- (Evita conflitos com policies antigas)
-- ============================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    RAISE NOTICE 'Removida policy: %', pol.policyname;
  END LOOP;
END;
$$;

-- ============================================
-- 3. RECRIAR POLICIES SEM RECURSÃO
-- REGRA: SELECT nunca chama função que consulta
-- a própria tabela profiles
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer autenticado pode ler perfis (SEM chamar is_admin/is_staff)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE próprio: usuário edita seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT admin: somente admin pode inserir novos perfis
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE admin: admin pode editar qualquer perfil
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- DELETE admin: admin pode excluir perfis
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- 4. POLICY DE INSERT PARA TRIGGER DE SIGNUP
-- O trigger de criação de perfil roda como
-- service_role, mas precisamos permitir insert
-- para o fluxo de auto-cadastro
-- ============================================

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. RECARREGAR CONFIGURAÇÃO DO POSTGREST
-- ============================================

NOTIFY pgrst, 'reload config';

SELECT '✅ RLS V4 aplicada com sucesso! Policies de profiles sem recursão.' as status;
