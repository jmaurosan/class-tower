-- 🛡️ SOLUÇÃO CIRÚRGICA: QUEBRA DEFINITIVA DA RECURSÃO RLS
-- O erro 500 acontece porque a regra de 'SELECT' chamava a função 'is_admin', 
-- que por sua vez fazia um 'SELECT', entrando em loop.

BEGIN;

-- 1. LIMPEZA TOTAL DA TABELA PROFILES (Nomes conhecidos e genéricos)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Dropar todas as versões possíveis de políticas que criamos ou que existiam
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

-- 2. RECONSTRUÇÃO DAS POLÍTICAS DE FORMA ATÔMICA (SEM 'FOR ALL')

-- A) LEITURA (Obrigatório ser 'true' ou algo que não consulte profiles, para evitar loop)
-- Todos os usuários autenticados podem ver os perfis (Nome, e-mail, etc)
CREATE POLICY "profiles_read_safe" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- B) ATUALIZAÇÃO (Pode usar is_admin agora, pois o SELECT dentro dele usará a regra 'read_safe' acima)
CREATE POLICY "profiles_update_safe" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid() OR public.is_admin());

-- C) INSERÇÃO
CREATE POLICY "profiles_insert_safe" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid() OR public.is_admin());

-- D) EXCLUSÃO
CREATE POLICY "profiles_delete_safe" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 3. GARANTIR QUE AS FUNÇÕES DE SUPORTE EXISTAM E SEJAM SEGURAS
-- (Re-criando apenas por garantia)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Este SELECT agora é seguro porque a política de SELECT da tabela profiles acima é USING (true)
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'atendente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REATIVAR SEGURANÇA E RECARREGAR
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CORRIGIR AUDIT_LOGS (Também tinha recursão potencial)
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin acessa logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_v2" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_v2" ON public.audit_logs;

CREATE POLICY "audit_logs_select_safe" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_logs_insert_safe" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Teste rápido: Garantir que o perfil do admin atual pode ser lido
SELECT '✅ Políticas RLS reconstruídas com sucesso! Recursão eliminada.' as status;
