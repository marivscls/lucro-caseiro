CREATE SCHEMA IF NOT EXISTS app_email;
REVOKE ALL ON SCHEMA app_email FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_email.trial_reminder_jobs (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('three_days','one_day','ended')),
  trial_expires_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','review','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  lease_token uuid,
  leased_until timestamptz,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stage)
);
CREATE INDEX IF NOT EXISTS trial_reminder_jobs_pending
  ON app_email.trial_reminder_jobs (next_attempt_at)
  WHERE status IN ('pending','sending');
CREATE INDEX IF NOT EXISTS users_active_trial_expiry
  ON public.users (plan_expires_at)
  WHERE plan = 'essential' AND plan_is_trial = true;
ALTER TABLE app_email.trial_reminder_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_email.trial_reminder_jobs FROM PUBLIC, anon, authenticated;
