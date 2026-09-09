CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL,
  keys JSONB NOT NULL,
  timezone TEXT NOT NULL,
  prefs JSONB NOT NULL DEFAULT '{}',
  morning_date DATE,
  evening_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_after TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_web_push_user_brand ON web_push_subscriptions(user_id, brand_id);
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON web_push_subscriptions FROM anon, authenticated;
