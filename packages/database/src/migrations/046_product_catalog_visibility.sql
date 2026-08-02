-- Separa disponibilidade operacional de publicação na vitrine.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS public_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_user_public
  ON products(user_id, is_active, public_enabled);
