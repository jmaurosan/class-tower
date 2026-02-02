-- 🔓 CORREÇÃO DE PERMISSÕES RLS - (VERSÃO CORRIGIDA - SEM ERROS DE SINTAXE)

-- 1. Recarregar Schema Cache
NOTIFY pgrst, 'reload config';

-- 2. Garantir RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Limpar TUDO que possa estar atrapalhando
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 4. Criar permissões BÁSICAS e FUNCIONAIS

-- Leitura: TODO MUNDO pode ler (Necessário para o login encontrar o perfil)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Inserção: O próprio usuário pode criar seu perfil
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Atualização: O próprio usuário pode editar seu perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- (Removi o comando RAISE que estava causando o erro)
