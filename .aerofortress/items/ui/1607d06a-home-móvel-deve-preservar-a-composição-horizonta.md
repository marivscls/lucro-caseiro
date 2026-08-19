---
id: 1607d06a-9726-4055-bdf3-1d59c8329e12
slug: ui
type: scar
title: Home móvel deve preservar a composição horizontal abaixo de 390 px
tags: home, mobile, responsividade, react-native-web, viewport, navbar, valores-monetarios
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; apps/mobile/src/app/tabs/_layout.tsx; packages/ui/src/theme.ts; .aerofortress/home-layout-validation.json; .aerofortress/home-layout-8083-360-lower.png
decay: stable
created: 2026-08-16T19:18:59.534110200+00:00
updated: 2026-08-16T19:18:59.534110200+00:00
validated: 2026-08-16T19:18:59.534110200+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): a Home usava `compact = width < 390` para trocar estruturas, empilhando Visão geral/seletor, valor/CTA do hero e convertendo Acesso rápido em grade 2×2. A causa não era uma media query CSS abaixo de 480 px, mas ramificações inline de React Native baseadas em largura. CORREÇÃO CANÔNICA: entre 360 e 500 px preservar as mesmas linhas/colunas da composição de 500 px; usar o modo estreito apenas para reduzir medidas (gutter 16 px em 360/375, seletor 176×48, CTA 154–164×48, hero com padding 16, meta com fonte responsiva limitada, atalhos em quatro colunas de 92 px e navbar de 72 px com ação central de 52 px). Valores críticos e labels devem ter redução tipográfica local antes de truncar. COMO EVITAR: toda mudança de `flexDirection`, `flexWrap`, largura total ou número de colunas baseada em viewport na Home deve ser validada com valores reais em 360, 375, 390, 412, 430 e 500 px; conferir também `scrollWidth`, uma única linha, clearance da navbar e captura visual.
