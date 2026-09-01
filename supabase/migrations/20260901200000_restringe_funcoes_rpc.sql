-- ============================================================================
-- Restringe funções SECURITY DEFINER expostas como RPC
-- ============================================================================
-- O advisor 0029 do Supabase aponta funções SECURITY DEFINER chamáveis por
-- qualquer usuário logado via /rest/v1/rpc/<nome>.
--
-- is_admin(), is_staff() e current_sala() PRECISAM continuar executáveis por
-- `authenticated`: as policies RLS as chamam, e a expressão de uma policy é
-- avaliada com os privilégios de quem invoca. Revogá-las derrubaria o RLS
-- inteiro. Além disso, elas só falam sobre o próprio chamador — não vazam nada.
--
-- As outras três são tratadas aqui.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- get_database_size(): expunha o tamanho do banco a qualquer usuário logado.
-- O frontend já só chama para admin (Dashboard.tsx), mas isso é conveniência
-- de UI, não autorização — a rota RPC continuava aberta a um morador.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;

  RETURN pg_size_pretty(pg_database_size(current_database()));
END;
$fn$;


-- ---------------------------------------------------------------------------
-- check_user_active() e get_my_role(): restaram do RLS antigo. Verificado que
-- nenhuma policy, nenhuma outra função e nenhuma tela as usa — mas seguem
-- publicadas como endpoint RPC.
--
-- Revogado em vez de removido: se algo fora do repositório ainda chamar,
-- volta com um GRANT, sem precisar recriar a função.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.check_user_active() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_role()       FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
