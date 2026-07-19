CREATE TABLE retail_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  party_id uuid,
  amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  deposit numeric(12, 2) NOT NULL DEFAULT 0 CHECK (deposit >= 0 AND deposit <= amount),
  due_at timestamptz,
  reserved_until timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retail_documents_user_kind ON retail_documents(user_id, kind);
CREATE INDEX idx_retail_documents_user_status ON retail_documents(user_id, status);
CREATE INDEX idx_retail_documents_reservation ON retail_documents(reserved_until);
CREATE UNIQUE INDEX uq_retail_open_cash_session
  ON retail_documents(user_id)
  WHERE kind = 'cash_session' AND status = 'open';

CREATE TABLE retail_document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES retail_documents(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variation_id uuid,
  name text NOT NULL,
  variation_name text,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_retail_document_items_document ON retail_document_items(document_id);
CREATE INDEX idx_retail_document_items_product ON retail_document_items(product_id);

CREATE TABLE retail_cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES retail_documents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sale', 'supply', 'withdrawal', 'refund')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'cash', 'card', 'credit', 'transfer')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  reference_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retail_cash_movements_session ON retail_cash_movements(session_id);

CREATE TABLE retail_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_pay_y')),
  value numeric(12, 2) NOT NULL CHECK (value > 0),
  buy_quantity integer,
  pay_quantity integer,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (product_id IS NOT NULL OR category IS NOT NULL),
  CHECK (type <> 'buy_x_pay_y' OR (buy_quantity > pay_quantity AND pay_quantity > 0))
);

CREATE INDEX idx_retail_promotions_user_period ON retail_promotions(user_id, starts_at);

CREATE TABLE retail_business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('school', 'company', 'office', 'agreement')),
  legal_name text NOT NULL,
  document text,
  contact_name text,
  credit_limit numeric(12, 2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  used_credit numeric(12, 2) NOT NULL DEFAULT 0 CHECK (used_credit >= 0),
  due_days integer NOT NULL DEFAULT 0 CHECK (due_days BETWEEN 0 AND 365),
  discount_percent numeric(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE TABLE retail_price_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_price numeric(12, 2) NOT NULL CHECK (previous_price > 0),
  new_price numeric(12, 2) NOT NULL CHECK (new_price > 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retail_price_changes_product ON retail_price_changes(product_id, created_at);
