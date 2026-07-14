---
id: ce793de2-5049-41bc-b6a5-cd22238e2097
slug: backend
type: scar
title: Teste de autorização não deve importar rota que inicializa configuração global
tags: analytics, auth, vitest, config, modulo-puro
provenance: observado
evidence: apps/api/src/features/analytics/analytics.admin.ts; apps/api/src/features/analytics/analytics.routes.test.ts; 6 testes analytics aprovados
decay: stable
created: 2026-07-14T02:46:23.536171900+00:00
updated: 2026-07-14T02:46:23.536171900+00:00
validated: 2026-07-14T02:46:23.536171900+00:00
links:
---

SINTOMA (2026-07-13): o teste puro de `isAdminUser` encerrou o Vitest porque importar `analytics.routes.ts` carregou `auth.ts` e `config.ts`, que exige variáveis reais de banco/Supabase. CORREÇÃO: mover a regra pura para `analytics.admin.ts` e testar esse módulo sem dependências de runtime. COMO EVITAR: regras pequenas de autorização que precisam de teste unitário devem ficar fora de módulos de rota/middleware com inicialização global.
