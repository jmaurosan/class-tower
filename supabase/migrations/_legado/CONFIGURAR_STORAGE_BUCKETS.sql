-- =============================================
-- 📦 CONFIGURAR STORAGE BUCKETS — ClassTower
-- Execute no SQL Editor do Supabase
-- =============================================

-- =============================================
-- PASSO 1: CRIAR OS BUCKETS
-- =============================================

-- Bucket para fotos de encomendas/pacotes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'encomendas-fotos',
  'encomendas-fotos',
  false,                          -- Privado: apenas usuários autenticados acessam
  5242880,                        -- Limite: 5MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de inspeções e manutenções
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspecoes-fotos',
  'inspecoes-fotos',
  false,                          -- Privado: apenas usuários autenticados acessam
  10485760,                       -- Limite: 10MB por arquivo (inspeções podem ser maiores)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PASSO 2: POLÍTICAS DE ACESSO — Encomendas
-- =============================================

-- Qualquer usuário autenticado pode VER fotos de encomendas
CREATE POLICY "encomendas_fotos_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'encomendas-fotos');

-- Apenas admin e atendente podem FAZER UPLOAD
CREATE POLICY "encomendas_fotos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'encomendas-fotos'
  AND (
    -- Verifica role na tabela profiles
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'atendente')
    )
  )
);

-- Apenas admin pode EXCLUIR fotos de encomendas
CREATE POLICY "encomendas_fotos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'encomendas-fotos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =============================================
-- PASSO 3: POLÍTICAS DE ACESSO — Inspeções
-- =============================================

-- Qualquer usuário autenticado pode VER fotos de inspeções
CREATE POLICY "inspecoes_fotos_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inspecoes-fotos');

-- Admin e atendente podem FAZER UPLOAD de inspeções
CREATE POLICY "inspecoes_fotos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspecoes-fotos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'atendente')
  )
);

-- Apenas admin pode EXCLUIR fotos de inspeções
CREATE POLICY "inspecoes_fotos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspecoes-fotos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT 
  id as bucket,
  name,
  public as "é_público",
  ROUND(file_size_limit / 1048576.0, 0) || 'MB' as "limite_por_arquivo",
  allowed_mime_types as "tipos_permitidos"
FROM storage.buckets
WHERE id IN ('encomendas-fotos', 'inspecoes-fotos');

SELECT '✅ Buckets de Storage criados com sucesso!' as status;
