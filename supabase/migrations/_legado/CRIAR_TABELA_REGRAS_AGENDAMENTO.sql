-- CRIAR TABELA DE REGRAS DE AGENDAMENTO (FERIADOS E EXCEÇÕES)

CREATE TABLE IF NOT EXISTS public.condo_calendar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE, -- A data da regra (ex: 2024-12-25)
    description TEXT NOT NULL, -- Ex: "Natal", "Manutenção Predial"
    is_blocked BOOLEAN DEFAULT TRUE, -- Se TRUE, nenhum agendamento é permitido neste dia
    allowed_start_time TIME, -- Se is_blocked = FALSE, define o início do horário permitido
    allowed_end_time TIME, -- Se is_blocked = FALSE, define o fim do horário permitido
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.condo_calendar_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- Todos podem ler as regras (para validação no frontend)
CREATE POLICY "Regras visíveis para todos" 
ON public.condo_calendar_rules FOR SELECT 
USING (true);

-- Apenas Admin pode criar/editar/excluir
CREATE POLICY "Apenas Admin gerencia regras" 
ON public.condo_calendar_rules FOR ALL 
USING (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
);

-- Permissões
GRANT SELECT ON public.condo_calendar_rules TO authenticated;
GRANT ALL ON public.condo_calendar_rules TO service_role;

-- Tabela e politicas criadas com sucesso
