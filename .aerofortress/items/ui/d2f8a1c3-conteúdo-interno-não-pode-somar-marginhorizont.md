---
id: d2f8a1c3-4b5e-4a9f-8c2d-1e6f0a9b7c35
slug: ui
type: scar
title: Conteúdo interno não pode somar marginHorizontal no desktop
tags: desktop, padding, gutter, margin, alinhamento, produtos
provenance: dito
evidence: Captura da usuária em 2026-07-26 — card Meu estoque desalinhado do título/busca; LowStockBanner e LimitBanner com marginHorizontal spacing.lg sobre o gutter do shell
decay: stable
created: 2026-07-26T04:25:00.000000000+00:00
updated: 2026-07-26T04:25:00.000000000+00:00
validated: 2026-07-26T04:25:00.000000000+00:00
links:
---

SINTOMA (2026-07-26): no desktop, cards internos (ex.: “Meu estoque” em Produtos) ficavam mais indentados que título, busca e chips — parecia padding dobrado. CAUSA: o shell já aplica `paddingHorizontal: spacing["3xl"]`, mas banners/cards ainda usavam `marginHorizontal: spacing.lg` incondicional. CORREÇÃO: em desktop, `marginHorizontal`/`paddingHorizontal` de containers de página devem ser `0` (mesmo padrão de `pageGutter`); mobile mantém `spacing.lg`/`xl`. COMO EVITAR: ao adicionar Card, LimitBanner ou faixa interna em tela autenticada, condicionar a margem horizontal a `isDesktop ? 0 : spacing.lg` e validar alinhamento com o título da rota.
