---
id: c0fa5175-36f6-44f8-a0d2-f286931a602e
slug: specs
type: doc
title: ADR 0010 — Segurança por defesa em profundidade
tags: spec, security, adr, architecture
provenance: observado
evidence: docs/adr/0010-seguranca-defesa-em-profundidade.md
decay: stable
created: 2026-08-04T12:56:35.601878100+00:00
updated: 2026-08-04T13:40:03.746833300+00:00
validated: 2026-08-04T13:40:03.746833300+00:00
links:
---

Decide que billing falha fechado, autorização acompanha a consulta, navegadores usam CSP nonce/hash, CORS é allowlist, limites sensíveis usam PostgreSQL compartilhado e supply chain/segredos são gates. Atualizada com a decisão de usar o query builder tipado do Drizzle nos buckets e exigir probe contra PostgreSQL real; registra o estado observado em produção em 2026-08-04.
