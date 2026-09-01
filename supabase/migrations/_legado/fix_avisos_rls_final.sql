-- 📢 CORREÇÃO FINAL DE RLS E PERMISSÕES: AVISOS
-- Este script garante que todos possam ver os avisos e que a equipe possa gerenciá-los.

-- 1. Garantir que RLS está habilitado
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Avisos visíveis para todos" ON public.avisos;
DROP POLICY IF EXISTS "Staff gerencia avisos" ON public.avisos;
DROP POLICY IF EXISTS "Admin gerencia avisos" ON public.avisos;
DROP POLICY IF EXISTS "Perfis visíveis para autenticados" ON public.profiles;

-- 3. Criar política de LEITURA para AVISOS (Todos autenticados podem ver)
CREATE POLICY "Avisos visíveis para todos" ON public.avisos 
FOR SELECT TO authenticated 
USING (true);

-- 4. Criar política de GERENCIAMENTO para AVISOS (Admin e Atendente)
CREATE POLICY "Staff gerencia avisos" ON public.avisos 
FOR ALL TO authenticated 
USING (
    exists (
        select 1 from public.profiles 
        where profiles.id = auth.uid() 
        and profiles.role IN ('admin', 'atendente')
    )
)
WITH CHECK (
    exists (
        select 1 from public.profiles 
        where profiles.id = auth.uid() 
        and profiles.role IN ('admin', 'atendente')
    )
);

-- 5. IMPORTANTÍSSIMO: Criar política de LEITURA para PROFILES
-- Sem isso, o join (select *, creator:profiles(...)) pode falhar ou retornar vazio
CREATE POLICY "Perfis visíveis para autenticados" ON public.profiles 
FOR SELECT TO authenticated 
USING (true);

-- 6. Garantir permissões de acesso
GRANT ALL ON public.avisos TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Verificação final
SELECT '✅ Configurações de RLS para Avisos e Perfis aplicadas!' as status;
