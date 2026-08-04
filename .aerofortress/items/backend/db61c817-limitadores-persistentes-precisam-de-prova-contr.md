---
id: db61c817-0928-4bad-b432-8dc9ccfcf8b1
slug: backend
type: scar
title: Limitadores persistentes precisam de prova contra PostgreSQL real
tags: postgresql, rate-limit, security, production, drizzle
provenance: observado
evidence: apps/api/src/shared/middleware/postgres-rate-limit.ts; probe de produção em https://catalogo.lucrocaseiro.com.br/c/security-probe-*/service-bookings retornou 503 em 2026-08-04
decay: stable
created: 2026-08-04T13:30:55.471482400+00:00
updated: 2026-08-04T13:30:55.471482400+00:00
validated: 2026-08-04T13:30:55.471482400+00:00
links:
---

SINTOMA (2026-08-04): o novo limitador compartilhado passou em testes com mock de `db.execute`, mas em produção devolveu 503 em todas as chamadas protegidas. A consulta SQL bruta nunca tinha sido exercitada contra o adaptador PostgreSQL real. CORREÇÃO: usar o query builder tipado do Drizzle sobre `apiRateLimitBuckets`, isolado em `createPostgresRateLimitStore`, e manter o middleware testável pela interface mínima do store. PREVENÇÃO: qualquer controle de segurança dependente de persistência só pode ser considerado concluído após probe no ambiente real que demonstre respostas normais antes da quota e 429 ao ultrapassá-la; mock sozinho não atesta compatibilidade com o driver.
