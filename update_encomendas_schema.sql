-- 📦 ATUALIZAÇÃO DE SCHEMA: TABELA ENCOMENDAS
-- Adiciona suporte para justificativa de cancelamento.

ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS justificativa_cancelamento TEXT;

-- Verificação
SELECT '✅ Tabela encomendas atualizada com sucesso!' as status;
