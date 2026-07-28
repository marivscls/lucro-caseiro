---
id: 754e73c4-114c-486d-ace7-456702604a58
slug: ui
type: scar
title: Assets PNG importados no Expo usam ImageSourcePropType
tags: react-native, expo, typescript, assets, image
provenance: observado
evidence: apps/mobile/src/features/pricing/components/pricing-mode-switch.tsx; `pnpm --filter @lucro-caseiro/mobile typecheck` TS2322 em 2026-07-25
decay: stable
created: 2026-07-25T21:22:07.608554600+00:00
updated: 2026-07-25T21:22:07.608554600+00:00
validated: 2026-07-25T21:22:07.608554600+00:00
links:
---

FALHA OBSERVADA (2026-07-25): ao tipar manualmente os fundos dos cards de Precificação como `number`, o typecheck falhou porque a declaração de assets deste projeto expõe `ImageSourcePropType`. CORREÇÃO: tipar a propriedade `source` como `ImageSourcePropType` importado de `react-native`. COMO EVITAR: não presumir que todo `require`/import estático de PNG é numericamente tipado; reutilizar o contrato de `Image`/`ImageBackground`.
