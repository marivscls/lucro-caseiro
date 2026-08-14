---
id: d54702e7-0c03-438a-bd5f-fe55bde0ea6f
slug: analytics
type: fact
title: Contas autorizadas possuem acesso ao painel interno de métricas
tags: analytics, admin, acesso, railway, account-session, allowlist
provenance: observado
evidence: Railway production @lucro-caseiro/api deploy 7ebe4332-5e66-45b4-b4e0-431cda648396; Supabase auth.users e analytics_installation_users; apps/api/src/config.ts:81; apps/api/src/features/analytics/analytics.routes.ts:62
decay: seasonal
created: 2026-08-13T17:01:40.697802900+00:00
updated: 2026-08-13T19:24:24.423123700+00:00
validated: 2026-08-13T19:24:24.423123700+00:00
links:
---

Em 2026-08-13, `marivscls@gmail.com` (Supabase user id `3e96539b-a2d1-4317-9d03-94d868366eb8`) foi acrescentada à allowlist `ADMIN_USER_IDS`. Após a usuária informar que o atalho não aparecia, a telemetria confirmou que o aparelho estava conectado em outra conta, `marivscls@gmail.comm` (com dois “m”; user id `bf378bde-3a37-4f08-93cd-fd805ea94232`), que também foi incluída preservando a `.com`; o deploy `a9b4889a-004c-4698-9ea3-db93cb71fa14` concluiu `SUCCESS`.

Ainda em 2026-08-13, `marideveloper7@gmail.com` foi resolvida no Supabase como user id `d5c048ef-80b4-4945-8ad8-ef57ba24bbf3`, com e-mail confirmado e instalação identificada às `2026-08-13T19:15:15.264Z`. O UUID foi acrescentado à mesma allowlist sem remover os três existentes. O deploy Railway `7ebe4332-5e66-45b4-b4e0-431cda648396` concluiu `SUCCESS`, a configuração publicada confirmou quatro UUIDs com o novo alvo presente, e `GET /api/v1/health` respondeu `status: ok`.
