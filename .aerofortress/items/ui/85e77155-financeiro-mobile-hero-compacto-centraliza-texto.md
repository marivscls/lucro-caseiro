---
id: 85e77155-4054-4460-bf29-b8644cc1271f
slug: ui
type: scar
title: Financeiro mobile: hero compacto centraliza texto e PNG com dimensões explícitas
tags: financeiro, mobile, responsivo, react-native-web, png, hero, layout
provenance: dito
evidence: apps/mobile/src/features/finance/components/finance-dashboard.tsx; build PWA Lucro Caseiro e inspeção visual CDP em 2026-08-16 nos viewports 320, 360, 390, 412, 480 e 1280 px; typecheck e ESLint do mobile concluídos
decay: stable
created: 2026-08-16T18:48:27.912771+00:00
updated: 2026-08-16T19:27:40.535796800+00:00
validated: 2026-08-16T19:27:40.535796800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): mesmo após neutralizar a altura herdada do PNG, o card “Lucro do período” continuou alto demais no mobile/web responsivo, com texto alinhado ao topo e a ilustração ancorada embaixo. CAUSA: o breakpoint <520 ainda usava altura fluida de 230–270 px, `justifyContent: "flex-start"` no conteúdo e `bottom` na imagem. CORREÇÃO CANÔNICA: somente abaixo de 520 px, usar altura compacta de 196–220 px (`viewportWidth * 0.55`), centralizar verticalmente o conteúdo textual, calcular largura explícita do PNG em 34% abaixo de 380 px e 36% nas demais larguras estreitas (teto 176 px), derivar a altura pela proporção natural 1103/1426 e calcular `top` para centralização exata. Reservar explicitamente a largura do texto com 8 px de folga até a caixa da imagem e reduzir apenas a escala tipográfica do valor/badge abaixo de 380 px para impedir sobreposição. O layout a partir de 520 px, incluindo desktop largo, permanece inalterado. COMO EVITAR: não voltar a ancorar o PNG no rodapé nem aumentar a altura compacta; validar 320, 360, 390, 412 e 480 px, além de confirmar o desktop largo.
