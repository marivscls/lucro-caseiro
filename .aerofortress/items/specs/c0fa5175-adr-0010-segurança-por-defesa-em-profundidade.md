---
id: c0fa5175-36f6-44f8-a0d2-f286931a602e
slug: specs
type: doc
title: ADR 0010 — Segurança por defesa em profundidade
tags: security, adr, architecture
provenance: observado
evidence: docs/adr/0010-seguranca-defesa-em-profundidade.md
decay: stable
created: 2026-08-04T12:56:35.601878100+00:00
updated: 2026-08-04T12:56:35.601878100+00:00
validated: 2026-08-04T12:56:35.601878100+00:00
links:
---

Decide que billing deve falhar fechado, autorização deve acompanhar cada consulta, navegadores usam CSP nonce/hash, CORS é allowlist, limites sensíveis usam PostgreSQL compartilhado e auditoria/segredos viram gates de CI. Registra alternativas rejeitadas e invariantes que impedem bypasses futuros.
