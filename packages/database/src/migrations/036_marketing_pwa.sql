CREATE TABLE IF NOT EXISTS marketing_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL, slug text NOT NULL, title text NOT NULL, summary text, status text NOT NULL DEFAULT 'active',
  scheduled_for timestamptz, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, kind, slug)
);
CREATE INDEX IF NOT EXISTS idx_marketing_resources_user_kind ON marketing_resources(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_marketing_resources_schedule ON marketing_resources(user_id, scheduled_for);

CREATE TABLE IF NOT EXISTS marketing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL, title text NOT NULL, body text NOT NULL DEFAULT '', tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'manual', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_marketing_documents_user_updated ON marketing_documents(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS marketing_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES marketing_documents(id) ON DELETE CASCADE,
  version integer NOT NULL, title text NOT NULL, body text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, version)
);
CREATE TABLE IF NOT EXISTS marketing_document_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES marketing_documents(id) ON DELETE CASCADE,
  name text NOT NULL, mime_type text NOT NULL, storage_path text NOT NULL, size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova conversa', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES marketing_ai_sessions(id) ON DELETE CASCADE,
  role text NOT NULL, body text NOT NULL, context jsonb NOT NULL DEFAULT '{}'::jsonb, model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version integer NOT NULL, body text NOT NULL, note text, is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, version)
);
CREATE TABLE IF NOT EXISTS marketing_ai_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL, body text NOT NULL, source_type text NOT NULL, source_id uuid, tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  canonical boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input text NOT NULL, output text NOT NULL, tags jsonb NOT NULL DEFAULT '[]'::jsonb, approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL, prompt text NOT NULL, expected text NOT NULL, tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_score integer, last_output text, last_run_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES marketing_ai_messages(id) ON DELETE CASCADE, rating text NOT NULL, note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_class text NOT NULL, action text NOT NULL, status text NOT NULL, reason text NOT NULL,
  before jsonb, after jsonb, score integer, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_ai_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, class_a_enabled boolean NOT NULL DEFAULT true,
  class_b_enabled boolean NOT NULL DEFAULT true, class_c_enabled boolean NOT NULL DEFAULT false,
  minimum_samples integer NOT NULL DEFAULT 5, minimum_score integer NOT NULL DEFAULT 80,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_ai_sessions_user ON marketing_ai_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_ai_messages_session ON marketing_ai_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_ai_knowledge_user ON marketing_ai_knowledge(user_id, active);
CREATE INDEX IF NOT EXISTS idx_marketing_ai_feedback_user ON marketing_ai_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_ai_learning_user ON marketing_ai_learning(user_id, created_at DESC);

ALTER TABLE marketing_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ai_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON marketing_resources, marketing_documents, marketing_document_versions,
  marketing_document_attachments, marketing_ai_sessions, marketing_ai_messages,
  marketing_ai_instructions, marketing_ai_knowledge, marketing_ai_examples,
  marketing_ai_evaluations, marketing_ai_feedback, marketing_ai_learning,
  marketing_ai_settings FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marketing-documents', 'marketing-documents', false, 20971520, ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]) ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "marketing_documents_owner_select" ON storage.objects;
CREATE POLICY "marketing_documents_owner_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketing-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_documents_owner_insert" ON storage.objects;
CREATE POLICY "marketing_documents_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketing-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "marketing_documents_owner_delete" ON storage.objects;
CREATE POLICY "marketing_documents_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'marketing-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
