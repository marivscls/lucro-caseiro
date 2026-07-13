---
id: ed4684db-d0ba-4627-8c83-2a08489cf28a
slug: ui
type: decision
title: Estados vazios de Vendas e upgrades seguem hierarquia visual consistente
tags:
provenance: dito
evidence: apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/features/recipes/components/recipe-detail.tsx; apps/mobile/src/features/subscription/components/paywall.tsx; apps/mobile/src/app/plans.tsx
decay: stable
created: 2026-07-10T16:54:14.165249100+00:00
updated: 2026-07-10T16:54:14.165249100+00:00
validated: 2026-07-10T16:54:14.165249100+00:00
links:
---

A usuária pediu que as abas Pendentes e Concluídas tenham o mesmo espaçamento do estado vazio de Canceladas. A implementação aplica o layout compacto com respiro superior uniforme a todas as abas de status. Os upgrades usam hero compacto, cards de plano destacados por seleção e benefício com superfícies suaves; a tabela de insumos da receita separa cabeçalho e total para reduzir a sensação de bagunça.
