-- 🛡️ CORREÇÃO DE RLS ROBUSTA V2 - CLASSTOWER (RESOLUÇÃO DE LOOP)
-- Execute este script no Supabase SQL Editor para corrigir a falha no login.

-- ============================================
-- 1. LIMPEZA E REDEFINIÇÃO DAS FUNÇÕES
-- ============================================

DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_staff();

-- Função Robusta de Papel (Security Definer + Search Path)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Se o uid for nulo, sai imediatamente
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
-- 3. REVISÃO DE POLÍTICAS (SIMPLIFICAÇÃO PARA CARGA INICIAL)
-- Garante que a primeira leitura do perfil nunca trave.
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles visíveis para autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Usuários editam próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admin gerencia perfis" ON public.profiles;

-- Política de Leitura SEGURA (Evita qualquer função aqui na carga inicial)
CREATE POLICY "Profiles leitura inicial" 
ON public.profiles FOR SELECT TO authenticated 
USING (true);

-- Política de Edição (Usa verificação de ID direta)
CREATE POLICY "Profiles edicao propria" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Política de Admin (Usa a função SECURITY DEFINER que não gera loop)
CREATE POLICY "Profiles gestao admin" 
ON public.profiles FOR ALL TO authenticated 
USING (public.is_admin());

-- ============================================
-- 4. REVISÃO DE OUTRAS TABELAS CRÍTICAS
-- ============================================
-- SALAS
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Salas visíveis para todos" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
CREATE POLICY "Salas select" ON public.salas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Salas staff" ON public.salas FOR ALL TO authenticated USING (public.is_staff());

-- ENCOMENDAS
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Staff gerencia encomendas" ON public.encomendas;
CREATE POLICY "Encomendas select" ON public.encomendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Encomendas staff" ON public.encomendas FOR ALL TO authenticated USING (public.is_staff());

-- ============================================
-- FINALIZAÇÃO
-- ============================================
NOTIFY pgrst, 'reload config';
SELECT '✅ RLS V2 aplicada! Login deve estar liberado.' as status;
