---
id: 78ba41d2-903b-4d57-8cf8-fac52f701712
slug: build
type: scar
title: Chaves de analytics com “password” acionam falso positivo do Sonar
tags: lint, analytics, sonar
provenance: observado
evidence: apps/mobile/src/features/analytics/screen-tracking.ts; pnpm --filter @lucro-caseiro/mobile lint (2026-07-14)
decay: stable
created: 2026-07-14T03:27:37.295312600+00:00
updated: 2026-07-14T03:27:37.295312600+00:00
validated: 2026-07-14T03:27:37.295312600+00:00
links:
---

SINTOMA: o lint mobile falhou em `sonarjs/no-hardcoded-passwords` ao encontrar a chave canônica `reset_password` no mapa do painel e de rotas. CAUSA: a regra lexical interpreta o nome do evento como senha embutida, embora seja apenas uma enumeração de analytics. PREVENÇÃO: mantenha a chave canônica e aplique uma supressão local documentada somente nessa linha; não renomeie o contrato para contornar o lint.
