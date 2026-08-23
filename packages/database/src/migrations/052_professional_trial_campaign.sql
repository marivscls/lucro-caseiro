-- Historico da campanha de 1 mes de Profissional para os primeiros 100.
-- As 8 concessoes manuais de 2026-08-06 e as automaticas ja gravadas
-- permanecem. A oferta para cadastros novos esta encerrada: o signup
-- so cria a conta Free e o e-mail da campanha segue so para quem ja
-- tinha concessao pendente.

CREATE TABLE IF NOT EXISTS public.professional_trial_campaigns (
  campaign_key text PRIMARY KEY,
  max_grants integer NOT NULL CHECK (max_grants > 0),
  grants_count integer NOT NULL DEFAULT 0 CHECK (grants_count >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (grants_count <= max_grants)
);

CREATE TABLE IF NOT EXISTS public.professional_trial_campaign_grants (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_key text NOT NULL REFERENCES public.professional_trial_campaigns(campaign_key),
  email text NOT NULL,
  source text NOT NULL CHECK (source IN ('initial_2026_08_06', 'automatic')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  email_claimed_at timestamptz,
  email_sent_at timestamptz,
  email_message_id text,
  email_attempts integer NOT NULL DEFAULT 0 CHECK (email_attempts >= 0),
  email_last_error text
);

CREATE INDEX IF NOT EXISTS professional_trial_campaign_pending_email_idx
  ON public.professional_trial_campaign_grants (granted_at)
  WHERE email_sent_at IS NULL;

ALTER TABLE public.professional_trial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_trial_campaign_grants ENABLE ROW LEVEL SECURITY;

INSERT INTO public.professional_trial_campaigns (
  campaign_key,
  max_grants,
  grants_count,
  active
)
VALUES ('professional-first-100-2026', 100, 0, false)
ON CONFLICT (campaign_key) DO UPDATE
SET
  max_grants = EXCLUDED.max_grants,
  active = false;

SELECT pg_advisory_xact_lock(hashtext('professional-first-100-2026'));

INSERT INTO public.professional_trial_campaign_grants (
  user_id,
  campaign_key,
  email,
  source,
  granted_at,
  expires_at,
  email_sent_at
)
SELECT
  u.id,
  'professional-first-100-2026',
  u.email,
  'initial_2026_08_06',
  '2026-08-06T16:13:15.823Z'::timestamptz,
  u.plan_expires_at,
  '2026-08-06T16:13:15.823Z'::timestamptz
FROM public.users u
WHERE lower(u.email) = ANY (ARRAY[
  'lethfreiregomes@gmail.com',
  'cana5499@gmail.com',
  'anndreiamoreira55@gmail.com',
  'patriciamarcelinoox@gmail.com',
  'apsilvacruz@gmail.com',
  'comercial.triades@gmail.com',
  'jose.santiagojs198@gmail.com',
  'manoelsantos5672@gmail.com'
])
  AND u.plan_expires_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.professional_trial_campaigns
SET grants_count = (
  SELECT count(*)
  FROM public.professional_trial_campaign_grants
  WHERE campaign_key = 'professional-first-100-2026'
)
WHERE campaign_key = 'professional-first-100-2026';

-- Campanha encerrada: nao conceder mais vagas em boot da API nem no signup.
-- Concessoes ja gravadas e suas datas de expiracao permanecem intactas.
UPDATE public.professional_trial_campaigns
SET
  grants_count = (
    SELECT count(*)
    FROM public.professional_trial_campaign_grants
    WHERE campaign_key = 'professional-first-100-2026'
  ),
  active = false
WHERE campaign_key = 'professional-first-100-2026';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users u
  WHERE u.email = COALESCE(NEW.email, '')
    AND u.id <> NEW.id
    AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id);

  INSERT INTO public.users (id, email, name, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'Usuario'),
    NULLIF(NEW.raw_user_meta_data->>'business_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name),
    business_name = COALESCE(public.users.business_name, EXCLUDED.business_name);

  RETURN NEW;
END;
$$;
