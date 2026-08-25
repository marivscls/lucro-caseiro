---
id: 082d2988-fc49-4b23-b41e-20bc580a4644
slug: ui
type: scar
title: Receitas: resumo precisa acomodar os nomes dinâmicos mais longos
tags: receitas, resumo, texto-dinamico, responsivo, 320px, pwa, correcao
provenance: dito
evidence: apps/mobile/src/features/recipes/components/recipe-list.tsx; .aerofortress/tmp/recipes-summary-audit/report.json e capturas recipes-320.png/recipes-592.png
decay: stable
created: 2026-08-24T22:32:37.720286+00:00
updated: 2026-08-24T22:32:37.720286+00:00
validated: 2026-08-24T22:32:37.720286+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-24): no perfil de venda de produtos, o card de resumo de Receitas truncava “0 composições de custo” para “0 composiç...”. CAUSA: as duas métricas dividiam o card igualmente, embora a esquerda também contivesse ícone e um substantivo dinâmico longo, e o rótulo aceitasse só uma linha. CORREÇÃO CANÔNICA: dar mais proporção à métrica esquerda, permitir até duas linhas e, abaixo de 360 px, usar tipografia bodyBold, padding/ícone compactos; preservar “Custo médio” e o valor em uma linha. Validado na PWA em 320 px (duas linhas completas) e 592 px (uma linha completa).
