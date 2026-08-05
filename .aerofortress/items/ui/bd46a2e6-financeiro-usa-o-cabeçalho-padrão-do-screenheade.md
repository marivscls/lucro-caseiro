---
id: bd46a2e6-ac7f-424c-8e67-d2adc0b850e8
slug: ui
type: scar
title: Financeiro usa o cabeçalho padrão do ScreenHeader
tags: mobile, financeiro, screen-header, expo-router, stack, duplicacao
provenance: dito
evidence: Capturas da usuária em 2026-07-25 e 2026-08-04; apps/mobile/src/app/finance.tsx; apps/mobile/src/app/tabs/finance.tsx; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T19:16:05.337504100+00:00
updated: 2026-08-05T01:44:27.711705900+00:00
validated: 2026-08-05T01:44:27.711705900+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) em 2026-07-25, aumentar especificamente o título `Financeiro` para 36 px e o subtítulo para 20 px deixou o cabeçalho grande demais; (2) colocar o botão de voltar dentro de uma caixa branca arredondada destoou das outras telas; (3) após separar os estilos, o ícone de calendário ficou no canto superior esquerdo da sua caixa porque o Pressable não centralizava o conteúdo; (4) em 2026-08-04, ao abrir `/finance` pelo menu Mais, o cabeçalho nativo da Stack e o `ScreenHeader` do dashboard apareceram juntos, repetindo `Financeiro`. CORREÇÃO CANÔNICA: o Financeiro herda as variantes padrão do `ScreenHeader`, usa o voltar canônico de 44 px sem fundo/borda, centraliza a ação de calendário nos dois eixos e a rota empilhada `/finance` declara `Stack.Screen headerShown: false` num wrapper que renderiza `FinanceTab` diretamente; a aba interna não configura a Stack. COMO EVITAR: elementos estruturais compartilhados permanecem canônicos e toda rota empilhada que renderiza uma tela com `ScreenHeader` precisa ocultar o header nativo no nível correto do navegador.
