---
id: a323fa0e-0eb9-4a31-b4f3-cf57f4a6072e
slug: auth
type: scar
title: Cadastro por e-mail depende do trigger handle_new_user no Supabase
tags: signup, supabase, database, trigger
provenance: observado
evidence: Screenshot/log do usuário em 2026-06-29: `/signup | 500: Database error saving new user`; packages/database/src/migrations/026_fix_auth_signup_trigger.sql; packages/database/src/migrations/027_auth_signup_diagnostics.sql.
decay: stable
created: 2026-06-30T01:21:49.222797900+00:00
updated: 2026-06-30T01:32:35.414079500+00:00
validated: 2026-06-30T01:32:35.414079500+00:00
links: 
---

Erro real visto no app: ao criar conta, o Supabase retornou falha de banco no signup, traduzida para `Não consegui preparar sua conta no banco. Verifique o trigger de criação de usuário no Supabase.`. O cadastro por e-mail depende do trigger `on_auth_user_created` em `auth.users` chamar `public.handle_new_user()` e inserir/upsertar `public.users`. Se o trigger, a tabela `public.users` ou colunas/defaults estiverem ausentes/desatualizados no Supabase, o Auth aborta o signup. Refinamento importante: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT` não corrige colunas já existentes sem default; por isso a correção precisa também executar `ALTER COLUMN plan/is_active/created_at SET DEFAULT`, preencher nulos e reforçar `NOT NULL`. Correção atualizada em `packages/database/src/migrations/026_fix_auth_signup_trigger.sql`; diagnóstico complementar em `027_auth_signup_diagnostics.sql`.
