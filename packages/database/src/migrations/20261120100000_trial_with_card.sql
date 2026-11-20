-- Teste gratis so com cartao (2026-11-20). Decisao do dono do produto: conta nova
-- comeca no Gratuito; o teste de 7 dias do Premium so comeca quando a pessoa
-- escolhe e coloca o cartao (Stripe ou Google Play), e a loja cobra no fim do
-- teste se ela nao cancelar. Substitui o teste automatico da
-- 20260924100000_essential_trial_signup (que roda antes desta a cada boot).
-- Quem ja esta no teste antigo segue ate a data gravada.
-- Roda a cada boot da API: tudo aqui e idempotente.

-- Loja que cobra o plano atual ('stripe' | 'google_play'); null = sem cobranca.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_provider text;

-- Um teste com cartao por e-mail (hash do e-mail normalizado). Sem FK para
-- users: excluir a conta e recriar com o mesmo e-mail nao libera outro teste.
DO $trial_claims$
BEGIN
  IF to_regclass('public.premium_trial_claims') IS NULL THEN
    CREATE TABLE public.premium_trial_claims (
      email_hash text PRIMARY KEY,
      user_id uuid NOT NULL,
      provider text NOT NULL,
      claimed_at timestamptz NOT NULL DEFAULT now()
    );

    -- Uma vez so, ao criar a tabela: quem ja ganhou o teste sem cartao do
    -- cadastro (contas desde 24/09/2026), quem recebeu o presente da campanha
    -- e quem ja paga nao ganha outro teste.
    INSERT INTO public.premium_trial_claims (email_hash, user_id, provider)
    SELECT
      encode(sha256(convert_to(lower(btrim(u.email)), 'UTF8')), 'hex'),
      u.id,
      'legacy'
    FROM public.users u
    WHERE btrim(u.email) <> ''
      AND (
        u.created_at >= timestamptz '2026-09-24 00:00:00-03'
        OR u.plan_is_trial
        OR (u.plan IN ('essential', 'professional', 'premium')
            AND (u.plan_expires_at IS NULL OR u.plan_expires_at > now()))
        OR EXISTS (
          SELECT 1 FROM public.subscription_purchase_claims c WHERE c.user_id = u.id
        )
      )
    ON CONFLICT (email_hash) DO NOTHING;
  END IF;
END
$trial_claims$;

ALTER TABLE public.premium_trial_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.premium_trial_claims FROM PUBLIC, anon, authenticated;

-- Conta nova nasce no Gratuito (sem plano, sem data, sem teste).
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
