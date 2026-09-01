-- 🛠️ CORREÇÃO DE AUDITORIA: PERMISSÕES DE LOG
-- Este script permite que o sistema grave logs na tabela audit_logs.

-- 1. Garantir que a tabela existe (caso não exista por algum motivo)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    executed_by UUID REFERENCES auth.users(id),
    executed_by_name TEXT,
    old_data JSONB,
    new_data JSONB
);

-- 2. Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Permitir que QUALQUER usuário autenticado grave logs (INSERT)
-- Isso é necessário para que o sistema registre as ações de todos.
DROP POLICY IF EXISTS "Permitir inserção de logs para todos" ON public.audit_logs;
CREATE POLICY "Permitir inserção de logs para todos" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Garantir que apenas ADMINS possam ver os logs (SELECT)
DROP POLICY IF EXISTS "Admin acessa logs" ON public.audit_logs;
CREATE POLICY "Admin acessa logs" ON public.audit_logs FOR SELECT TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 5. Dar permissões de acesso
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

SELECT '✅ Permissões de Auditoria corrigidas!' as status;
