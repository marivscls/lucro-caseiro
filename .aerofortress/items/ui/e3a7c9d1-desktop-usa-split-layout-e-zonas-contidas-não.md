---
id: e3a7c9d1-8f2b-4c6a-9d1e-0a5b7c8e2f34
slug: ui
type: scar
title: Desktop usa split layout e zonas contidas, não coluna mobile esticada
tags: desktop, layout, precificacao, densidade, formularios, sticky
provenance: dito
evidence: Pedido e captura da usuária em 2026-07-26 (Precificação full-bleed); desktopSplitLayout/desktopCompactField/desktopAction em desktop-density.ts; simple-pricing-calculator split form+estimativa
decay: stable
created: 2026-07-26T04:30:00.000000000+00:00
updated: 2026-07-26T04:30:00.000000000+00:00
validated: 2026-07-26T04:30:00.000000000+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): no desktop (≥1024 px) várias telas só removiam padding e expandiam a coluna mobile — campos de dinheiro em faixa larga, CTAs full-width e resultado empilhado, cara de app de tablet. REGRA: views desktop devem ter composição própria. Formulários usam `desktopContained` (1040) + `desktopSplitLayout` (main + aside sticky 360) quando há preview/resultado; campos curtos com `desktopCompactField` (360); CTAs com `desktopAction` (220–240). Listas de dados usam `desktopContained(..., data 1280)`. Mobile (&lt;1024) permanece na coluna atual. COMO EVITAR: nunca esticar `width: 100%` de formulário mobile para preencher o shell; ao criar tela autenticada, escolher zona (form/data) e split quando houver painel de resultado.
