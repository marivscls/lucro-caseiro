---
id: 1cc3613d-6c8b-47a6-8edb-6793e93a4c32
slug: ui
type: scar
title: Teste de helper puro não deve importar componente client com alias não resolvido
tags: vitest, web, modulo-puro, alias, marketing
provenance: observado
evidence: C:\Users\maria\Documents\projects\lucro-caseiro\apps\web\src\features\marketing\campaign-strategy.ts; campaign-studio.test.ts; falha Vitest de 2026-08-10
decay: stable
created: 2026-08-10T13:23:23.946477500+00:00
updated: 2026-08-10T13:23:23.946477500+00:00
validated: 2026-08-10T13:23:23.946477500+00:00
links:
---

FALHA REAL (2026-08-10): ao testar a restauração de publicações, o teste importou campaign-studio.tsx; o Vitest da web não resolveu o alias @/shared/lib/api-client e a suíte falhou antes de coletar testes. CORREÇÃO: mover o helper puro campaignDestinations para campaign-strategy.ts, já isolado de React/API, e testá-lo por esse módulo. COMO EVITAR: helpers de parsing usados em testes Node devem viver em módulos puros; não importar um componente client inteiro apenas para testar uma função determinística.
