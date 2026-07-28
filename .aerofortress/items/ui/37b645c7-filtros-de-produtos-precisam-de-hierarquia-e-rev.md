---
id: 37b645c7-719a-4822-b24d-bf8a60b762bd
slug: ui
type: scar
title: Filtros de Produtos precisam de hierarquia e revelação progressiva
tags: products, filters, ux, responsive, progressive-disclosure
provenance: dito
evidence: Capturas enviadas pela usuária em 2026-07-25; apps/mobile/src/app/products.tsx; .codex-logs/products-ui-validation/products-mobile-simplified.png e products-mobile-simplified-open.png
decay: stable
created: 2026-07-25T04:02:30.977696700+00:00
updated: 2026-07-25T04:36:40.366752300+00:00
validated: 2026-07-25T04:36:40.366752300+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) em 2026-07-25, a tela de Produtos ficou estranha e ruim de usar quando tipo, situação de estoque/venda, categorias e ordenação foram apresentados como duas faixas longas de chips horizontais, com opções cortadas e `Kits` aparecendo em papéis diferentes sem hierarquia. A correção manteve apenas Todos/Produtos/Kits como seletor principal e agrupou situação, categoria e ordenação em um painel explícito. (2) ainda em 2026-07-25, a usuária mostrou que esse painel continuava com informação demais porque todas as situações, todas as categorias e a ordenação apareciam simultaneamente. CORREÇÃO CANÔNICA: manter Todos/Produtos/Kits e uma única ação `Filtros` no topo; abrir os filtros em modal; mostrar inicialmente somente os resumos recolhidos de Situação, Categoria e Ordenação; revelar as opções de cada dimensão somente quando a pessoa tocar na seção; mostrar contagem de ajustes ativos e permitir limpar. Usar largura intrínseca com quebra de linha no mobile, sem rolagem horizontal invisível. COMO EVITAR: filtros de dimensões diferentes não compartilham carrossel nem despejam todas as opções na tela; coleções grandes ficam sob uma seção rotulada e recolhível, com a seleção atual visível no resumo.
