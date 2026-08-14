---
id: 43e74847-930d-468d-a80c-fa94529ce2cd
slug: build
type: scar
title: Fixtures de CampaignResourceContext exigem summary explícito
tags: build, typescript, testes, marketing, fixtures
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.test.ts; pnpm --filter @lucro-caseiro/api typecheck (TS2345/TS2741 em 2026-08-13)
decay: stable
created: 2026-08-13T17:22:23.344009900+00:00
updated: 2026-08-13T17:22:23.344009900+00:00
validated: 2026-08-13T17:22:23.344009900+00:00
links:
---

FALHA REAL (2026-08-13): o typecheck da API falhou em campaign-ai.test.ts porque novas fixtures passadas a selectAutomaticCampaignDirection omitiram `summary`, embora CampaignResourceContext exija `string | null`. CORREÇÃO: toda fixture desse contrato declara `summary: null` quando não há resumo. COMO EVITAR: ao montar recursos de audiência/campanha em testes, espelhar os campos obrigatórios do contrato interno em vez de depender de propriedades ausentes inferidas pelo TypeScript.
