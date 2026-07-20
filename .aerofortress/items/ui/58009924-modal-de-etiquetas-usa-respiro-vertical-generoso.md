---
id: 58009924-d9bc-4257-ab5c-d023337532af
slug: ui
type: rule
title: Modal de etiquetas usa respiro vertical generoso
tags: ui, etiquetas, modal, espacamento, formulario
provenance: dito
evidence: Pedido da usuária em 2026-07-19; apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/app/labels.tsx
decay: stable
created: 2026-07-20T00:43:46.595630200+00:00
updated: 2026-07-20T00:43:46.595630200+00:00
validated: 2026-07-20T00:43:46.595630200+00:00
links:
---

No modal de etiquetas, os blocos principais das telas de criação e edição devem manter espaçamento vertical generoso. O padrão confirmado é `spacing["3xl"]` (32 px) no contêiner dos blocos, preservando os gaps internos menores de cada seção.
