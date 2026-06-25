-- Compras de fornecedores → contas a pagar + saídas do caixa (Fase 3 de Fornecedores).
-- Uma compra com payment_status = 'pending' é uma CONTA A PAGAR (não é saída no caixa
-- ainda). Ao marcar como 'paid', a aplicação cria um lançamento de despesa em
-- finance_entries e guarda o id em finance_entry_id (idempotência + rastreio).
-- Reusa o enum expense_category já existente (migrations 005/004). supplier_id e
-- finance_entry_id são ON DELETE SET NULL: apagar o fornecedor ou o lançamento não
-- apaga a compra.

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category expense_category NOT NULL DEFAULT 'material',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  purchased_at DATE NOT NULL,
  due_date DATE,
  paid_at DATE,
  finance_entry_id UUID REFERENCES finance_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases (user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases (supplier_id);
