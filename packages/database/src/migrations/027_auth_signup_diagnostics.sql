SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND is_nullable = 'NO'
  AND column_default IS NULL
  AND column_name NOT IN ('id', 'email', 'name')
ORDER BY ordinal_position;

SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid IN ('auth.users'::regclass, 'public.users'::regclass)
ORDER BY table_name::text, trigger_name;

SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure) AS handle_new_user_definition;
