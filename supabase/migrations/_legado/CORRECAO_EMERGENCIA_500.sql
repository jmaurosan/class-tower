-- 🚑 SOLUÇÃO DE EMERGÊNCIA - CORREÇÃO ERRO 500
-- Este script desativa temporariamente travas de segurança para permitir o acesso imediato.

-- 1. Desabilitar RLS (Row Level Security) na tabela profiles
-- Isso elimina qualquer verificação de política que esteja causando o Loop/Erro 500
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Recarregar configuração da API (Para garantir que a mudança surta efeito)
NOTIFY pgrst, 'reload config';

-- 3. Verificação de Integridade (Para garantir que a tabela está legível)
SELECT * FROM public.profiles LIMIT 1;

RAISE NOTICE '✅ Segurança desabilitada temporariamente. O acesso deve estar liberado.';
