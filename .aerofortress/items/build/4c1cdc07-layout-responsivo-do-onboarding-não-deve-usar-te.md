---
id: 4c1cdc07-bc60-4aa1-a730-19bb2ea00f62
slug: build
type: scar
title: Layout responsivo do onboarding não deve usar ternários aninhados
tags: lint, react-native, onboarding
provenance: observado
evidence: apps/mobile/src/shared/components/getting-started-overlay.tsx; `pnpm --filter @lucro-caseiro/mobile lint` reportou 5 erros sonarjs/no-nested-conditional em 2026-08-24.
decay: stable
created: 2026-08-24T13:53:03.082836100+00:00
updated: 2026-08-24T13:53:03.082836100+00:00
validated: 2026-08-24T13:53:03.082836100+00:00
links:
---

FALHA CORRIGIDA (2026-08-24): o lint mobile falhou em `getting-started-overlay.tsx` com `sonarjs/no-nested-conditional` após tamanhos responsivos de título e hero serem expressos por ternários aninhados. Para decisões responsivas com mais de duas ramificações, calcule valores em variáveis com `if/else` antes do JSX; mantém a composição legível e passa o lint.
