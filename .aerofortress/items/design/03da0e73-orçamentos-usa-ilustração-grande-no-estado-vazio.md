---
id: 03da0e73-12e3-4944-90c4-a43ffb35cbea
slug: design
type: decision
title: Orçamentos usa ilustração grande no estado vazio
tags: orçamentos, empty-state, png, mobile, responsividade
provenance: dito
evidence: Pedido da usuária em 2026-07-25; apps/mobile/src/app/quotes.tsx
decay: stable
created: 2026-07-25T21:22:16.179920800+00:00
updated: 2026-07-25T21:22:16.179920800+00:00
validated: 2026-07-25T21:22:16.179920800+00:00
links:
---

A usuária pediu que o PNG do estado vazio de Orçamentos tenha o mesmo destaque das outras telas. A renderização canônica de `quotes-empty.png` passou de 142×142 para 220×220 px no celular e 240×240 px no desktop, seguindo Etiquetas, Embalagens e Insumos.
