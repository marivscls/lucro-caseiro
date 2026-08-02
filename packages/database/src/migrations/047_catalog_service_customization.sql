-- Separa a apresentação da vitrine de serviços sem alterar a identidade compartilhada.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_settings'
      AND column_name = 'service_cover_url'
  ) THEN
    ALTER TABLE catalog_settings
      ADD COLUMN service_cover_url text,
      ADD COLUMN service_tagline text,
      ADD COLUMN service_promo_banner text;

    UPDATE catalog_settings
    SET service_cover_url = cover_url,
        service_tagline = tagline,
        service_promo_banner = promo_banner;
  END IF;
END $$;
