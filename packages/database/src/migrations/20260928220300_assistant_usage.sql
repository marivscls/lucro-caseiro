-- Assistente (anotar venda falando e foto do caderno): contador mensal por
-- conta para o limite do plano. Só a API acessa.
CREATE TABLE IF NOT EXISTS public.assistant_usage (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.assistant_usage FROM PUBLIC, anon, authenticated;

-- Fiado trazido do caderno vira uma venda em aberto só com a anotação (sem
-- produto nem serviço). Mantém a regra antiga e aceita também o item só com nome.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sale_items_source_required'
      AND pg_get_constraintdef(oid) LIKE '%item_name%'
  ) THEN
    ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_source_required;
    ALTER TABLE public.sale_items
      ADD CONSTRAINT sale_items_source_required
      CHECK (product_id IS NOT NULL OR service_id IS NOT NULL OR item_name IS NOT NULL);
  END IF;
END $$;
