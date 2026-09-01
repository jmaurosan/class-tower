-- 🔄 REVERTER PARA CONFIGURAÇÃO FUNCIONAL ANTERIOR
-- Este script restaura as políticas RLS que funcionavam ANTES do script V5

-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
-- ============================================

-- Limpar TODAS as políticas de profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- Limpar TODAS as políticas de salas
DROP POLICY IF EXISTS "salas_select_policy" ON public.salas;
DROP POLICY IF EXISTS "salas_all_policy" ON public.salas;
DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;

-- ============================================
-- 2. RECRIAR POLÍTICAS SIMPLES QUE FUNCIONAVAM
-- ============================================

-- PROFILES: Políticas básicas e funcionais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Leitura: TODO MUNDO pode ler (Necessário para o login)
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

-- ============================================
-- 3. GARANTIR TABELA SALAS E POLÍTICAS BÁSICAS
-- ============================================

-- Criar tabela salas se não existir
CREATE TABLE IF NOT EXISTS public.salas (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    andar INTEGER NOT NULL,
    nome TEXT,
    responsavel1 TEXT,
    telefone1 TEXT,
    responsavel2 TEXT,
    telefone2 TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SALAS: Políticas permissivas para desenvolvimento
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para todos autenticados
CREATE POLICY "Salas readable by authenticated" 
ON public.salas FOR SELECT 
TO authenticated 
USING (true);

-- Permitir escrita para todos autenticados (simplificado para desenvolvimento)
CREATE POLICY "Salas writable by authenticated" 
ON public.salas FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. ATUALIZAR GATILHO (SEM CAUSAR DUPLICAÇÃO)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, sala_numero, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      split_part(new.email, '@', 1)
    ),
    COALESCE(new.raw_user_meta_data->>'role', 'sala'),
    new.raw_user_meta_data->>'sala_numero',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    sala_numero = COALESCE(EXCLUDED.sala_numero, public.profiles.sala_numero),
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 5. RECARREGAR CACHE
-- ============================================
NOTIFY pgrst, 'reload config';

SELECT '✅ Configuração revertida para estado funcional!' as status;
