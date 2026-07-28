---
id: 85820c72-fc42-4e65-8b9b-cdcdf81964bb
slug: backend
type: scar
title: Método opcional de repositório não deve ser extraído sem preservar this
tags: lint, typescript, repositories
provenance: observado
evidence: apps/api/src/features/sales/sales.usecases.ts; apps/api/src/features/purchases/purchases.usecases.ts
decay: stable
created: 2026-07-25T02:25:13.430660600+00:00
updated: 2026-07-25T02:25:13.430660600+00:00
validated: 2026-07-25T02:25:13.430660600+00:00
links:
---

SINTOMA (2026-07-24): ao adicionar movimentos rastreados de estoque, `adjustStockWithMovement` foi extraído para uma variável e chamado com `.call`; TypeScript e testes passaram, mas o lint bloqueou com `@typescript-eslint/unbound-method`. CORREÇÃO: verificar a existência e chamar diretamente `this.repo.metodo(...)`, preservando o contexto e deixando a regra estática verificável.
