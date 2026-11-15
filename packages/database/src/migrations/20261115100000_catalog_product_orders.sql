-- Pedido de produto feito pela cliente na vitrine pública (/c/:slug) vira
-- encomenda na agenda. Guarda a origem e o contato digitado pela cliente,
-- já que ela pode não estar cadastrada. Idempotente: roda a cada boot.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_source_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_source_check CHECK (source IS NULL OR source IN ('catalog'));
  END IF;
END $$;
