-- Orçamentos: proposta enviada ao cliente ANTES de virar encomenda/venda.
-- Fluxo (papelaria, bolos de festa, eventos): orçar -> negociar -> aprovar ->
-- converter em encomenda (agenda). Itens livres (sem vínculo com produtos).
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  -- Nome livre quando o cliente nao esta cadastrado.
  client_name text,
  title text NOT NULL,
  -- [{ description, quantity, unitPrice }]
  items jsonb NOT NULL,
  total numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  valid_until date,
  notes text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_user_status ON quotes(user_id, status);
CREATE INDEX idx_quotes_user_created ON quotes(user_id, created_at DESC);
