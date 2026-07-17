---
id: 533e68fd-f9a3-497c-a6e1-62a4fca108d3
slug: arch
type: fact
title: Central de Marketing usa a arquitetura do Lunoa em apps/web
tags: arquitetura, web, marketing, nextjs, lunoa, supabase, ia
provenance: observado
evidence: apps/web/package.json; apps/api/src/features/marketing/ai.context.api.md; packages/database/src/migrations/036_marketing_pwa.sql
decay: stable
created: 2026-07-14T14:04:29.562515400+00:00
updated: 2026-07-14T14:04:29.562515400+00:00
validated: 2026-07-14T14:04:29.562515400+00:00
links:
---

Desde 2026-07-14, a Central de Marketing está implementada no monorepo como `apps/web`, separada do Expo comercial. Stack: Next.js 16 App Router, React 19, Tailwind 4, React Query e Supabase Auth; API Express vertical em `features/marketing`; contratos Zod e Drizzle/Postgres compartilhados; AI SDK com Gemini 2.5 Flash no servidor. Acesso em produção exige `MARKETING_USER_IDS`; dados ficam em tabelas RLS e anexos no bucket privado `marketing-documents`. A migration canônica é `036_marketing_pwa.sql`.
