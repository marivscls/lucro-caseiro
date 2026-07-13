---
id: 457cd839-efe9-48c6-8ee1-5dc2c4ca60ab
slug: auth
type: fact
title: Confirmação de e-mail no cadastro usa deep link de callback
tags: signup, email-confirmation, supabase, deep-link
provenance: observado
evidence: apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/eas.json; apps/mobile/.env; typecheck executado com sucesso em 2026-07-11
decay: stable
created: 2026-07-12T01:15:35.509903400+00:00
updated: 2026-07-12T01:24:59.226865700+00:00
validated: 2026-07-12T01:24:59.226865700+00:00
links:
---

O cadastro por e-mail passa `emailRedirectTo: getAuthRedirectUrl()` ao `supabase.auth.signUp`. O redirect canônico dos builds e do desenvolvimento local é `lucrocaseiro://auth/callback`, alinhado à URL exata permitida no Supabase. O fluxo já interpreta ausência de sessão como confirmação pendente, bloqueia login com e-mail não confirmado e processa callback PKCE/implicit. No Supabase hospedado, manter `Confirm Email` ativo, Site URL como `lucrocaseiro://auth/callback` e essa URL na allowlist de Redirect URLs.
