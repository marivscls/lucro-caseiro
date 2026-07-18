-- Product variations live with the product so create/update remains atomic.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS variations jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_variations_array;

ALTER TABLE public.products
  ADD CONSTRAINT products_variations_array
  CHECK (jsonb_typeof(variations) = 'array');

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS variation_id uuid,
  ADD COLUMN IF NOT EXISTS variation_name text;

-- Rollback:
-- ALTER TABLE public.sale_items DROP COLUMN IF EXISTS variation_name,
--   DROP COLUMN IF EXISTS variation_id;
-- ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_variations_array,
--   DROP COLUMN IF EXISTS variations;
