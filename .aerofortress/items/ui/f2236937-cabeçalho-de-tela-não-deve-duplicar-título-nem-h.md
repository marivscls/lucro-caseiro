---
id: f2236937-c7c8-410e-a556-7cf954f7bbc0
slug: ui
type: scar
title: Cabeçalho de tela não deve duplicar título nem hospedar atalho global
tags: receitas, cabecalho, titulo, insights, estatisticas, navegacao, hierarquia, margem, lucro, producao
provenance: dito
evidence: Captura e decisões da usuária em 2026-07-20; apps/mobile/src/app/recipes.tsx; apps/mobile/src/features/recipes/components/recipe-list.tsx; apps/mobile/src/features/recipes/components/recipe-statistics-modal.tsx; apps/mobile/src/features/recipes/statistics.ts; produção validada em https://app.lucrocaseiro.com.br
decay: stable
created: 2026-07-20T20:35:56.762086700+00:00
updated: 2026-07-20T21:03:39.867267100+00:00
validated: 2026-07-20T21:03:39.867267100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-20): a tela de Receitas repetia “Receitas” no `ScreenHeader` e novamente no cabeçalho da lista; além disso, “Estatísticas” abria `/insights`, uma área global do negócio. PRIMEIRA CORREÇÃO: manter apenas o título canônico e remover o atalho global. DECISÃO POSTERIOR DA USUÁRIA NO MESMO DIA: “Estatísticas” deve existir em Receitas quando mostrar métricas próprias da feature. IMPLEMENTAÇÃO ATUAL: o botão voltou ao cabeçalho, mas abre `RecipeStatisticsModal`, com custo médio, margem média e ranking por lucro unitário calculado a partir do produto ativo vinculado; o H1 duplicado continua removido. COMO EVITAR: telas com `ScreenHeader` não repetem o mesmo H1 no conteúdo; ações do cabeçalho pertencem ao contexto da feature, enquanto destinos globais ficam na Home/navegação principal. PUBLICAÇÃO: commit `329b6da`; Railway `@lucro-caseiro/mobile` SUCCESS; bundle `entry-ad387667d074c6d1f02e8004dc764312.js` e `sw.js` servidos em produção contêm a feature.
