-- 🗓️ GARANTIR QUE A TABELA condo_calendar_rules EXISTE E TEM RLS CORRETO
-- Execute este script no SQL Editor do Supabase

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.condo_calendar_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT TRUE,
  allowed_start_time TIME,
  allowed_end_time TIME,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configurar RLS
ALTER TABLE public.condo_calendar_rules DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_rules_select" ON public.condo_calendar_rules;
DROP POLICY IF EXISTS "calendar_rules_admin" ON public.condo_calendar_rules;

-- Todos os autenticados podem VER as regras (para saber dias bloqueados)
CREATE POLICY "calendar_rules_select" ON public.condo_calendar_rules
  FOR SELECT TO authenticated USING (true);

-- Apenas admin pode CRIAR/ALTERAR/EXCLUIR regras
CREATE POLICY "calendar_rules_admin" ON public.condo_calendar_rules
  FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.condo_calendar_rules ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload config';

SELECT '✅ Tabela condo_calendar_rules configurada com RLS correto.' as status;
