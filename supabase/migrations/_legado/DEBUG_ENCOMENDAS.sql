-- 🔍 VERIFICAR ESTRUTURA DA TABELA ENCOMENDAS
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'encomendas';
