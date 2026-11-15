-- Migração — Bucket público somente-leitura para vídeos curtos de ajuda (`tutorials`).
--
-- Idempotente. Pode ser rodada no SQL Editor do Supabase.
-- Leitura pública liberada; upload/alteração/exclusão restritos ao painel ou service_role
-- (nenhuma política de escrita para `anon` ou `authenticated`).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutorials',
  'tutorials',
  true,
  5242880,
  ARRAY['video/mp4']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "tutorials public read" ON storage.objects;
CREATE POLICY "tutorials public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'tutorials');
