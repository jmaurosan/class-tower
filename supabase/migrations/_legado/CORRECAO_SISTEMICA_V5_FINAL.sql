-- 🔧 CORREÇÃO SISTÊMICA FINAL - ClassTower (VERSÃO V5)
-- Execute este script no Supabase SQL Editor para resolver problemas de Login, Usuários e Salas.

-- ============================================
-- 1. GARANTIR ESTRUTURA DA TABELA PROFILES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sala_numero') THEN
    ALTER TABLE public.profiles ADD COLUMN sala_numero TEXT;
  END IF;
END $$;

-- ============================================
-- 2. GATILHO DE CRIAÇÃO DE PERFIL RESILIENTE
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
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    sala_numero = EXCLUDED.sala_numero,
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
-- 3. TABELA DE SALAS (UNIDADES)
-- ============================================
CREATE TABLE IF NOT EXISTS public.salas (
    id TEXT PRIMARY KEY, -- O ID será o número da sala (ex: '0101') para facilitar
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

-- Ativar RLS para salas
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- Políticas para SALAS
DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
CREATE POLICY "Salas visíveis para autenticados" ON public.salas 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
CREATE POLICY "Staff gerencia salas" ON public.salas 
FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- ============================================
-- 4. POLÍTICAS DE SEGURANÇA (PROFILES)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles 
FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================
-- 5. FINALIZAÇÃO
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

SELECT '✅ Sistema atualizado com sucesso (V5)!' as status;
