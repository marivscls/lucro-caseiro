-- 030: Signup se auto-cura de linhas órfãs em public.users
--
-- Bug real (2026-07-08): a exclusão de conta apaga o usuário do Auth primeiro e
-- os dados depois; se falhar no meio, sobra a linha em public.users. Como email
-- é UNIQUE, recriar a conta com o MESMO e-mail faz o handle_new_user colidir e
-- o Auth aborta o signup ("Database error saving new user") — o e-mail fica
-- preso pra sempre.
--
-- Correção: antes do INSERT, o trigger remove qualquer linha órfã (id sem par
-- em auth.users) com o mesmo e-mail. Linha órfã é inalcançável — ninguém
-- consegue mais logar nela — então removê-la (cascateando os dados restantes)
-- é seguro e correto.

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
