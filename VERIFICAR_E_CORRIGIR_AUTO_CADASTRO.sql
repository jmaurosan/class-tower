-- SCRIPT DE VERIFICAÇÃO E CORREÇÃO DO AUTO-CADASTRO
-- Execute este script no Supabase SQL Editor para garantir que o cadastro de moradores funcione 100%

-- 1. Garantir que a tabela profiles tem a coluna sala_numero
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sala_numero') THEN
    ALTER TABLE public.profiles ADD COLUMN sala_numero TEXT;
    RAISE NOTICE '✅ Coluna sala_numero adicionada a profiles.';
  ELSE
    RAISE NOTICE '✅ Coluna sala_numero já existe em profiles.';
  END IF;
END $$;

-- 2. Atualizar a função handle_new_user para copiar sala_numero e outros metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, sala_numero, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'sala'), -- Default para 'sala' se vier vazio
    new.raw_user_meta_data->>'sala_numero',
    new.raw_user_meta_data->>'avatar_url',
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

DO $$ BEGIN RAISE NOTICE '✅ Função handle_new_user atualizada para processar sala_numero.'; END $$;

-- 3. Garantir que o Trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DO $$ BEGIN RAISE NOTICE '✅ Trigger on_auth_user_created verificado.'; END $$;

-- 4. Criar política de segurança para que Usuários possam atualizar seus próprios perfis (caso necessário no futuro)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DO $$ BEGIN RAISE NOTICE '✅ Políticas de segurança verificadas.'; END $$;
