-- 🔍 CORREÇÃO DE RLS: TABELA AVISOS
-- Esta correção permite que usuários com o papel 'atendente' também gerenciem avisos.

-- 1. Remover políticas antigas (idempotência)
DROP POLICY IF EXISTS "Admin gerencia avisos" ON public.avisos;
DROP POLICY IF EXISTS "Staff gerencia avisos" ON public.avisos;

-- 2. Criar a nova política abrangente para Staff (Admin e Atendente)
CREATE POLICY "Staff gerencia avisos" ON public.avisos 
FOR ALL 
TO authenticated 
USING (
    exists (
        select 1 from public.profiles 
        where profiles.id = auth.uid() 
        and profiles.role IN ('admin', 'atendente')
    )
);

-- 3. Garantir que as permissões de acesso ao esquema estejam corretas
GRANT ALL ON public.avisos TO authenticated;

-- Verificação
SELECT '✅ Políticas de RLS para Avisos atualizadas com sucesso!' as status;
