-- Operação acionável: descontos, estoque auditável, serviços, produção e follow-up.

ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal numeric(10,2);
UPDATE sales SET subtotal = total WHERE subtotal IS NULL;
ALTER TABLE sales ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_value numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS subtotal numeric(10,2);
UPDATE quotes SET subtotal = total WHERE subtotal IS NULL;
ALTER TABLE quotes ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_value numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS estimated_cost numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_contact_at date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_contact_reason text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_contact_notes text;
CREATE INDEX IF NOT EXISTS idx_clients_user_next_contact
  ON clients(user_id, next_contact_at);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
  default_price numeric(10,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_user_active ON services(user_id, active);
CREATE INDEX IF NOT EXISTS idx_services_user_name ON services(user_id, name);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id)
  ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS duration_minutes numeric(6,0);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_id uuid,
  type text NOT NULL CHECK (type IN ('sale','purchase','adjustment','cancellation','production')),
  delta numeric(12,3) NOT NULL CHECK (delta <> 0),
  balance_after numeric(12,3),
  reason text,
  source_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_product
  ON stock_movements(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_date
  ON stock_movements(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS production_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  planned_quantity numeric(12,3) NOT NULL CHECK (planned_quantity > 0),
  produced_quantity numeric(12,3) NOT NULL CHECK (produced_quantity >= 0),
  planned_cost numeric(12,2) NOT NULL CHECK (planned_cost >= 0),
  actual_cost numeric(12,2) NOT NULL CHECK (actual_cost >= 0),
  waste_cost numeric(12,2) NOT NULL CHECK (waste_cost >= 0),
  status text NOT NULL DEFAULT 'closed' CHECK (status IN ('draft','closed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_production_runs_user_created
  ON production_runs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_production_runs_user_product
  ON production_runs(user_id, product_id);

CREATE TABLE IF NOT EXISTS production_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_run_id uuid NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id),
  planned_quantity numeric(12,3) NOT NULL CHECK (planned_quantity >= 0),
  actual_quantity numeric(12,3) NOT NULL CHECK (actual_quantity >= 0),
  waste_quantity numeric(12,3) NOT NULL DEFAULT 0 CHECK (waste_quantity >= 0),
  unit_cost numeric(12,4) NOT NULL CHECK (unit_cost >= 0)
);
CREATE INDEX IF NOT EXISTS idx_production_run_items_run
  ON production_run_items(production_run_id);
