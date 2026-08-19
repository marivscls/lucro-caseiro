---
id: 55bc60ed-96c0-46f2-9925-e69f009da0ca
slug: ui
type: scar
title: Prévia da vitrine precisa de respiro entre conteúdo, fotos e borda
tags: catalogo, personalizador, preview, spacing, produtos
provenance: dito
evidence: apps/mobile/src/features/catalog/components/catalog-customizer.tsx; screenshot da usuária 2026-08-18
decay: stable
created: 2026-08-18T19:46:51.809439100+00:00
updated: 2026-08-18T19:46:51.809439100+00:00
validated: 2026-08-18T19:46:51.809439100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-18): na prévia do personalizador do Catálogo, a faixa de produtos começava praticamente encostada no selo promocional e terminava colada à borda inferior, deixando a composição comprimida. CORREÇÃO: ampliar moderadamente a altura da prévia, reduzir a altura das miniaturas, aplicar inset inferior responsivo e arredondar os quatro cantos de cada foto. COMO EVITAR: previews que simulam uma vitrine devem reservar espaço interno real também no rodapé; uma faixa de imagens só pode sangrar até a borda quando essa decisão for intencional.
