---
id: 175043c0-f4f7-445d-bb7a-aaa907a9c6b0
slug: design
type: decision
title: Catálogo usa hero vinho com PNG 3D oficial e painel responsivo
tags: catalogo, design, hero, responsividade, pwa
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; .aerofortress/catalog-layout-8083-944x931-top.png; .aerofortress/catalog-layout-8083-1440x1000-top.png; .aerofortress/catalog-layout-8083-3072x768-top.png
decay: stable
created: 2026-08-17T00:09:33.743178+00:00
updated: 2026-08-17T02:23:48.855889100+00:00
validated: 2026-08-17T02:23:48.855889100+00:00
links:
---

A tela administrativa de Catálogo usa o asset transparente oficial `apps/mobile/src/assets/catalogo-hero-vitrine.png` (1341×1173 ARGB) como uma única imagem no lado direito do hero vinho `#4A2332`, sem overlay, filtro, máscara, blend, opacidade ou recorte. O conteúdo administrativo inteiro compartilha um container canônico: até 960 px no desktop com sidebar e 100% com padding lateral de 16 px abaixo do breakpoint desktop. A faixa visual aprovada de 768–1023 px é preservada integralmente: hero de 360 px e PNG de 360–470 px, 52%, `right: 4`, `bottom: 0`. Até 600 px o PNG mede 320–360 px e sobe com `bottom: 48`; a partir de 1024 px mede 420–500 px, `right: 8`, `bottom: 48`, com 64 px de respiro superior para não ser recortado pelo ScrollView. O painel de métricas/link sobrepõe a base do hero em 58 px. Produtos/serviços, queries, mutações, navegação e personalização permanecem reais. Esta composição pertence somente à tela administrativa `apps/mobile/src/app/catalog.tsx`; não deve alterar o catálogo público `/c/:slug`.
