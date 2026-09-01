-- 🔍 DEBUG: VERIFICAR SE OS DOCUMENTOS FORAM SALVOS

-- 1. Contar quantos documentos existem na tabela
SELECT 
  COUNT(*) as total_documentos 
FROM public.documentos;

-- 2. Listar os últimos 5 documentos inseridos (para ver se os dados estão corretos)
SELECT 
  id, 
  nome, 
  categoria, 
  created_at, 
  url 
FROM public.documentos 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar permissões (RLS) simulando o usuário anonimo e autenticado
-- (Apenas informativo, não altera nada)
SELECT * FROM pg_policies WHERE tablename = 'documentos';
