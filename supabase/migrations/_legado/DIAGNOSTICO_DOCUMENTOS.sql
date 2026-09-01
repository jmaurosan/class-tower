-- 🧪 DIAGNÓSTICO: TENTATIVA DE INSERÇÃO MANUAL

-- 1. Tentar inserir um documento de teste manualmente
INSERT INTO public.documentos (nome, categoria, tamanho, tipo, url, storage_path)
VALUES (
  'Documento Teste Manual',
  'Atas',
  '100 KB',
  'pdf',
  'https://www.google.com',
  'condominio/teste_manual.pdf'
);

-- 2. Verificar se ele aparece na lista
SELECT * FROM public.documentos WHERE nome = 'Documento Teste Manual';

-- 3. Listar tudo novamente
SELECT id, nome, categoria, created_at FROM public.documentos;
