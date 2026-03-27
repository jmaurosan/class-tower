-- 🛡️ CORREÇÃO DE RLS ROBUSTA V3 - CLASSTOWER (RESOLUÇÃO DE DEPENDÊNCIAS)
-- Execute este script no Supabase SQL Editor.

-- ============================================
-- 1. RE-DEFINIÇÃO DAS FUNÇÕES (SEM DROP PARA EVITAR ERROS DE DEPENDÊNCIA)
-- ============================================

-- Função Robusta de Papel
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

-- Função Robusta de Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função Robusta de Staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (SELECT role IN ('admin', 'atendente') FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. PERMISSÕES DE EXECUÇÃO
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;

-- ============================================
-- 3. GARANTIR POLÍTICAS BÁSICAS (UPSERT POLICIES)
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles leitura inicial" ON public.profiles;
CREATE POLICY "Profiles leitura inicial" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles edicao propria" ON public.profiles;
CREATE POLICY "Profiles edicao propria" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles gestao admin" ON public.profiles;
CREATE POLICY "Profiles gestao admin" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- SALAS
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Salas select" ON public.salas;
CREATE POLICY "Salas select" ON public.salas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Salas staff" ON public.salas;
CREATE POLICY "Salas staff" ON public.salas FOR ALL TO authenticated USING (public.is_staff());

-- ENCOMENDAS
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Encomendas select" ON public.encomendas;
CREATE POLICY "Encomendas select" ON public.encomendas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Encomendas staff" ON public.encomendas;
CREATE POLICY "Encomendas staff" ON public.encomendas FOR ALL TO authenticated USING (public.is_staff());

-- ============================================
-- FINALIZAÇÃO
-- ============================================
NOTIFY pgrst, 'reload config';
SELECT '✅ RLS V3 (Resiliente) aplicada! Verifique o login agora.' as status;
