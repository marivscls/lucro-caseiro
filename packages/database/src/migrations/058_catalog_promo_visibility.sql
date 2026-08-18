ALTER TABLE catalog_settings
  ADD COLUMN IF NOT EXISTS promo_banner_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS service_promo_banner_enabled boolean NOT NULL DEFAULT true;
