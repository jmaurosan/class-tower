-- 🚀 SETUP DEFINITIVO E CORREÇÃO DE SCHEMA - CLASSTOWER
-- Este script garante que todas as tabelas tenham as colunas necessárias para o funcionamento do Frontend.

DO $$
BEGIN
    -- 1. TABELA AVISOS: Adicionar suporte a cancelamento e status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avisos' AND column_name = 'status') THEN
        ALTER TABLE public.avisos ADD COLUMN status TEXT DEFAULT 'Ativo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avisos' AND column_name = 'justificativa_cancelamento') THEN
        ALTER TABLE public.avisos ADD COLUMN justificativa_cancelamento TEXT;
    END IF;

    -- 2. TABELA ENCOMENDAS: Criar se não existir e garantir colunas
    CREATE TABLE IF NOT EXISTS public.encomendas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT now(),
        destinatario TEXT NOT NULL,
        remetente TEXT,
        categoria TEXT DEFAULT 'Outros',
        caracteristicas TEXT,
        foto_url TEXT,
        status TEXT DEFAULT 'Pendente',
        sala_id TEXT,
        quem_retirou TEXT,
        data_retirada TIMESTAMPTZ,
        justificativa_cancelamento TEXT
    );

    -- 3. TABELA DOCUMENTOS (Anexos): Criar se não existir
    CREATE TABLE IF NOT EXISTS public.documentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT now(),
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        tamanho TEXT,
        tipo TEXT,
        url TEXT NOT NULL,
        storage_path TEXT
    );

    -- 4. TABELA VISTORIAS: Ajustar colunas de sincronização com Frontend
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vistorias' AND column_name = 'hora') THEN
        ALTER TABLE public.vistorias ADD COLUMN hora TIME DEFAULT CURRENT_TIME;
    END IF;
    -- Renomear data_vistoria para data se necessário para bater com o tipo, 
    -- mas vamos apenas garantir que 'data' exista se o frontend usar e.data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vistorias' AND column_name = 'data') THEN
        ALTER TABLE public.vistorias ADD COLUMN data DATE DEFAULT CURRENT_DATE;
    END IF;

    -- 5. TABELA PROFILES: Garantir coluna status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'Ativo';
    END IF;

END $$;

-- 🛠️ GARANTIR RLS PARA AS NOVAS TABELAS
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Políticas para Encomendas
DROP POLICY IF EXISTS "Qualquer um vê encomendas" ON public.encomendas;
CREATE POLICY "Qualquer um vê encomendas" ON public.encomendas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff gerencia encomendas" ON public.encomendas;
CREATE POLICY "Staff gerencia encomendas" ON public.encomendas FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- Políticas para Documentos
DROP POLICY IF EXISTS "Qualquer um vê documentos" ON public.documentos;
CREATE POLICY "Qualquer um vê documentos" ON public.documentos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin gerencia documentos" ON public.documentos;
CREATE POLICY "Admin gerencia documentos" ON public.documentos FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 🔐 PERMISSÕES FINAIS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT '✅ Schema sincronizado com sucesso!' as resultado;
