---
id: 0702b590-f0ec-4f37-8f4a-e20f74e13217
slug: design
type: decision
title: Produtos usa hero vinho com PNG 3D oficial e métricas responsivas
tags: produtos, mobile, pwa, responsivo, png-oficial
provenance: observado
evidence: apps/mobile/src/app/products.tsx; apps/mobile/src/features/products/components/product-list.tsx; apps/mobile/src/assets/catalog-products.png; validação PWA em 320x568, 360x800, 375x812, 390x844, 412x915, 600x900 e 900x900 em 2026-08-16
decay: stable
created: 2026-08-16T22:59:44.074838500+00:00
updated: 2026-08-16T22:59:44.074838500+00:00
validated: 2026-08-16T22:59:44.074838500+00:00
links:
---

A tela Produtos mantém toda a lógica existente e usa um cabeçalho rolável com busca, seletor Todos/Produtos/Kits e filtro. O hero canônico tem fundo #4A2332, o PNG transparente oficial da caixa rosa à direita sem superfície própria, contagem real de itens/produtos/kits e painel branco imediato com produtos, kits e unidades em estoque. Entre 320–430 px, os indicadores internos reorganizam ícone, número e rótulo para evitar truncamento; o hero fica entre 184 e 193 px. Na PWA de 600–900 px, o conteúdo é centralizado, hero limitado a 680×240 e a arte a 88% da altura. A lista reserva a folga inferior da navbar compartilhada, que não é modificada.
