-- Pix pronto na cobrança e extrato do fiado por link.
-- A chave Pix fica no perfil de quem vende; o link público (/f/:token) mostra
-- ao cliente o que está em aberto. Roda a cada boot da API (idempotente).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pix_key_type text,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_city text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pix_key_type_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_pix_key_type_check
      CHECK (pix_key_type IS NULL OR pix_key_type IN ('cpf_cnpj', 'phone', 'email', 'random'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.fiado_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  brand_id text NOT NULL DEFAULT 'lucro-caseiro',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiado_links_user_client
  ON public.fiado_links (user_id, client_id);

ALTER TABLE public.fiado_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.fiado_links FROM PUBLIC, anon, authenticated;
