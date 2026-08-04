---
id: ba5bea2d-c9f4-4bc5-957e-baf447b28645
slug: build
type: scar
title: Controles de segurança também precisam ser determinísticos para passar o lint
tags: lint, security, rate-limit, csp
provenance: observado
evidence: apps/api/src/features/catalog/catalog.routes.ts; apps/api/src/shared/middleware/postgres-rate-limit.ts; apps/api/src/main.ts; pnpm lint
decay: stable
created: 2026-08-04T12:48:00.014898700+00:00
updated: 2026-08-04T12:48:00.014898700+00:00
validated: 2026-08-04T12:48:00.014898700+00:00
links:
---

SINTOMA (2026-08-04): o lint rejeitou o novo hardening por `sonarjs/no-nested-template-literals` na CSP e `sonarjs/pseudo-random` no sorteio usado para limpar buckets expirados; o scanner também alertou sobre regex de localhost. CORREÇÃO: extrair a fonte de script antes de montar a CSP, agendar limpeza por `nextCleanupAt` e analisar a origem com `URL`/comparação exata de hostname. PREVENÇÃO: em middleware de segurança, preferir parsing nativo e manutenção determinística; não usar aleatoriedade nem regex quando igualdade de origem resolve.
