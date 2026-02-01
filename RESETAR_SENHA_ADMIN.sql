-- 🔐 RESETAR SENHA DO USUÁRIO ADMIN
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'mauromonit@gmail.com';

-- 2. Se o usuário existir, resetar a senha para: Mauro@2026
UPDATE auth.users
SET 
  encrypted_password = crypt('Mauro@2026', gen_salt('bf')),
  updated_at = now()
WHERE email = 'mauromonit@gmail.com';

-- 3. Garantir que o perfil está como admin
UPDATE public.profiles
SET 
  role = 'admin',
  name = 'Mauro (Admin)'
WHERE email = 'mauromonit@gmail.com';

-- 4. Verificar se deu certo
SELECT 
  u.email,
  p.name,
  p.role,
  'Senha resetada para: Mauro@2026' as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'mauromonit@gmail.com';
