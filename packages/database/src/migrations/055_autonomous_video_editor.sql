CREATE TABLE IF NOT EXISTS video_edit_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id text NOT NULL,
  title text NOT NULL,
  brief text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  aspect_ratio text NOT NULL DEFAULT '9:16',
  target_duration_seconds integer,
  destination_channel text NOT NULL,
  source_campaign_id uuid,
  source_content_id uuid,
  iteration_count integer NOT NULL DEFAULT 0,
  max_iterations integer NOT NULL DEFAULT 3,
  plan jsonb,
  review jsonb,
  refinement_instruction text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_edit_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES video_edit_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'footage',
  name text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  size_bytes integer NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  duration_ms integer,
  width integer,
  height integer,
  transcript jsonb,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_video_edit_assets_job_path UNIQUE(job_id, storage_path)
);

CREATE TABLE IF NOT EXISTS video_edit_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES video_edit_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version integer NOT NULL,
  kind text NOT NULL,
  storage_path text NOT NULL,
  duration_ms integer NOT NULL,
  plan jsonb NOT NULL,
  review jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_video_edit_versions_job_version UNIQUE(job_id, version)
);

CREATE INDEX IF NOT EXISTS idx_video_edit_jobs_user_updated ON video_edit_jobs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_edit_jobs_status ON video_edit_jobs(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_video_edit_assets_job ON video_edit_assets(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_video_edit_versions_job ON video_edit_versions(job_id, created_at DESC);

ALTER TABLE video_edit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_edit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_edit_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON video_edit_jobs, video_edit_assets, video_edit_versions FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marketing-video-editor', 'marketing-video-editor', false, 2000000000, ARRAY[
  'video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'application/json'
])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "marketing_video_editor_owner_select" ON storage.objects;
CREATE POLICY "marketing_video_editor_owner_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketing-video-editor' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_video_editor_owner_insert" ON storage.objects;
CREATE POLICY "marketing_video_editor_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketing-video-editor' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_video_editor_owner_delete" ON storage.objects;
CREATE POLICY "marketing_video_editor_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'marketing-video-editor' AND (storage.foldername(name))[1] = auth.uid()::text);
