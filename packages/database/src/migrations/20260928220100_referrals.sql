-- Indicação premiada: cada conta tem um código; quem entra com o código de
-- alguém fica ligada a essa pessoa. Quando a conta indicada registra a 3ª venda,
-- as duas ganham 30 dias do Essencial (referral_rewarded_at evita pagar duas vezes).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS referred_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_rewarded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique
  ON public.users (referral_code);

CREATE INDEX IF NOT EXISTS idx_users_referred_by
  ON public.users (referred_by)
  WHERE referred_by IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_referred_by_fkey') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_referred_by_fkey
      FOREIGN KEY (referred_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_referred_by_not_self') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_referred_by_not_self
      CHECK (referred_by IS NULL OR referred_by <> id);
  END IF;
END $$;
