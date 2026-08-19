-- Evolui fornecedores sem duplicar métricas de compras. Registros antigos
-- continuam ativos, na categoria Outros, com avatar por iniciais.
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS has_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchase_description text,
  ADD COLUMN IF NOT EXISTS is_preferred boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_type text NOT NULL DEFAULT 'initials',
  ADD COLUMN IF NOT EXISTS avatar_preset_id text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS needs_follow_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restock_soon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_suppliers_user_active
  ON suppliers (user_id, is_active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_category_check'
  ) THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_category_check
      CHECK (category IN ('supplies', 'packaging', 'food', 'other'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_avatar_type_check'
  ) THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_avatar_type_check
      CHECK (avatar_type IN ('preset', 'upload', 'initials'));
  END IF;
END $$;
