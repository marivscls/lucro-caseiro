ALTER TABLE catalog_settings
  ADD COLUMN IF NOT EXISTS title_color text,
  ADD COLUMN IF NOT EXISTS description_color text,
  ADD COLUMN IF NOT EXISTS service_title_color text,
  ADD COLUMN IF NOT EXISTS service_description_color text;
