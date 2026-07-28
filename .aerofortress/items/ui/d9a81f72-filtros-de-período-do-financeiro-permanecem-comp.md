---
id: d9a81f72-aafa-41b9-a4a2-c902d4cb9acd
slug: ui
type: scar
title: Filtros de período do Financeiro permanecem compactos em uma única linha
tags: financeiro, filtros, chips, responsividade, mobile, react-native-web
provenance: dito
evidence: Correção visual da usuária e capturas móveis 390×844 em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx; .codex-logs/finance-period-mobile-validation.png
decay: stable
created: 2026-07-25T19:17:41.534408800+00:00
updated: 2026-07-25T19:26:36.742269+00:00
validated: 2026-07-25T19:26:36.742269+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): os botões `Hoje`, `7 dias`, `Mês` e `Personalizado` ficaram grandes e `Personalizado` quebrou para a segunda linha. TENTATIVAS INSUFICIENTES: compactar e usar `flex: 1`; depois adicionar `flexBasis: 0`/`minWidth: 0`. Capturas reais em 390×844 ainda mostraram o quarto botão ultrapassando a borda direita, agravado pelo `width: 100%` do contêiner compacto somado ao padding no React Native Web. CORREÇÃO CANÔNICA: o conteúdo compacto usa largura automática; a faixa usa `alignSelf: stretch`, sem `width: 100%`; os três rótulos curtos recebem 17,5% cada e `Personalizado` 33,5%, totalizando 86% e deixando folga explícita para os três gaps. Todos usam altura 44, padding curto, `minWidth: 0`, overflow e ajuste de fonte. COMO EVITAR: para um conjunto fixo que precisa caber em uma linha, não confiar só na arbitragem de flex do React Native Web; reservar matematicamente a largura dos gaps e provar a borda direita na menor viewport.
