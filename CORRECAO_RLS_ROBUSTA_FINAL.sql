-- 🛡️ CORREÇÃO DE RLS ROBUSTA E DEFINITIVA - CLASSTOWER
-- Este script resolve a recursão infinita e implementa segurança baseada em papéis (Admin/Atendente).

-- ============================================
-- 1. FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- Estas funções rodam com privilégios de sistema, evitando recursão.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role IN ('admin', 'atendente') FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. TABELA: PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

-- Qualquer um logado vê os perfis (necessário para buscas de destinatário/staff)
CREATE POLICY "Profiles visíveis para autenticados" 
ON public.profiles FOR SELECT TO authenticated USING (true);

-- Usuários editam apenas seu próprio perfil
CREATE POLICY "Usuários editam próprio perfil" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin gerencia tudo
CREATE POLICY "Admin gerencia perfis" 
ON public.profiles FOR ALL TO authenticated 
USING (public.is_admin());

-- ============================================
-- 3. TABELA: SALAS (UNIDADES)
-- ============================================
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;

CREATE POLICY "Salas visíveis para todos" 
ON public.salas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff gerencia salas" 
ON public.salas FOR ALL TO authenticated 
USING (public.is_staff());

-- ============================================
-- 4. TABELA: ENCOMENDAS
-- ============================================
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Qualquer auth pode ver encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Auth pode criar encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Auth pode atualizar encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Auth pode deletar encomendas" ON public.encomendas;

-- Todos veem (para buscar suas encomendas), mas Staff gerencia
CREATE POLICY "Leitura de encomendas" 
ON public.encomendas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff gerencia encomendas" 
ON public.encomendas FOR ALL TO authenticated 
USING (public.is_staff());

-- ============================================
-- 5. TABELA: EMPRESAS
-- ============================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Empresas visíveis para todos" ON public.empresas;
DROP POLICY IF EXISTS "Admin gerencia empresas" ON public.empresas;

CREATE POLICY "Empresas visíveis para todos" 
ON public.empresas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia empresas" 
ON public.empresas FOR ALL TO authenticated 
USING (public.is_admin());

-- ============================================
-- 6. TABELA: AUDIT_LOGS
-- ============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin acessa logs" ON public.audit_logs;

CREATE POLICY "Apenas admin vê logs" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (public.is_admin());

-- ============================================
-- 7. TABELA: AGENDAMENTOS
-- ============================================
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem seus agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários criam agendamentos" ON public.agendamentos;

CREATE POLICY "Visão de agendamentos" 
ON public.agendamentos FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Criação de agendamentos" 
ON public.agendamentos FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Gestão de agendamentos" 
ON public.agendamentos FOR UPDATE TO authenticated 
USING (auth.uid() = user_id OR public.is_staff());

-- ============================================
-- FINALIZAÇÃO
-- ============================================
NOTIFY pgrst, 'reload config';
SELECT '✅ RLS ROBUSTA aplicada com sucesso!' as status;
