-- 🚀 CORREÇÃO DA TABELA AVISOS
-- Adiciona colunas faltantes para suportar cancelamento e status

DO $$
BEGIN
    -- 1. Adicionar coluna 'status' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avisos' AND column_name = 'status') THEN
        ALTER TABLE public.avisos ADD COLUMN status TEXT DEFAULT 'Ativo';
    END IF;

    -- 2. Adicionar coluna 'justificativa_cancelamento' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avisos' AND column_name = 'justificativa_cancelamento') THEN
        ALTER TABLE public.avisos ADD COLUMN justificativa_cancelamento TEXT;
    END IF;
END $$;

-- 3. Garantir que avisos antigos tenham o status 'Ativo'
UPDATE public.avisos SET status = 'Ativo' WHERE status IS NULL;

-- 4. Recarregar o Schema Cache do PostgREST (Opcional, mas recomendado se o erro persistir)
-- NOTA: No Supabase, isso geralmente é automático, mas se o erro PGRST204 continuar, 
-- pode ser necessário um "Reload Schema" nas configurações da API do projeto.

SELECT '✅ Colunas adicionadas à tabela avisos com sucesso!' as resultado;
