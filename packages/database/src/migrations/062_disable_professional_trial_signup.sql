-- Encerra de vez o presente de 1 mes de Profissional para cadastros novos.
-- A campanha professional-first-100-2026 chegou a ser desligada na 057, mas a
-- 052 ainda rodava no boot da API, reativava o flag e concedia o plano no
-- handle_new_user. Quem ja recebeu o beneficio permanece com o plano e a
-- data de expiracao originais.

UPDATE public.professional_trial_campaigns
SET active = false
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
