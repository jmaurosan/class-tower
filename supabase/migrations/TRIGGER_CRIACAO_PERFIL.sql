-- 🔥 TRIGGER DE AUTOMAÇÃO: CRIAÇÃO DE PERFIL VIA AUTH
-- Execute este script no SQL Editor do Supabase para automatizar o cadastro de perfis.

-- 1. Criar a função que processa o novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    sala_numero, 
    permissions, 
    status,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'sala'),
    COALESCE(new.raw_user_meta_data->>'sala_numero', '0000'),
    COALESCE((new.raw_user_meta_data->'permissions'), '{}'::jsonb),
    'Ativo',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o gatilho (Trigger) na tabela auth.users
-- IMPORTANTE: Removemos se já existir para evitar duplicidade
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Mensagem de sucesso
SELECT '✅ Trigger de criação de perfil instalada com sucesso!' as status;
