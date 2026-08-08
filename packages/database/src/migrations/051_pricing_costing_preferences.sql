-- Precificação completa: custeio por faturamento e perfis de taxas por canal.

ALTER TABLE pricing_calculations
  ADD COLUMN IF NOT EXISTS allocation_mode varchar(20) NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS monthly_fixed_costs numeric(12,2),
  ADD COLUMN IF NOT EXISTS revenue_basis numeric(12,2),
  ADD COLUMN IF NOT EXISTS overhead_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel_name varchar(60);

ALTER TABLE pricing_calculations
  DROP CONSTRAINT IF EXISTS pricing_calculations_allocation_mode_check;

ALTER TABLE pricing_calculations
  ADD CONSTRAINT pricing_calculations_allocation_mode_check
  CHECK (allocation_mode IN ('unit', 'revenue'));

CREATE TABLE IF NOT EXISTS pricing_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  channel_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
