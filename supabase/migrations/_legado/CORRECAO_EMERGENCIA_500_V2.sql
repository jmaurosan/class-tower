-- 🚑 SOLUÇÃO DE EMERGÊNCIA - V2 (SEM ERROS)
-- Execute para liberar o acesso AGORA

-- 1. Desabilitar RLS (Segurança)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Recarregar Configuração da API
NOTIFY pgrst, 'reload config';

-- 3. Verificar se funcionou (Deve mostrar o usuário admin)
SELECT * FROM public.profiles WHERE email = 'admin@classtower.com.br';
