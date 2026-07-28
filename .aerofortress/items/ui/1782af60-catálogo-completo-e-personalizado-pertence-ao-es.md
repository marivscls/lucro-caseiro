---
id: 1782af60-e29f-4346-af3f-c8bdfad856a9
slug: ui
type: scar
title: Catálogo completo e personalizado pertence ao Essencial
tags: catalogo, essential, checkout, feature-gate, planos
provenance: dito
evidence: Correção e captura da usuária em 2026-07-25; packages/contracts/src/schemas/plans.ts; apps/mobile/src/app/catalog.tsx
decay: stable
created: 2026-07-26T01:16:19.925574200+00:00
updated: 2026-07-26T01:16:19.925574200+00:00
validated: 2026-07-26T01:16:19.925574200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): o Catálogo inteiro pertence ao plano Essencial — inclusive catálogo completo e personalização. SINTOMA: a conta Essencial ainda via o checkout Profissional ao tentar liberar catálogo completo/personalizado. CORREÇÃO CANÔNICA: `catalogPremium` e `catalogCustomization` devem estar disponíveis no Essencial na matriz compartilhada; conta Essencial não vê bloqueio e conta Gratuita abre checkout Essencial. Backend, mobile, textos e testes devem usar a mesma regra. COMO EVITAR: não tratar o Catálogo como diferencial do Profissional; o tier mínimo explícito de todos os gatilhos de catálogo é `essential`.
