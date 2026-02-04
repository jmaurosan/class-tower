-- 🚀 SETUP COMPLETO DAS TABELAS DO CLASSTOWER
-- Este script garante a existência de todas as tabelas, colunas, RLS e triggers necessários.

-- ==========================================
-- 1. TABELA PROFILES E AUTO-CADASTRO
-- ==========================================

-- Garantir coluna sala_numero
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sala_numero') THEN
    ALTER TABLE public.profiles ADD COLUMN sala_numero TEXT;
  END IF;
END $$;

-- Função de Trigger para Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, sala_numero, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'sala'),
    new.raw_user_meta_data->>'sala_numero',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    sala_numero = EXCLUDED.sala_numero,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 2. TABELA AVISOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.avisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE DEFAULT CURRENT_DATE,
    hora TIME DEFAULT CURRENT_TIME,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    prioridade TEXT DEFAULT 'Baixa',
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Avisos visíveis para todos" ON public.avisos;
CREATE POLICY "Avisos visíveis para todos" ON public.avisos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin gerencia avisos" ON public.avisos;
CREATE POLICY "Admin gerencia avisos" ON public.avisos FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ==========================================
-- 3. TABELA AGENDAMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    hora TIME NOT NULL,
    titulo TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'Mudança', 'Manutenção', 'Reserva', 'Reunião'
    status TEXT DEFAULT 'Pendente',
    sala_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem seus agendamentos" ON public.agendamentos;
CREATE POLICY "Usuários veem seus agendamentos" ON public.agendamentos FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR 
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);
DROP POLICY IF EXISTS "Usuários criam agendamentos" ON public.agendamentos;
CREATE POLICY "Usuários criam agendamentos" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. TABELA VISTORIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vistorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_vistoria DATE DEFAULT CURRENT_DATE,
    unidade TEXT NOT NULL,
    local TEXT,
    urgencia TEXT DEFAULT 'Média',
    status TEXT DEFAULT 'Pendente',
    tecnico TEXT,
    descricao TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Qualquer auth pode ver vistorias" ON public.vistorias;
CREATE POLICY "Qualquer auth pode ver vistorias" ON public.vistorias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff gerencia vistorias" ON public.vistorias;
CREATE POLICY "Staff gerencia vistorias" ON public.vistorias FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- ==========================================
-- 5. TABELA DIARIO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE DEFAULT CURRENT_DATE,
    hora TIME DEFAULT CURRENT_TIME,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT DEFAULT 'Outros',
    usuario TEXT,
    sala_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.diario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff acessa diario" ON public.diario;
CREATE POLICY "Staff acessa diario" ON public.diario FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- ==========================================
-- 6. TABELA EMPRESAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT,
    setor TEXT,
    contato TEXT,
    telefone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Homologada',
    rating INTEGER DEFAULT 5,
    sala_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Empresas visíveis para todos" ON public.empresas;
CREATE POLICY "Empresas visíveis para todos" ON public.empresas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin gerencia empresas" ON public.empresas;
CREATE POLICY "Admin gerencia empresas" ON public.empresas FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ==========================================
-- 7. TABELA VENCIMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vencimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'Em Andamento',
    visto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vencimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Filtro de visibilidade vencimentos" ON public.vencimentos;
CREATE POLICY "Filtro de visibilidade vencimentos" ON public.vencimentos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff gerencia vencimentos" ON public.vencimentos;
CREATE POLICY "Staff gerencia vencimentos" ON public.vencimentos FOR ALL TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role IN ('admin', 'atendente'))
);

-- ==========================================
-- 8. TABELA AUDIT_LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    executed_by UUID REFERENCES auth.users(id),
    executed_by_name TEXT,
    old_data JSONB,
    new_data JSONB
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin acessa logs" ON public.audit_logs;
CREATE POLICY "Admin acessa logs" ON public.audit_logs FOR SELECT TO authenticated USING (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

SELECT '✅ Script de Setup Completo executado com sucesso!' as status;
