---
id: 3c0405a4-28bd-41ee-ad8b-1a40b4713d1a
slug: ui
type: scar
title: Operação: grade de métricas usa o mesmo ritmo horizontal e vertical
tags: operations, revenda, spacing, grid, desktop
provenance: dito
evidence: Captura da usuária em 2026-08-14; apps/mobile/src/app/operations.tsx; typecheck, lint e build:pwa:revenda aprovados
decay: stable
created: 2026-08-14T16:59:33.773219300+00:00
updated: 2026-08-14T16:59:33.773219300+00:00
validated: 2026-08-14T16:59:33.773219300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): na Operação da Revenda, o espaço horizontal entre os três cards de métricas estava menor que o espaço vertical entre as seções. CAUSA: o ScrollView principal usa `gap: spacing.xl`, mas a linha flexível de métricas usava `gap: spacing.md`. CORREÇÃO: a grade de métricas usa `spacing.xl` nos dois eixos; chips e espaçamentos internos permanecem menores porque pertencem a outra hierarquia.
