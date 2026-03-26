-- Execute este comando no SQL Editor do seu projeto Supabase
-- para habilitar a visualização do tamanho do banco no Dashboard.

CREATE OR REPLACE FUNCTION get_database_size()
RETURNS text AS $$
BEGIN
  RETURN pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
