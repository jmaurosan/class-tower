-- ============================================================================
-- FILA DE NOTIFICAÇÕES (outbox) — Class Tower
-- ============================================================================
-- Hoje o push de "sua encomenda chegou" sai do navegador do porteiro, em
-- encomendasService.create():
--
--     supabase.functions.invoke('onesignal-push', {...})
--       .catch(err => console.error("Falha ao enviar push:", err))
--
-- Se falhar, o erro vai para um console que ninguém lê. Se ele fechar a aba
-- antes de a requisição sair, não vai nada. Não há retentativa nem registro
-- do que foi enviado.
--
-- Aqui a notificação nasce junto com a encomenda, na mesma transação, e um
-- worker separado a entrega com retentativa e backoff. Se a entrega falhar,
-- fica registrado — e é possível responder "essa encomenda foi avisada?".
--
-- O canal continua sendo o OneSignal. Trocar por WhatsApp depois é mexer só
-- na Edge Function; a fila não muda.
--
-- APLIQUE DEPOIS DO DEPLOY DA FUNÇÃO `processar-notificacoes`.
-- ============================================================================


-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron  WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net   WITH SCHEMA extensions;


-- ============================================================================
-- 2. A FILA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notificacoes_fila (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Para quem. Um dos dois é preenchido.
  destino_sala_numero   text,
  destino_role          text,

  titulo                text NOT NULL,
  mensagem              text NOT NULL,
  url                   text,

  -- De onde veio, para conseguir responder "esta encomenda foi avisada?"
  origem_tabela         text,
  origem_id             uuid,

  status                text NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','processando','enviado','falha')),
  tentativas            int  NOT NULL DEFAULT 0,
  ultimo_erro           text,
  proxima_tentativa_em  timestamptz NOT NULL DEFAULT now(),
  enviado_em            timestamptz,
  destinatarios         int,

  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Índice que o worker usa para achar o que entregar.
CREATE INDEX IF NOT EXISTS notificacoes_fila_pendentes_idx
  ON public.notificacoes_fila (proxima_tentativa_em)
  WHERE status IN ('pendente','processando');

CREATE INDEX IF NOT EXISTS notificacoes_fila_origem_idx
  ON public.notificacoes_fila (origem_tabela, origem_id);

-- Operacional: só admin enxerga. service_role ignora RLS.
ALTER TABLE public.notificacoes_fila ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificacoes_fila_admin_select" ON public.notificacoes_fila;
CREATE POLICY "notificacoes_fila_admin_select" ON public.notificacoes_fila
  FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.notificacoes_fila FROM anon;
GRANT SELECT ON public.notificacoes_fila TO authenticated;


-- ============================================================================
-- 3. ENFILEIRAR AO REGISTRAR UMA ENCOMENDA
-- ============================================================================
-- O ponto central: a notificação passa a ser consequência do INSERT, não de
-- uma chamada que o navegador pode ou não conseguir fazer. Se a encomenda foi
-- gravada, a notificação existe.

CREATE OR REPLACE FUNCTION public.enfileirar_aviso_encomenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.sala_id IS NULL OR NEW.sala_id = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notificacoes_fila (
    destino_sala_numero, titulo, mensagem, url, origem_tabela, origem_id
  )
  VALUES (
    NEW.sala_id,
    'Sua encomenda chegou!',
    format(
      'Recebemos uma nova encomenda (%s) destinada à sua unidade. Por favor, retire na portaria.',
      coalesce(NEW.categoria, 'pacote')
    ),
    '/encomendas',
    'encomendas',
    NEW.id
  );

  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.enfileirar_aviso_encomenda() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enfileirar_aviso_encomenda_trg ON public.encomendas;
CREATE TRIGGER enfileirar_aviso_encomenda_trg
  AFTER INSERT ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.enfileirar_aviso_encomenda();


-- ============================================================================
-- 4. RESERVAR UM LOTE
-- ============================================================================
-- FOR UPDATE SKIP LOCKED evita que duas execuções sobrepostas do cron peguem
-- a mesma linha e o morador receba a notificação duas vezes.

CREATE OR REPLACE FUNCTION public.reservar_notificacoes(limite int DEFAULT 25)
RETURNS SETOF public.notificacoes_fila
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  RETURN QUERY
  WITH lote AS (
    SELECT id
    FROM public.notificacoes_fila
    WHERE status IN ('pendente','processando')
      AND proxima_tentativa_em <= now()
    ORDER BY created_at
    LIMIT limite
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notificacoes_fila f
  SET status = 'processando',
      tentativas = f.tentativas + 1,
      -- Se o worker morrer no meio, a linha volta a ser elegível em 5 min.
      proxima_tentativa_em = now() + interval '5 minutes'
  FROM lote
  WHERE f.id = lote.id
  RETURNING f.*;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.reservar_notificacoes(int) FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- 5. REGISTRAR O RESULTADO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.concluir_notificacao(
  p_id           uuid,
  p_sucesso      boolean,
  p_erro         text DEFAULT NULL,
  p_destinatarios int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_tentativas int;
BEGIN
  SELECT tentativas INTO v_tentativas
  FROM public.notificacoes_fila WHERE id = p_id;

  IF p_sucesso THEN
    UPDATE public.notificacoes_fila
    SET status = 'enviado',
        enviado_em = now(),
        destinatarios = p_destinatarios,
        ultimo_erro = NULL
    WHERE id = p_id;

  ELSIF coalesce(v_tentativas, 0) >= 5 THEN
    -- Desiste depois de 5 tentativas. Fica em 'falha' para o admin ver.
    UPDATE public.notificacoes_fila
    SET status = 'falha', ultimo_erro = p_erro
    WHERE id = p_id;

  ELSE
    -- Backoff: 1min, 4min, 9min, 16min, 25min.
    UPDATE public.notificacoes_fila
    SET status = 'pendente',
        ultimo_erro = p_erro,
        proxima_tentativa_em =
          now() + (power(coalesce(v_tentativas,1), 2) || ' minutes')::interval
    WHERE id = p_id;
  END IF;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.concluir_notificacao(uuid, boolean, text, int)
  FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- 6. AGENDAMENTO
-- ============================================================================
-- O cron chama a Edge Function a cada minuto. A service_role key fica no
-- Vault, nunca em texto puro na definição do job.
--
-- ANTES DE RODAR ESTA SEÇÃO, guarde a chave uma única vez:
--
--   select vault.create_secret(
--     '<SUA_SERVICE_ROLE_KEY>',
--     'service_role_key',
--     'Usada pelo cron para chamar a Edge Function de notificações'
--   );

CREATE OR REPLACE FUNCTION public.disparar_processamento_notificacoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $fn$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE WARNING 'service_role_key não encontrada no Vault; notificações não serão processadas.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := 'https://xddmtbuuqairndciiepn.supabase.co/functions/v1/processar-notificacoes',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_key
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.disparar_processamento_notificacoes()
  FROM PUBLIC, anon, authenticated;

-- Remove um agendamento anterior antes de recriar (idempotência).
SELECT cron.unschedule('processar-notificacoes')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'processar-notificacoes');

SELECT cron.schedule(
  'processar-notificacoes',
  '* * * * *',
  $cron$ SELECT public.disparar_processamento_notificacoes(); $cron$
);


-- ============================================================================
-- 7. VERIFICAÇÃO
-- ============================================================================
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'processar-notificacoes';

-- Painel rápido do estado da fila.
SELECT status, count(*), max(created_at) AS mais_recente
FROM public.notificacoes_fila
GROUP BY status;
