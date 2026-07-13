---
id: e09c71d3-28b8-441a-9b1c-8588d1f44f38
slug: ui
type: scar
title: Financeiro: valor fixo lateral não pode espremer a descrição do lançamento
tags: financeiro, layout, android, responsividade, texto-longo
provenance: dito
evidence: apps/mobile/src/features/finance/components/finance-dashboard.tsx; screenshot e correção da usuária em 2026-07-13
decay: stable
created: 2026-07-13T03:38:31.227533400+00:00
updated: 2026-07-13T03:38:31.227533400+00:00
validated: 2026-07-13T03:38:31.227533400+00:00
links: 
---

SINTOMA (2026-07-13, Android): na lista do Financeiro, ícone à esquerda + coluna fixa de 124 px para valor/chevron deixavam a descrição com cerca de 100 px em telas estreitas; títulos, badge e data apareciam espremidos e truncados. CORREÇÃO: o conteúdo central ocupa a largura flexível, título aceita até 2 linhas, valor fica em linha própria alinhado à direita e o chevron permanece fixo; a linha ganhou altura e padding vertical compatíveis. COMO EVITAR: em listas mobile, não reservar uma coluna larga fixa para dinheiro quando também há ícone e texto variável; empilhar o valor dentro da coluna flexível e proteger apenas ícone/chevron.
