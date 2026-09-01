-- 🔧 CORREÇÃO FINAL: Gatilho + RLS sem Recursão
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. CORRIGIR GATILHO PARA EVITAR DUPLICAÇÃO
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Usar UPSERT para evitar erro de chave duplicada
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

-- Re-aplicar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 2. POLÍTICAS RLS SIMPLES (SEM RECURSÃO)
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

-- Criar políticas simples
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS PARA SALAS
-- ============================================

DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;

CREATE POLICY "salas_select_policy" 
ON public.salas FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "salas_all_policy" 
ON public.salas FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RECARREGAR CACHE
-- ============================================
NOTIFY pgrst, 'reload config';

SELECT '✅ Gatilho corrigido e RLS sem recursão!' as status;
