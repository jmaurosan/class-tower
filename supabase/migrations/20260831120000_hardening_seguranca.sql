-- ============================================================================
-- HARDENING DE SEGURANÇA — Class Tower
-- ============================================================================
-- Escrito a partir do estado REAL do banco de produção (projeto
-- xddmtbuuqairndciiepn), não do que os 54 scripts avulsos sugeriam.
--
-- O que foi encontrado em produção e é corrigido aqui:
--
--   1. handle_new_user() lê `role` de raw_user_meta_data — qualquer visitante
--      que chame /auth/v1/signup escolhe o próprio papel e vira admin.
--   2. profiles_update_own permite PATCH no próprio registro sem restrição de
--      coluna — um morador se promove a admin com uma requisição.
--   3. `anon` tem GRANT ALL (inclusive TRUNCATE) em TODAS as tabelas. Só o RLS
--      separa a internet dos dados.
--   4. avisos tem policy SELECT para o role `public` — avisos do condomínio
--      são legíveis sem login.
--   5. salas_read_public expõe salas (nome e telefone dos responsáveis) a anon;
--      salas_write_authenticated permite a qualquer morador alterar ou apagar
--      qualquer sala.
--   6. encomendas tem "Acesso Autenticado" ALL USING(true) WITH CHECK(true) —
--      qualquer morador lê, edita e apaga as encomendas do prédio inteiro.
--   7. profiles_select_authenticated expõe nome, e-mail, papel e unidade de
--      todos os usuários a qualquer pessoa logada.
--
-- As funções is_admin() e is_staff() JÁ EXISTEM em produção, corretas e com
-- search_path fixo. Não são recriadas — apenas reutilizadas.
--
-- IDEMPOTENTE: pode ser executado mais de uma vez.
-- Rollback: 20260831120001_hardening_rollback.sql
-- ============================================================================


-- ============================================================================
-- 1. FUNÇÃO AUXILIAR QUE FALTAVA
-- ============================================================================
-- is_admin() e is_staff() já existem. current_sala() é nova e é o que permite
-- filtrar encomendas e avisos por unidade dentro da própria policy.

CREATE OR REPLACE FUNCTION public.current_sala()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT sala_numero FROM public.profiles WHERE id = auth.uid();
$fn$;

REVOKE EXECUTE ON FUNCTION public.current_sala() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_sala() TO authenticated;


-- ============================================================================
-- 2. TRIGGER DE CRIAÇÃO DE PERFIL — role nunca vem do cliente
-- ============================================================================
-- Versão em produção hoje:
--     COALESCE(new.raw_user_meta_data->>'role', 'sala')
-- `raw_user_meta_data` é o campo `data` que o navegador envia em signUp().
-- Quem chama escolhe o próprio papel.
--
-- Todo cadastro passa a nascer como 'sala' sem permissões. A promoção acontece
-- exclusivamente pela Edge Function create-user (service_role), que agora
-- exige um admin autenticado.
--
-- Também ganha search_path fixo (advisor 0011) e deixa de ser chamável por RPC.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, sala_numero, permissions, status, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(coalesce(NEW.email, ''), '@', 1)
    ),
    'sala',          -- FIXO. Nunca de raw_user_meta_data.
    NEW.raw_user_meta_data->>'sala_numero',
    '{}'::jsonb,     -- FIXO. Permissões só pelo painel de admin.
    'Ativo',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;  -- antes não havia ON CONFLICT: um upsert
                                -- concorrente da Edge Function derrubava o
                                -- cadastro inteiro com erro de chave duplicada.

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funções de trigger não devem ser expostas como endpoint RPC (advisor 0028).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_empresa_rating_stats() FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- 3. TRAVA CONTRA AUTO-PROMOÇÃO
-- ============================================================================
-- A policy profiles_update_own (USING auth.uid() = id) permite hoje:
--     PATCH /rest/v1/profiles?id=eq.<meu-id>   {"role": "admin"}
-- RLS não restringe coluna; um trigger BEFORE UPDATE restringe.

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- service_role e SQL editor não têm auth.uid(); admin é confiável.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Usuário comum: campos sensíveis ficam congelados no valor anterior.
  NEW.id          := OLD.id;
  NEW.role        := OLD.role;
  NEW.permissions := OLD.permissions;
  NEW.status      := OLD.status;
  NEW.sala_numero := OLD.sala_numero;

  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_profile_privileges_trg ON public.profiles;
CREATE TRIGGER guard_profile_privileges_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();


-- ============================================================================
-- 4. search_path nas demais funções SECURITY DEFINER (advisor 0011)
-- ============================================================================
-- Sem search_path fixo, uma função SECURITY DEFINER pode ser induzida a
-- resolver `profiles` para outro objeto.

