---
id: bd46a2e6-ac7f-424c-8e67-d2adc0b850e8
slug: ui
type: scar
title: Financeiro usa o cabeçalho padrão do ScreenHeader
tags: financeiro, cabecalho, tipografia, screen-header, consistencia, voltar, calendario, alinhamento
provenance: dito
evidence: Correções visuais da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/shared/components/screen-header.tsx
decay: stable
created: 2026-07-25T19:16:05.337504100+00:00
updated: 2026-07-25T19:31:00.437680500+00:00
validated: 2026-07-25T19:31:00.437680500+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): (1) aumentar especificamente o título `Financeiro` para 36 px e o subtítulo para 20 px deixou o cabeçalho grande demais; (2) colocar o botão de voltar dentro de uma caixa branca arredondada destoou das outras telas; (3) após separar os estilos, o ícone de calendário ficou no canto superior esquerdo da sua caixa porque o Pressable não centralizava o conteúdo. CORREÇÃO CANÔNICA: o Financeiro herda as variantes padrão do `ScreenHeader`, usa o voltar canônico de 44 px sem fundo/borda e mantém a ação de calendário explicitamente centralizada com `alignItems` e `justifyContent`. A extensão `backButtonStyle` criada apenas para a exceção foi removida. COMO EVITAR: elementos estruturais compartilhados permanecem canônicos; todo Pressable quadrado com ícone precisa declarar centralização nos dois eixos quando não herda isso de um contêiner interno.
