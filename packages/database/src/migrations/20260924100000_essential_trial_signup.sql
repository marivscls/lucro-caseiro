-- Teste gratis do Essencial por 7 dias para toda conta NOVA (sem cartao).
-- O teste e gravado como plano normal: plan = 'essential' e
-- plan_expires_at = agora + 7 dias. Ao expirar, resolveActivePlan ja trata a
-- conta como Free, entao nao ha job para desligar nada. plan_is_trial marca que
-- o plano veio do teste (e nao de pagamento); qualquer compra grava false.
-- Contas existentes ficam como estao (a coluna nasce false e o trigger so
-- concede o teste no INSERT, nunca no ON CONFLICT).
-- Roda a cada boot da API, depois da 062 (que tambem redefine o trigger).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_is_trial boolean NOT NULL DEFAULT false;

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

  INSERT INTO public.users (
    id,
    email,
    name,
    business_name,
    plan,
    plan_expires_at,
    plan_is_trial
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'Usuario'),
    NULLIF(NEW.raw_user_meta_data->>'business_name', ''),
    'essential',
    now() + interval '7 days',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name),
    business_name = COALESCE(public.users.business_name, EXCLUDED.business_name);

  RETURN NEW;
END;
$$;
