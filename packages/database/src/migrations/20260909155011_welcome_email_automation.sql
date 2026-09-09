-- Internal delivery state. No API role can read recipient addresses or content.
CREATE SCHEMA IF NOT EXISTS app_email;
REVOKE ALL ON SCHEMA app_email FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_email.welcome_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  activated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_email.welcome_jobs (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','review','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  lease_token uuid,
  leased_until timestamptz,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS welcome_jobs_pending ON app_email.welcome_jobs (next_attempt_at) WHERE status IN ('pending','sending');
ALTER TABLE app_email.welcome_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_email.welcome_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA app_email FROM PUBLIC, anon, authenticated;

-- Do not backfill existing users. The worker records activation once when enabled.
