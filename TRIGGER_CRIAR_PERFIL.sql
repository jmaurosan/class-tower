-- 🔧 TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- Execute este script no Supabase SQL Editor para garantir que
-- quando um usuário é criado, o perfil seja criado automaticamente

-- 1. Criar função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo perfil na tabela profiles
  INSERT INTO public.profiles (id, full_name, email, role, sala_numero)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sala'),
    COALESCE(NEW.raw_user_meta_data->>'sala_numero', '0000')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger que executa a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- PRONTO! Agora quando você criar um usuário pela interface,
-- o perfil será criado automaticamente com os dados corretos.
