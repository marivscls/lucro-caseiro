---
id: 8ae8bcac-0a57-40fe-a4fc-d998639b45e7
slug: analytics
type: scar
title: Acesso de Métricas deve validar a conta realmente ativa no aparelho
tags: analytics, admin, allowlist, session, email, diagnosis
provenance: observado
evidence: Railway HTTP log GET /api/v1/analytics/admin/access 2026-08-13T17:09:01Z; Supabase analytics_installation_users 2026-08-13T17:10:30.665Z
decay: stable
created: 2026-08-13T17:17:49.711476900+00:00
updated: 2026-08-13T17:17:49.711476900+00:00
validated: 2026-08-13T17:17:49.711476900+00:00
links:
---

SINTOMA (2026-08-13): `marivscls@gmail.com` foi autorizada corretamente, mas a usuária disse que Métricas não apareceu. CAUSA: a sessão do aparelho era de `marivscls@gmail.comm` (dois “m”), comprovada por `analytics_installation_users` às 17:10Z; portanto o endpoint respondeu `allowed: false` para outro UUID. CORREÇÃO: incluir o UUID da conta realmente ativa, preservando a conta solicitada originalmente, e validar deploy/API. COMO EVITAR: quando uma allowlist por UUID não refletir no aparelho, conferir primeiro qual user id/e-mail a instalação autenticada identificou; não assumir que o endereço informado e a sessão aberta são a mesma conta.
