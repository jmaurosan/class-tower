-- 🔓 LIBERAR LEITURA DE SALAS PARA USUÁRIOS ANÔNIMOS (CADASTRO)
-- Execute este script no SQL Editor do Supabase

-- A tela de "Primeiro Acesso" precisa buscar a sala sem estar logado.
-- Por isso, precisamos liberar a leitura da tabela 'salas' para usuários anônimos (anon role).

ALTER TABLE public.salas DISABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas (seguras mesmo que não existam — IF EXISTS)
DROP POLICY IF EXISTS "salas_select_v2" ON public.salas;
DROP POLICY IF EXISTS "salas_staff_all_v2" ON public.salas;
DROP POLICY IF EXISTS "Salas visíveis para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Staff gerencia salas" ON public.salas;
DROP POLICY IF EXISTS "Allow read salas for authenticated" ON public.salas;
DROP POLICY IF EXISTS "Allow write salas for authenticated" ON public.salas;

-- LEITURA: qualquer pessoa (anon inclusive) pode consultar salas para validar o número
CREATE POLICY "salas_read_public" ON public.salas 
  FOR SELECT TO anon, authenticated 
  USING (true);

-- ESCRITA: apenas usuários autenticados (admins/atendentes no frontend)
CREATE POLICY "salas_write_authenticated" ON public.salas 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload config';

SELECT '✅ Salas liberadas para leitura anônima (necessário para o Primeiro Acesso).' as status;
