---
id: 45cb5722-29d2-45a7-8d46-2e04dcc558da
slug: ui
type: scar
title: Vendas: abas e busca não podem rolar junto com a página no React Native Web
tags: vendas, react-native-web, flatlist, overflow, filtros, scroll
provenance: dito
evidence: Capturas da usuária em 2026-08-16; apps/mobile/src/app/tabs/sales.tsx; bundle PWA entry-209d1ebaa5e4b5b1baef3f3a4be9060d.js; validação CDP 500×745 nesta sessão
decay: stable
created: 2026-08-16T17:18:13.887505900+00:00
updated: 2026-08-16T17:21:33.746659300+00:00
validated: 2026-08-16T17:21:33.746659300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): ao rolar a lista da nova tela de Vendas no PWA, as abas `Todas`, `Pendentes`, `Concluídas` e `Canceladas` subiam e ficavam parcialmente escondidas atrás do topo; a busca permanecia apenas parcialmente visível logo abaixo. CAUSA: a cadeia de contêineres flex permitia que a altura mínima da `FlatList` expandisse a página no React Native Web, deslocando também os controles externos. CORREÇÃO CANÔNICA: a raiz da tela ocupa e limita 100% da altura com overflow oculto, os contêineres flex intermediários usam `minHeight: 0`, e a `FlatList`/estados roláveis recebem `flex: 1` e `minHeight: 0`, de modo que somente a lista role enquanto filtros e busca ficam estáveis. VALIDAÇÃO: no PWA autenticado a 500×745 px, após rolar a lista até o fim, as abas permaneceram em `top=210` antes/depois, o documento ficou em `scrollTop=0` e a lista chegou a `scrollTop=max=3173`; os últimos cards ficaram acima da navbar. COMO EVITAR: em telas web com cabeçalho e controles fixos fora de uma lista, provar durante a rolagem que o documento não cresce; `flex: 1` sozinho não neutraliza o min-content height no navegador.
