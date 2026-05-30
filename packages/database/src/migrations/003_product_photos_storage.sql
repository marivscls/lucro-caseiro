-- Migração 003 — Storage para fotos de produto.
--
-- Cria o bucket público `product-photos` e as políticas de acesso para o app conseguir
-- subir a foto do produto (escopada na pasta do próprio usuário) e exibi-la publicamente.
-- Idempotente. Rode no SQL Editor do Supabase.

-- 1. bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. políticas em storage.objects (recriadas de forma idempotente)
DROP POLICY IF EXISTS "product-photos public read" ON storage.objects;
CREATE POLICY "product-photos public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-photos');

DROP POLICY IF EXISTS "product-photos upload own" ON storage.objects;
CREATE POLICY "product-photos upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product-photos update own" ON storage.objects;
CREATE POLICY "product-photos update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product-photos delete own" ON storage.objects;
CREATE POLICY "product-photos delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
