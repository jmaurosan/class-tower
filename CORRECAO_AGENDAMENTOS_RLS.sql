-- 🛠️ CORREÇÃO DE PERMISSÕES: AGENDAMENTOS
-- Este script adiciona as políticas de UPDATE e DELETE que estão faltando.

-- 1. Garantir que RLS está habilitado (já deve estar)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- 2. Política de UPDATE (para cancelar ou editar)
DROP POLICY IF EXISTS "Usuários atualizam seus agendamentos" ON public.agendamentos;
CREATE POLICY "Usuários atualizam seus agendamentos" ON public.agendamentos 
FOR UPDATE TO authenticated 
USING (
    auth.uid() = user_id OR 
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
)
WITH CHECK (
    auth.uid() = user_id OR 
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- 3. Política de DELETE (para exclusão definitiva)
DROP POLICY IF EXISTS "Usuários excluem seus agendamentos" ON public.agendamentos;
CREATE POLICY "Usuários excluem seus agendamentos" ON public.agendamentos 
FOR DELETE TO authenticated 
USING (
    auth.uid() = user_id OR 
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- 4. Garantir permissões de acesso
GRANT ALL ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;

SELECT '✅ Políticas de UPDATE e DELETE adicionadas com sucesso!' as status;
