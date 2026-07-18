---
id: 7b0a474e-564c-42ea-91af-3f80351d92cf
slug: tests
type: scar
title: Guards unitários da API não devem carregar auth/config global
tags: api, tests, middleware, whitelabel
provenance: observado
evidence: apps/api/src/shared/middleware/brand-feature.ts; `pnpm --filter @lucro-caseiro/api test -- src/features/products/products.routes.test.ts` (2 passed, 2026-07-18)
decay: stable
created: 2026-07-18T19:13:09.021471+00:00
updated: 2026-07-18T19:13:09.021471+00:00
validated: 2026-07-18T19:13:09.021471+00:00
links:
---

Sintoma: o teste de `requireBrandFeature` encerrava antes da coleta porque importar `products.routes.ts` carregava `auth.ts` e `config.ts`, que chama `process.exit(1)` sem envs de banco. Correção: manter guards puros/isoláveis em `src/shared/middleware` e testá-los diretamente; routers importam o guard, não o contrário. Evite que testes unitários de middleware dependam do bootstrap global.
