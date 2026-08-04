CREATE TABLE IF NOT EXISTS subscription_purchase_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_purchase_claims_provider_token_uidx
  ON subscription_purchase_claims(provider, token_hash);

CREATE INDEX IF NOT EXISTS subscription_purchase_claims_user_idx
  ON subscription_purchase_claims(user_id);
