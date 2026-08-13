CREATE TABLE IF NOT EXISTS character_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id text NOT NULL,
  internal_name text NOT NULL,
  source_type text NOT NULL,
  consent_mode text NOT NULL,
  immutable_traits jsonb NOT NULL DEFAULT '{}'::jsonb,
  variable_traits jsonb NOT NULL DEFAULT '{}'::jsonb,
  locked_traits jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  identity_prompt text NOT NULL DEFAULT '',
  negative_prompt text NOT NULL DEFAULT '',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, brand_id, internal_name)
);

CREATE TABLE IF NOT EXISTS video_prompt_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id text NOT NULL,
  title text NOT NULL,
  format text NOT NULL,
  aspect_ratio text NOT NULL,
  duration integer NOT NULL,
  objective text NOT NULL,
  visual_mode text NOT NULL,
  topic_id text,
  offer_id text,
  feature_id text,
  audience_id text,
  funnel_stage text NOT NULL,
  angle text NOT NULL DEFAULT '',
  cta text NOT NULL,
  destination_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_tool text,
  character_profile_id uuid REFERENCES character_profiles(id) ON DELETE SET NULL,
  voice_profile_id text,
  context_version text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES video_prompt_projects(id) ON DELETE CASCADE,
  scene_order integer NOT NULL,
  start_time integer NOT NULL,
  end_time integer NOT NULL,
  narrative_role text NOT NULL,
  character_present boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  character_direction text NOT NULL DEFAULT '',
  camera_direction text NOT NULL DEFAULT '',
  lighting_direction text NOT NULL DEFAULT '',
  dialogue text NOT NULL DEFAULT '',
  narration text NOT NULL DEFAULT '',
  on_screen_text text NOT NULL DEFAULT '',
  transition text NOT NULL DEFAULT '',
  product_evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  continuity_notes text NOT NULL DEFAULT '',
  movement_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(project_id, scene_order),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS video_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES video_prompt_projects(id) ON DELETE CASCADE,
  version integer NOT NULL,
  canonical_prompt jsonb NOT NULL,
  adapted_prompt text,
  target_tool text,
  quality_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  similarity_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  generation_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_character_profiles_user_brand ON character_profiles(user_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_video_prompt_projects_user_updated ON video_prompt_projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_prompt_projects_user_status ON video_prompt_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_video_prompt_projects_character ON video_prompt_projects(character_profile_id);
CREATE INDEX IF NOT EXISTS idx_video_scenes_project ON video_scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_video_prompt_versions_project ON video_prompt_versions(project_id, created_at DESC);

ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_prompt_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_prompt_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON character_profiles, video_prompt_projects, video_scenes, video_prompt_versions FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marketing-video-references', 'marketing-video-references', false, 10485760, ARRAY[
  'image/jpeg', 'image/png', 'image/webp'
]) ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "marketing_video_references_owner_select" ON storage.objects;
CREATE POLICY "marketing_video_references_owner_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketing-video-references' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_video_references_owner_insert" ON storage.objects;
CREATE POLICY "marketing_video_references_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketing-video-references' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_video_references_owner_delete" ON storage.objects;
CREATE POLICY "marketing_video_references_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'marketing-video-references' AND (storage.foldername(name))[1] = auth.uid()::text);
