---
id: a698303d-6b9d-4b92-bbe4-299f3c5b7e84
slug: build
type: scar
title: Teste de helper puro não deve importar componente client com alias não resolvido
tags: vitest, web, modulo-puro, alias, marketing
provenance: observado
evidence: apps/web/src/features/marketing/campaign-strategy.ts; apps/web/src/features/marketing/campaign-studio.test.ts; falha Vitest de 2026-08-10
decay: stable
created: 2026-08-10T13:23:10.686538800+00:00
updated: 2026-08-10T13:23:10.686538800+00:00
validated: 2026-08-10T13:23:10.686538800+00:00
links:
---

FALHA REAL (2026-08-10): ao testar a restauração de publicações, o teste importou campaign-studio.tsx; o Vitest da web não resolveu o alias @/shared/lib/api-client e a suíte falhou antes de coletar testes. CORREÇÃO: mover o helper puro campaignDestinations para campaign-strategy.ts, já isolado de React/API, e testá-lo por esse módulo. COMO EVITAR: helpers de parsing usados em testes Node devem viver em módulos puros; não importar um componente client inteiro apenas para testar uma função determinística.
