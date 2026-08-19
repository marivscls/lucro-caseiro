---
id: 45e4028b-82e0-4c1a-a663-34ef3b9273b1
slug: ui
type: scar
title: Orçamentos em 320 px precisa reorganizar o card para preservar valores
tags: orcamentos, ui, responsividade, 320px, valor, react-native-web
provenance: observado
evidence: apps/mobile/src/app/quotes.tsx; validação CDP PWA em 320 px em 2026-08-16
decay: stable
created: 2026-08-16T21:45:34.018562300+00:00
updated: 2026-08-16T21:45:34.018562300+00:00
validated: 2026-08-16T21:45:34.018562300+00:00
links:
---

SINTOMA (2026-08-16): a primeira composição responsiva de Orçamentos manteve título, valor, status e chevron em uma única linha no card; em 320 px o valor do hero e os valores dos cards apareceram truncados com reticências. CORREÇÃO: abaixo de 350 px o card passa a organizar identificação/título e valor no topo, cliente em linha própria e data/status na base; o valor usa 16 px em uma área de 120 px. No hero abaixo de 360 px o valor usa a variante `moneyLg`, preservando `R$ 850,00` inteiro, enquanto a ilustração mantém 96 px e 34% da largura útil. COMO EVITAR: para cards financeiros com arte e valores, validar 320 px por screenshot real e reservar largura explícita antes de confiar em `adjustsFontSizeToFit`, que não reduziu o texto no React Native Web.
