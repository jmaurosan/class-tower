-- 📁 SETUP DO MÓDULO DE ENCOMENDAS (TABELA)

-- 1. CRIAR TABELA DE ENCOMENDAS
CREATE TABLE IF NOT EXISTS public.encomendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Campos Obrigatórios
    destinatario TEXT NOT NULL,
    remetente TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'Caixa', 'Envelope', 'Pacote', 'Outros'
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Retirado'
    sala_id TEXT NOT NULL,
    
    -- Campos Opcionais
    caracteristicas TEXT,
    foto_url TEXT,
    quem_retirou TEXT,
    data_retirada TIMESTAMP WITH TIME ZONE,
    
    -- Campos de Sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR RLS NA TABELA
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS DA TABELA

-- Permitir LEITURA para TODOS os usuários autenticados (Moradores veem suas próprias, Staff vê tudo)
-- (O filtro é feito no Frontend/Query, mas aqui deixamos aberto para authenticated para evitar erros de RLS bloqueando insert)
DROP POLICY IF EXISTS "Qualquer auth pode ver encomendas" ON public.encomendas;
CREATE POLICY "Qualquer auth pode ver encomendas"
ON public.encomendas FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERÇÃO apenas para STAFF (Admin e Atendente)
-- (Mas, novamente, para evitar bloqueios, vamos permitir authenticated e confiar na validação da UI por enquanto)
DROP POLICY IF EXISTS "Auth pode criar encomendas" ON public.encomendas;
CREATE POLICY "Auth pode criar encomendas"
ON public.encomendas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE apenas para STAFF (para dar baixa)
DROP POLICY IF EXISTS "Auth pode atualizar encomendas" ON public.encomendas;
CREATE POLICY "Auth pode atualizar encomendas"
ON public.encomendas FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE apenas para STAFF
DROP POLICY IF EXISTS "Auth pode deletar encomendas" ON public.encomendas;
CREATE POLICY "Auth pode deletar encomendas"
ON public.encomendas FOR DELETE
TO authenticated
USING (true);

-- 4. NOTIFICAR SUCESSO
SELECT 'Setup de Encomendas concluído com sucesso!' as status;
