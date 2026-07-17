---
id: 66eaee3e-f3f0-433f-9381-ca4de1428dc5
slug: scripts
type: scar
title: Central de Marketing local exige apps/web/.env.local com as variáveis públicas do Supabase
tags: nextjs, supabase, env, desenvolvimento-local, central-de-marketing
provenance: observado
evidence: apps/web/.env.local; apps/web/src/shared/lib/supabase.ts; HTTP 200 em localhost:3002 e no /auth/v1/health do Supabase em 2026-07-16; bundle /_next/static/chunks/apps_web_src_1p6q5z1._.js continha a URL configurada
decay: stable
created: 2026-07-17T00:22:45.641944400+00:00
updated: 2026-07-17T00:22:45.641944400+00:00
validated: 2026-07-17T00:22:45.641944400+00:00
links:
---

SINTOMA (2026-07-16): ao abrir o dashboard Next.js da Central de Marketing, `getSupabase()` lançou `Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY` no `DashboardShell.useEffect`. CAUSA: `apps/web/.env.local` não existia, embora o mobile já tivesse as mesmas credenciais públicas configuradas. CORREÇÃO: criar `apps/web/.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; o Next recompilou o bundle e a URL correta passou a aparecer no chunk cliente, com health do Supabase Auth em HTTP 200. COMO EVITAR: ao iniciar a PWA local pela primeira vez, materializar `apps/web/.env.local` a partir de `.env.example`; mudanças em `NEXT_PUBLIC_*` precisam estar presentes no ambiente compilado do Next. A API é um requisito separado e só deve ser iniciada quando `apps/api/.env` tiver `DATABASE_URL` e Supabase válidos.
