-- ✅ SCRIPT DE EMERGÊNCIA: CONFIRMAÇÃO MANUAL DE E-MAIL
-- Se o link enviado pelo Supabase der erro de "Conteúdo Corrompido", use este script no SQL Editor.

-- 1. Confirmar TODOS os usuários que ainda não confirmaram
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Garantir que os perfis reflitam a mudança (se houver campo de status)
UPDATE public.profiles
SET status = 'Ativo'
WHERE status IS NULL OR status = 'Pendente';

-- 3. Verificação: Listar status atual
SELECT id, email, email_confirmed_at
FROM auth.users;
