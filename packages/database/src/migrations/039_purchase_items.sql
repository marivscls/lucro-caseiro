CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  variation_id uuid,
  variation_name text,
  quantity numeric(12, 0) NOT NULL CHECK (quantity > 0),
  unit_cost numeric(10, 2) NOT NULL CHECK (unit_cost >= 0),
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase
  ON purchase_items(purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_product
  ON purchase_items(product_id);
