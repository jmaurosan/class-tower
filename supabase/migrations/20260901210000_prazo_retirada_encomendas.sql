-- ============================================================================
-- Prazo de retirada de encomendas — 10 dias
-- ============================================================================
-- Política do condomínio: a encomenda fica na portaria por 10 dias.
--
-- Antes não havia nada aplicando isso: o Termo de Responsabilidade citava 48
-- horas (texto desatualizado, corrigido junto) e nenhum lembrete era enviado.
--
-- Reaproveita a fila de notificações. Dois avisos automáticos:
--   dia 8  → faltam 2 dias
--   dia 10 → prazo vencido
--
-- Depende de 20260901100000_fila_notificacoes.sql.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Distinguir os tipos de notificação
-- ---------------------------------------------------------------------------
-- Sem isso não dá para saber se o lembrete de uma encomenda já foi enfileirado,
-- e o cron diário mandaria o mesmo aviso todo dia.

ALTER TABLE public.notificacoes_fila
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'chegada';

CREATE INDEX IF NOT EXISTS notificacoes_fila_origem_tipo_idx
  ON public.notificacoes_fila (origem_id, tipo);


-- ---------------------------------------------------------------------------
-- 2. O aviso de chegada passa a se identificar
-- ---------------------------------------------------------------------------
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
    destino_sala_numero, titulo, mensagem, url, origem_tabela, origem_id, tipo
  )
  VALUES (
    NEW.sala_id,
    'Sua encomenda chegou!',
    format(
      'Recebemos uma nova encomenda (%s) destinada à sua unidade. '
      || 'Você tem 10 dias para retirar na portaria.',
      coalesce(NEW.categoria, 'pacote')
    ),
    '/encomendas',
    'encomendas',
    NEW.id,
    'chegada'
  );

  RETURN NEW;
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 3. Lembrete e vencimento
-- ---------------------------------------------------------------------------
-- Rodada diária. O NOT EXISTS garante que cada encomenda receba cada aviso
-- uma única vez, mesmo que o cron rode várias vezes.

CREATE OR REPLACE FUNCTION public.enfileirar_lembretes_retirada()
RETURNS TABLE (lembretes int, vencidas int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_prazo   constant int := 10;  -- dias de permanência na portaria
  v_aviso   constant int := 8;   -- avisa faltando 2 dias
  v_lembretes int;
  v_vencidas  int;
BEGIN
  -- Faltam 2 dias
  WITH novas AS (
    INSERT INTO public.notificacoes_fila (
      destino_sala_numero, titulo, mensagem, url, origem_tabela, origem_id, tipo
    )
    SELECT
      e.sala_id,
      'Encomenda aguardando retirada',
      format(
        'Sua encomenda (%s) está na portaria desde %s. '
        || 'Faltam 2 dias para o fim do prazo de retirada.',
        coalesce(e.categoria, 'pacote'),
        to_char(e.created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
      ),
      '/encomendas',
      'encomendas',
      e.id,
      'lembrete'
    FROM public.encomendas e
    WHERE e.status = 'Pendente'
      AND coalesce(e.sala_id, '') <> ''
      AND e.created_at <= now() - (v_aviso || ' days')::interval
      AND NOT EXISTS (
        SELECT 1 FROM public.notificacoes_fila f
        WHERE f.origem_id = e.id AND f.tipo = 'lembrete'
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_lembretes FROM novas;

  -- Prazo vencido
  WITH novas AS (
    INSERT INTO public.notificacoes_fila (
      destino_sala_numero, titulo, mensagem, url, origem_tabela, origem_id, tipo
    )
    SELECT
      e.sala_id,
      'Prazo de retirada vencido',
      format(
        'Sua encomenda (%s) está na portaria há mais de %s dias e o prazo de '
        || 'retirada venceu. Procure a administração.',
        coalesce(e.categoria, 'pacote'),
        v_prazo
      ),
      '/encomendas',
      'encomendas',
      e.id,
      'vencida'
    FROM public.encomendas e
    WHERE e.status = 'Pendente'
      AND coalesce(e.sala_id, '') <> ''
      AND e.created_at <= now() - (v_prazo || ' days')::interval
      AND NOT EXISTS (
        SELECT 1 FROM public.notificacoes_fila f
        WHERE f.origem_id = e.id AND f.tipo = 'vencida'
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_vencidas FROM novas;

  RETURN QUERY SELECT v_lembretes, v_vencidas;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.enfileirar_lembretes_retirada() FROM PUBLIC, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. Agendamento diário
-- ---------------------------------------------------------------------------
-- 12:00 UTC = 09:00 em Brasília. Uma vez por dia basta: o prazo é em dias, e
-- avisar de manhã é mais útil para o morador do que de madrugada.

SELECT cron.unschedule('lembretes-retirada')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lembretes-retirada');

SELECT cron.schedule(
  'lembretes-retirada',
  '0 12 * * *',
  $cron$ SELECT public.enfileirar_lembretes_retirada(); $cron$
);

NOTIFY pgrst, 'reload schema';
