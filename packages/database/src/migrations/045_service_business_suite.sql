-- Serviços v2: opções, pacotes, ciclo do atendimento, recebimento e divulgação.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS location_mode text NOT NULL DEFAULT 'flexible';
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS public_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS booking_instructions text;

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_location_mode_valid;
ALTER TABLE services
  ADD CONSTRAINT services_location_mode_valid
  CHECK (location_mode IN ('business','client','online','flexible'));
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_buffer_minutes_range;
ALTER TABLE services
  ADD CONSTRAINT services_buffer_minutes_range
  CHECK (buffer_minutes BETWEEN 0 AND 1440);

CREATE TABLE IF NOT EXISTS service_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_variations_service
  ON service_variations(user_id, service_id, active);

CREATE TABLE IF NOT EXISTS service_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0
    CHECK (duration_minutes BETWEEN 0 AND 1440),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_add_ons_service
  ON service_add_ons(user_id, service_id, active);

CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  sessions integer NOT NULL CHECK (sessions BETWEEN 2 AND 365),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  validity_days integer NOT NULL CHECK (validity_days BETWEEN 1 AND 3650),
  recurrence_days integer CHECK (recurrence_days BETWEEN 1 AND 365),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_packages_service
  ON service_packages(user_id, service_id, active);

CREATE TABLE IF NOT EXISTS service_package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES service_packages(id),
  service_id uuid NOT NULL REFERENCES services(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  sessions_total integer NOT NULL CHECK (sessions_total > 0),
  sessions_used integer NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  price_paid numeric(10,2) NOT NULL CHECK (price_paid > 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at date NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','expired','cancelled')),
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_service_package_purchases_client
  ON service_package_purchases(user_id, client_id, service_id, status);

CREATE TABLE IF NOT EXISTS service_package_session_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES service_package_purchases(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_package_session_usages_purchase
  ON service_package_session_usages(user_id, purchase_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_variation_id uuid
  REFERENCES service_variations(id) ON DELETE SET NULL;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_variation_name text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_add_on_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_add_on_names text[] NOT NULL DEFAULT '{}';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_package_purchase_id uuid
  REFERENCES service_package_purchases(id) ON DELETE SET NULL;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS appointment_status text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS location_mode text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS location_details text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS actual_cost numeric(10,2);
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_appointment_status_valid;
ALTER TABLE orders
  ADD CONSTRAINT orders_appointment_status_valid
  CHECK (
    appointment_status IS NULL OR appointment_status IN (
      'scheduled','confirmed','in_progress','completed','cancelled','no_show'
    )
  );
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_location_mode_valid;
ALTER TABLE orders
  ADD CONSTRAINT orders_location_mode_valid
  CHECK (
    location_mode IS NULL OR location_mode IN ('business','client','online')
  );
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_actual_cost_non_negative;
ALTER TABLE orders
  ADD CONSTRAINT orders_actual_cost_non_negative
  CHECK (actual_cost IS NULL OR actual_cost >= 0);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) NOT NULL DEFAULT 0;
UPDATE sales SET paid_amount = total WHERE status = 'paid' AND paid_amount = 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source_order_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_source_order_unique
  ON sales(source_order_id) WHERE source_order_id IS NOT NULL;

ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_source_required;
ALTER TABLE sale_items
  ADD CONSTRAINT sale_items_source_required
  CHECK (product_id IS NOT NULL OR service_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS public_service_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  client_name text NOT NULL,
  phone text NOT NULL,
  desired_date date NOT NULL,
  desired_time text,
  location_mode text NOT NULL
    CHECK (location_mode IN ('business','client','online')),
  notes text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','confirmed','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_public_service_booking_requests_owner
  ON public_service_booking_requests(user_id, status, created_at DESC);
