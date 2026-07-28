---
id: 2f3ca726-eefe-4046-8001-b4d816838c2c
slug: ui
type: decision
title: Produtos integra visão de reposição ao fluxo de estoque
tags: produtos, estoque, reposicao, home, mobile, pwa, stockit
provenance: observado
evidence: apps/mobile/src/app/products.tsx; apps/mobile/src/app/tabs/index.tsx; apps/mobile/src/features/products/components/product-list.tsx; apps/mobile/src/features/products/variations.ts; build:pwa:caseiro e 369 testes mobile em 2026-07-24
decay: stable
created: 2026-07-24T22:03:52.403048700+00:00
updated: 2026-07-24T22:03:52.403048700+00:00
validated: 2026-07-24T22:03:52.403048700+00:00
links:
---

Implementado em 24/07/2026 a partir da referência StockIt aprovada pela usuária. A tela canônica de Produtos mantém os filtros Todos/Produtos/Kits e acrescenta `Repor` quando estoque e notificações de estoque baixo estão ativos. Um resumo flat e opaco separa `Sem estoque` de `Estoque baixo`, abre a lista filtrada e mostra `Estoque em dia` quando não há alertas. O card de estoque da Home agora abre `/products?stock=low`, diretamente na lista de reposição. A solução reutiliza ProductList e ProductCard, preserva a paleta da marca e não cria aba paralela de Estoque.
