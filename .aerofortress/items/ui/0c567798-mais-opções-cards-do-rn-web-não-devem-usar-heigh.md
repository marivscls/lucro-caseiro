---
id: 0c567798-3488-49c5-af49-65d55a31a4f9
slug: ui
type: scar
title: Mais opções: cards do RN Web não devem usar height 100% sem pai dimensionado
tags: mais-opcoes, react-native-web, height, card, responsivo, pwa
provenance: observado
evidence: apps/mobile/src/app/tabs/more.tsx; .aerofortress/tmp/more-options-validation/more-430-full.png
decay: stable
created: 2026-08-24T23:27:32.370482300+00:00
updated: 2026-08-24T23:27:32.370482300+00:00
validated: 2026-08-24T23:27:32.370482300+00:00
links: 
---

FALHA CORRIGIDA (2026-08-24): na primeira validação visual da nova tela Mais opções em 430 px, o card Financeiro ocupou quase todo o viewport e empurrou o restante do conteúdo para baixo. CAUSA: o estilo compartilhado dos cards de ferramenta usava `height: "100%"`; sem um pai com altura explícita, o React Native Web resolveu a porcentagem contra uma área muito maior que o conteúdo. CORREÇÃO: remover a altura percentual e conservar apenas `minHeight`, deixando o conteúdo determinar a altura. COMO EVITAR: em cards dentro de grids flexíveis do RN Web, não usar altura percentual para igualar linhas sem um pai dimensionado; validar a primeira dobra em viewport real.
