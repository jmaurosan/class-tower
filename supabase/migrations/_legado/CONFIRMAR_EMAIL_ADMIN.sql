-- ✅ CORRIGIR EMAIL NÃO CONFIRMADO DO ADMIN
-- Execute este script no Supabase SQL Editor

-- 1. Confirmar email do admin
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@classtower.com.br';

-- 2. Verificar se foi atualizado
SELECT 
  email,
  email_confirmed_at,
  'Email confirmado!' as status
FROM auth.users
WHERE email = 'admin@classtower.com.br';
