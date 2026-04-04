-- 🔓 CORREÇÃO DE PERMISSÕES E CACHE (Resolução do Erro 500)
-- Execute este script para liberar o acesso aos perfis e atualizar a API

-- 1. Recarregar Cache da API do Supabase (Resolve erros de schema desatualizado)
NOTIFY pgrst, 'reload config';

-- 2. Garantir que RLS está ativo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Limpar policies antigas que podem estar quebradas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 4. Criar Novas Policies (Simples e Permissivas para destravar)

-- PERMITIR LEITURA GERAL (Resolve o erro de buscar perfil no login)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- PERMITIR INSERÇÃO (Caso precise criar novo)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- PERMITIR ATUALIZAÇÃO (Apenas dono pode editar)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

RAISE NOTICE '✅ Permissões resetadas e cache atualizado!';
