-- 🔐 GESTÃO DE USUÁRIOS: STATUS E PERMISSÕES
-- Script para atualizar a tabela 'profiles' e reforçar a segurança RLS

-- 1. ADICIONAR NOVAS COLUNAS À TABELA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Bloqueado')),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 2. REFORÇAR RLS NA TABELA PROFILES (O usuário só pode ver/editar se não estiver bloqueado e for ele mesmo ou Admin)
DROP POLICY IF EXISTS "Perfil acessivel pelo proprio" ON public.profiles;
CREATE POLICY "Perfil acessivel pelo proprio"
ON public.profiles FOR ALL
TO authenticated
USING (
    (auth.uid() = id AND status = 'Ativo') OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'Ativo'))
);

-- 3. FUNÇÃO AUXILIAR PARA VERIFICAR BLOQUEIO (USADA POR OUTRAS TABELAS)
CREATE OR REPLACE FUNCTION public.check_user_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND status = 'Ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. EXEMPLO DE COMO REFORÇAR RLS EM OUTRAS TABELAS (AVISOS)
-- Nota: Isso garante que usuários bloqueados não consigam ver nem postar nada.
DROP POLICY IF EXISTS "Avisos ativos para usuários ativos" ON public.avisos;
CREATE POLICY "Avisos ativos para usuários ativos"
ON public.avisos FOR ALL
TO authenticated
USING (public.check_user_active());

-- 4.1 REFORÇO PARA ENCOMENDAS
DROP POLICY IF EXISTS "Encomendas bloqueadas para usuários bloqueados" ON public.encomendas;
CREATE POLICY "Encomendas bloqueadas para usuários bloqueados"
ON public.encomendas FOR ALL
TO authenticated
USING (public.check_user_active());

-- 4.2 REFORÇO PARA VISTORIAS
DROP POLICY IF EXISTS "Vistorias bloqueadas para usuários bloqueados" ON public.vistorias;
CREATE POLICY "Vistorias bloqueadas para usuários bloqueados"
ON public.vistorias FOR ALL
TO authenticated
USING (public.check_user_active());

-- 5. NOTIFICAR SUCESSO
SELECT 'Migração de Gestão de Usuários concluída!' as status;
