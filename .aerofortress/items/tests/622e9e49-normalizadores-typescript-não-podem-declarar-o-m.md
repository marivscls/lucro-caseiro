---
id: 622e9e49-eab6-4d50-94eb-3015ecc2e2b9
slug: tests
type: scar
title: Normalizadores TypeScript não podem declarar o mesmo default antes e depois do spread
tags: typescript, typecheck, spread, normalizacao, marketing
provenance: observado
evidence: apps/web/src/features/marketing/campaign-studio.tsx; `pnpm --filter @lucro-caseiro/web typecheck` reportou TS1117 nas linhas 1106–1132
decay: stable
created: 2026-07-18T23:18:01.273049100+00:00
updated: 2026-07-18T23:18:01.273049100+00:00
validated: 2026-07-18T23:18:01.273049100+00:00
links:
---

SINTOMA (2026-07-18): o typecheck web falhou com TS1117 ao adicionar normalizadores compatíveis com campanhas antigas. CAUSA: arrays como `audienceLanguage` e `retentionBeats` foram declarados com default antes de `...plan.research`/`...plan.creativeStrategy` e repetidos depois do spread para tolerar dados incompletos. CORREÇÃO: manter os escalares antes do spread e declarar cada array apenas uma vez depois dele, usando `?? []`. COMO EVITAR: ao normalizar objetos opcionais com spread, cada chave deve aparecer uma única vez no literal; defaults que precisam vencer o spread ficam somente depois dele.
