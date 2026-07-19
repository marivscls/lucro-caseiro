---
id: 00e9562c-562d-4e44-90d7-c7fce1697a01
slug: tests
type: scar
title: Lógica pura do Campaign Studio não deve ser testada importando o componente cliente
tags: web, vitest, marketing, componentes, modulo-puro, aliases
provenance: observado
evidence: apps/web/src/features/marketing/campaign-strategy.ts; apps/web/src/features/marketing/campaign-studio.test.ts; 7 testes web, typecheck, lint e build aprovados
decay: stable
created: 2026-07-19T00:03:49.161375900+00:00
updated: 2026-07-19T00:03:49.161375900+00:00
validated: 2026-07-19T00:03:49.161375900+00:00
links:
---

SINTOMA (2026-07-18): o novo teste da compatibilidade estratégica falhou antes da coleta porque importou `campaign-studio.tsx`; ao carregar o componente cliente inteiro, o Vitest web tentou resolver `@/shared/lib/api-client` e não encontrou o alias nesse caminho de teste. CORREÇÃO: extrair somente a detecção e a mesclagem determinísticas para `campaign-strategy.ts`, usando import relativo para o tipo compartilhado, e testar esse módulo puro. COMO EVITAR: regras puras de normalização/compatibilidade usadas por componentes clientes devem ficar em módulo sem React, API client ou configuração de runtime quando precisarem de teste unitário.
