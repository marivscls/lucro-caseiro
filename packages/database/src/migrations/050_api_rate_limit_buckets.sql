CREATE TABLE IF NOT EXISTS api_rate_limit_buckets (
  key_hash text NOT NULL,
  bucket_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  CONSTRAINT api_rate_limit_buckets_pkey PRIMARY KEY (key_hash, bucket_start)
);

CREATE INDEX IF NOT EXISTS api_rate_limit_buckets_expires_idx
  ON api_rate_limit_buckets (expires_at);
