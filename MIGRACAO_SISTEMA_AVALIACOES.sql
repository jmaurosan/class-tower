-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacoes_empresas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, user_id)
);

-- Ativar RLS
ALTER TABLE avaliacoes_empresas ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Publico pode ver avaliacoes" 
ON avaliacoes_empresas FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados podem avaliar" 
ON avaliacoes_empresas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem editar suas proprias avaliacoes" 
ON avaliacoes_empresas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar suas proprias avaliacoes" 
ON avaliacoes_empresas FOR DELETE 
USING (auth.uid() = user_id);

-- Atualizar tabela Empresas para cache de média
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 1) DEFAULT 0.0;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;

-- Função Trigger para atualizar média
CREATE OR REPLACE FUNCTION update_empresa_rating_stats() 
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
BEGIN
    target_id := COALESCE(NEW.empresa_id, OLD.empresa_id);
    
    UPDATE empresas 
    SET 
        average_rating = (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0) FROM avaliacoes_empresas WHERE empresa_id = target_id),
        ratings_count = (SELECT COUNT(*) FROM avaliacoes_empresas WHERE empresa_id = target_id)
    WHERE id = target_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_avaliacao_change ON avaliacoes_empresas;
CREATE TRIGGER on_avaliacao_change
AFTER INSERT OR UPDATE OR DELETE ON avaliacoes_empresas
FOR EACH ROW EXECUTE FUNCTION update_empresa_rating_stats();
