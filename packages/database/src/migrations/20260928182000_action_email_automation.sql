-- Explicitly opted-in product guidance. No existing user is subscribed by default.
CREATE SCHEMA IF NOT EXISTS app_email;
REVOKE ALL ON SCHEMA app_email FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_email.action_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  unsubscribe_token text NOT NULL UNIQUE CHECK (length(unsubscribe_token) = 64),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT action_preferences_consent CHECK (NOT enabled OR consented_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS action_preferences_enabled_since
  ON app_email.action_preferences(consented_at) WHERE enabled;

CREATE TABLE IF NOT EXISTS app_email.first_price_jobs (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sending','sent','review','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  lease_token uuid,
  leased_until timestamptz,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS first_price_jobs_pending
  ON app_email.first_price_jobs(next_attempt_at)
  WHERE status IN ('pending','sending');
CREATE INDEX IF NOT EXISTS first_price_jobs_sent
  ON app_email.first_price_jobs(sent_at) WHERE status = 'sent';

ALTER TABLE app_email.action_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_email.first_price_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_email.action_preferences, app_email.first_price_jobs
  FROM PUBLIC, anon, authenticated;
