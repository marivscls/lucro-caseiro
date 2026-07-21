---
id: 2ffc903f-5ecb-4983-9425-53c22071042f
slug: labels
type: fact
title: Etiquetas têm formato de impressão configurável por folha A4
tags: labels, printing, a4, premium
provenance: observado
evidence: packages/contracts/src/schemas/label.ts; apps/mobile/src/features/labels/label-export.ts; apps/mobile/src/features/labels/components/label-layout-editor.tsx; apps/api/src/features/labels/labels.usecases.ts
decay: stable
created: 2026-07-21T02:56:14.752974500+00:00
updated: 2026-07-21T02:56:14.752974500+00:00
validated: 2026-07-21T02:56:14.752974500+00:00
links:
---

A criação e a edição de etiquetas aceitam `layout` com largura e altura em milímetros e número de cópias por folha. A capacidade é calculada sobre a área imprimível A4 de 190 × 277 mm com 4 mm de espaçamento; configurações acima dessa capacidade são rejeitadas no contrato e limitadas novamente na exportação. Etiquetas antigas sem `layout` mantêm o padrão 90 × 60 mm e 8 unidades. O formato customizado usa a permissão existente `labelsPremium`.
