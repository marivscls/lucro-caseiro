ALTER TABLE catalog_settings
  ADD COLUMN IF NOT EXISTS brand_id text NOT NULL DEFAULT 'lucro-caseiro';
