---
id: b2f3fc06-141e-43d3-a16b-ce24c3651da0
slug: ui
type: scar
title: Centralizar controles não substitui redesenhar o catálogo público de serviços
tags: catalogo, servicos, publico, layout, ui, correcao
provenance: dito
evidence: Capturas enviadas pela usuária em 2026-08-01; apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-08-01T23:38:31.015917400+00:00
updated: 2026-08-01T23:38:31.015917400+00:00
validated: 2026-08-01T23:38:31.015917400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-01): após pedir que Serviços seguisse o mesmo padrão UI/UX do catálogo de Produtos, a implementação centralizou publicação na tela administrativa e trocou tokens, mas a página pública mostrada continuou essencialmente com o mesmo layout. REGRA: quando a referência é uma captura de `/c/:slug`, o escopo visual principal é o renderer público; alterações administrativas não satisfazem o pedido. Antes de concluir, comparar o HTML público em viewport móvel com o card e o fluxo canônicos de Produtos e registrar uma captura do renderer alterado.