ALTER FUNCTION public.check_user_active() SET search_path = public;
ALTER FUNCTION public.get_database_size() SET search_path = public;
ALTER FUNCTION public.update_empresa_rating_stats() SET search_path = public;

-- get_database_size é usado apenas por telas administrativas.
REVOKE EXECUTE ON FUNCTION public.get_database_size() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_user_active() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC, anon;


-- ============================================================================
-- 5. LIMPEZA DAS POLICIES ANTIGAS
-- ============================================================================
-- Em produção há 7 policies em encomendas, 6 em salas, 6 em profiles, 5 em
-- avisos — acumuladas pelos scripts sucessivos, várias contraditórias entre si.
-- Como policies são OR entre si, a mais permissiva sempre vence: basta uma
-- "USING (true)" esquecida para anular todas as outras.

DO $cleanup$
DECLARE
  r record;
  alvo text[] := ARRAY[
    'profiles', 'salas', 'encomendas', 'avisos', 'agendamentos', 'vistorias',
    'diario', 'documentos', 'empresas', 'vencimentos', 'audit_logs',
    'condo_calendar_rules', 'avaliacoes_empresas'
  ];
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(alvo)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$cleanup$;


-- ============================================================================
-- 6. PRIVILÉGIOS DE TABELA
-- ============================================================================
-- Hoje `anon` tem DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE e
-- UPDATE em todas as 13 tabelas. Nada disso é necessário: o cadastro de
-- morador passa a ser feito pela Edge Function signup-morador (service_role).

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Tabelas criadas no futuro herdam o mesmo padrão.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;


-- ============================================================================
-- 7. POLICIES POR TABELA
-- ============================================================================

-- ---------------------------------------------------------------- profiles --
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cada um vê o próprio perfil; a equipe vê todos (necessário para a tela de
-- Usuários e para o join de autor em avisos).
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

-- Edição do próprio perfil, com as colunas sensíveis travadas pelo trigger
-- guard_profile_privileges_trg.
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------- salas --
-- Deixa de ser legível por anon. O "Primeiro Acesso" não consulta mais esta
-- tabela pelo navegador: quem valida é a Edge Function signup-morador.
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salas_select" ON public.salas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "salas_staff_write" ON public.salas
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -------------------------------------------------------------- encomendas --
-- Isolamento real por unidade. O filtro estava no JavaScript (useEncomendas),
-- depois de baixar a tabela inteira.
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encomendas_select" ON public.encomendas
  FOR SELECT TO authenticated
  USING (public.is_staff() OR sala_id = public.current_sala());

CREATE POLICY "encomendas_staff_write" ON public.encomendas
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------ avisos --
-- sala_numero NULL = aviso geral. Remove a policy de leitura para `public`,
-- que tornava os comunicados do condomínio legíveis sem login.
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avisos_select" ON public.avisos
  FOR SELECT TO authenticated
  USING (public.is_staff() OR sala_numero IS NULL OR sala_numero = public.current_sala());

CREATE POLICY "avisos_staff_write" ON public.avisos
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------ agendamentos --
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agendamentos_select" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (public.is_staff() OR user_id = auth.uid() OR sala_id = public.current_sala());

CREATE POLICY "agendamentos_insert" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() OR user_id = auth.uid());

CREATE POLICY "agendamentos_update" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (public.is_staff() OR user_id = auth.uid())
  WITH CHECK (public.is_staff() OR user_id = auth.uid());

CREATE POLICY "agendamentos_delete" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (public.is_staff() OR user_id = auth.uid());

-- --------------------------------------------------------------- vistorias --
ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vistorias_staff_all" ON public.vistorias
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------ diario --
ALTER TABLE public.diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diario_staff_all" ON public.diario
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------- vencimentos --
ALTER TABLE public.vencimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vencimentos_staff_all" ON public.vencimentos
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- -------------------------------------------------------------- documentos --
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_select" ON public.documentos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "documentos_staff_write" ON public.documentos
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------- empresas --
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_select" ON public.empresas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "empresas_staff_write" ON public.empresas
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ----------------------------------------------------- avaliacoes_empresas --
ALTER TABLE public.avaliacoes_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avaliacoes_select" ON public.avaliacoes_empresas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "avaliacoes_own_write" ON public.avaliacoes_empresas
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- -------------------------------------------------------------- audit_logs --
-- Leitura só de admin. Escrita em nome próprio: WITH CHECK impede forjar
-- `executed_by` de terceiros. Sem UPDATE e sem DELETE — log é append-only.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs_insert_self" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (executed_by = auth.uid());

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;

-- ---------------------------------------------------- condo_calendar_rules --
ALTER TABLE public.condo_calendar_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_rules_select" ON public.condo_calendar_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "calendar_rules_admin_write" ON public.condo_calendar_rules
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================================
-- 8. APLICAR
-- ============================================================================
NOTIFY pgrst, 'reload schema';
