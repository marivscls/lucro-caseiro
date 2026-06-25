-- Gastos recorrentes (despesa fixa que se repete todo mês). Template; os
-- lançamentos reais caem em finance_entries (recurring_expense_id) ao abrir o mês.
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text NOT NULL,
  day_of_month integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user ON recurring_expenses (user_id);

-- Liga o lançamento gerado ao seu template (idempotência mensal).
ALTER TABLE finance_entries
  ADD COLUMN IF NOT EXISTS recurring_expense_id uuid
  REFERENCES recurring_expenses (id) ON DELETE SET NULL;
