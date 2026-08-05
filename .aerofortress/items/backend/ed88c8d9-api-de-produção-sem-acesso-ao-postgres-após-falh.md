---
id: ed88c8d9-dafa-474a-a5ba-801597fe7141
slug: backend
type: fact
title: API de produção sem acesso ao Postgres após falha de senha em 2026-07-28
tags: railway, supabase, postgres, database-url, outage, insumos
provenance: observado
evidence: Railway production logs, 2026-07-28 22:31–22:54 UTC; curl /api/v1/health => 200 e /c/nao-existe-123/json => 500
decay: volatile
created: 2026-07-28T22:59:02.768509700+00:00
updated: 2026-07-28T22:59:02.768509700+00:00
validated: 2026-07-28T22:59:02.768509700+00:00
links:
---

Em 2026-07-28, telas autenticadas como Insumos passaram a mostrar erro genérico porque todas as consultas da API ao Postgres falhavam. O health endpoint continuava 200 por não consultar o banco. Logs do serviço `@lucro-caseiro/api` no Railway confirmaram `password authentication failed for user "postgres"` (28P01) e depois `ECIRCUITBREAKER: too many authentication failures`; a `DATABASE_URL` tinha host, porta e usuário coerentes, mas a senha aceita pelo Supabase não correspondia. Correção pendente: atualizar a variável `DATABASE_URL` no Railway com a senha atual do banco e revalidar uma rota DB-backed.
