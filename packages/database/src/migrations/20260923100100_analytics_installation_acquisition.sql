-- Origem da instalação gravada só no primeiro insert (UTM da web / Install Referrer).
-- `referrer` guarda apenas o host de origem, nunca a URL completa.

ALTER TABLE analytics_installations
  ADD COLUMN IF NOT EXISTS utm_source TEXT
    CHECK (utm_source IS NULL OR char_length(utm_source) BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS utm_medium TEXT
    CHECK (utm_medium IS NULL OR char_length(utm_medium) BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT
    CHECK (utm_campaign IS NULL OR char_length(utm_campaign) BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS utm_content TEXT
    CHECK (utm_content IS NULL OR char_length(utm_content) BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS referrer TEXT
    CHECK (referrer IS NULL OR char_length(referrer) BETWEEN 1 AND 200);
