CREATE TABLE IF NOT EXISTS push_notification_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL DEFAULT 'lucro-caseiro',
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_brand
  ON push_notification_tokens(user_id, brand_id);

ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
