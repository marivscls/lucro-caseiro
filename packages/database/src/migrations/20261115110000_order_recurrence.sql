-- Encomenda que se repete: ao ser entregue, a próxima é criada sozinha.
-- Idempotente: roda a cada boot.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recurrence text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_recurrence_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_recurrence_check
      CHECK (recurrence IS NULL OR recurrence IN ('weekly', 'biweekly', 'monthly'));
  END IF;
END $$;
