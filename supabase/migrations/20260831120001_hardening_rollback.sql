-- ============================================================================
-- ROLLBACK do hardening de segurança
-- ============================================================================
-- Use SOMENTE se o hardening quebrar algo em produção e você precisar de
-- alguns minutos para investigar. Ele devolve o banco a um estado permissivo
-- porém FUNCIONAL — não a um estado seguro.
--
-- Não deixe o sistema neste estado. Ele é equivalente ao que existia antes,
-- com as vulnerabilidades de leitura entre unidades.
-- ============================================================================

-- Remove as policies novas
DO $rollback$
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
$rollback$;

-- Libera leitura e escrita para autenticados em todas as tabelas gerenciadas
DO $permissivo$
DECLARE
  t text;
  alvo text[] := ARRAY[
    'profiles', 'salas', 'encomendas', 'avisos', 'agendamentos', 'vistorias',
    'diario', 'documentos', 'empresas', 'vencimentos', 'audit_logs',
    'condo_calendar_rules', 'avaliacoes_empresas'
  ];
BEGIN
  FOREACH t IN ARRAY alvo LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        'rollback_all_' || t, t
      );
    END IF;
  END LOOP;
END
$permissivo$;

-- Devolve a trava de auto-promoção ao estado desligado
DROP TRIGGER IF EXISTS guard_profile_privileges_trg ON public.profiles;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';

SELECT 'ROLLBACK aplicado. O sistema esta funcional porem INSEGURO.' AS aviso;
