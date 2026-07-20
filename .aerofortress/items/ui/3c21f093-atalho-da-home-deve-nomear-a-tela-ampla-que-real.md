---
id: 3c21f093-3cfc-4e4f-ae35-8c729c0feee2
slug: ui
type: scar
title: Atalho da Home deve nomear a tela ampla que realmente abre
tags: home, navegacao, financeiro, rotulo
provenance: dito
evidence: apps/mobile/src/app/tabs/index.tsx:581; apps/mobile/src/features/finance/components/finance-dashboard.tsx:274
decay: stable
created: 2026-07-20T23:53:53.803937700+00:00
updated: 2026-07-20T23:53:53.803937700+00:00
validated: 2026-07-20T23:53:53.803937700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-20): ao escolher entre “Despesas” e “Financeiro” para o atalho da Home, não tratar o destino como se fosse exclusivo de despesas. O atalho abre `/finance`, a mesma tela ampla de Financeiro, que reúne entradas, despesas, lucro e lançamentos. Portanto, o rótulo coerente é “Financeiro”, alinhado ao título da tela e aos demais pontos de navegação.
