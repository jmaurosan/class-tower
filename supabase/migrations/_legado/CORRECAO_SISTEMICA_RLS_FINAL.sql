-- 🛡️ SOLUÇÃO SISTÊMICA: FIM DA RECURSÃO RLS & ERRO 500
-- Este script cria funções de segurança que bypassam o RLS para evitar o loop infinito.

BEGIN;

-- ============================================
-- 1. CRIAR FUNÇÕES DE APOIO (SECURITY DEFINER)
-- ============================================
-- O segredo está no 'SECURITY DEFINER', que faz a função rodar como o dono do banco (postgres), 
-- ignorando as políticas de RLS e quebrando a recursão.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'atendente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 2. LIMPAR E RECONFIGURAR TABELA: profiles
-- ============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update policy" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- SELECT: Todos autenticados podem ver perfis
CREATE POLICY "profiles_select_v2" ON public.profiles FOR SELECT TO authenticated USING (true);

-- UPDATE: Usuário atualiza a si mesmo OU é admin
CREATE POLICY "profiles_update_v2" ON public.profiles FOR UPDATE TO authenticated 
USING (id = auth.uid() OR public.is_admin());

-- ALL: Admin tem acesso total (sem recursão agora!)
CREATE POLICY "profiles_admin_all_v2" ON public.profiles FOR ALL TO authenticated 
USING (public.is_admin());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 3. ATUALIZAR OUTRAS TABELAS (REMOVER SUBQUERIES RECURSIVAS)
-- ============================================

-- TABELA: salas
ALTER TABLE public.salas DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
CREATE POLICY "salas_select_v2" ON public.salas FOR SELECT TO authenticated USING (true);
CREATE POLICY "salas_staff_all_v2" ON public.salas FOR ALL TO authenticated USING (public.is_staff());
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- TABELA: avisos
ALTER TABLE public.avisos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Avisos visíveis para todos" ON public.avisos;
DROP POLICY IF EXISTS "Admin gerencia avisos" ON public.avisos;
CREATE POLICY "avisos_select_v2" ON public.avisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "avisos_admin_all_v2" ON public.avisos FOR ALL TO authenticated USING (public.is_admin());
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- TABELA: agendamentos
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem seus agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários criam agendamentos" ON public.agendamentos;
CREATE POLICY "agendamentos_select_v2" ON public.agendamentos FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR public.is_staff());
CREATE POLICY "agendamentos_insert_v2" ON public.agendamentos FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id OR public.is_staff());
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- TABELA: empresas
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Empresas visíveis para todos" ON public.empresas;
DROP POLICY IF EXISTS "Admin gerencia empresas" ON public.empresas;
CREATE POLICY "empresas_select_v2" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "empresas_admin_all_v2" ON public.empresas FOR ALL TO authenticated USING (public.is_admin());
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- TABELA: audit_logs
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin acessa logs" ON public.audit_logs;
CREATE POLICY "audit_logs_select_v2" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_logs_insert_v2" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

SELECT '✅ Sistema estabilizado! Funções de segurança criadas e RLS corrigido sem recursão.' as status;
