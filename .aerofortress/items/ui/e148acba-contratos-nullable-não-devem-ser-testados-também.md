---
id: e148acba-681e-4d32-8b55-b8e484453d90
slug: ui
type: scar
title: Contratos nullable não devem ser testados também como undefined
tags: typescript, lint, sonarjs, products, stock, mobile
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; pnpm --filter @lucro-caseiro/mobile lint em 2026-07-24
decay: stable
created: 2026-07-24T23:14:00.087769+00:00
updated: 2026-07-24T23:14:00.087769+00:00
validated: 2026-07-24T23:14:00.087769+00:00
links:
---

SINTOMA (2026-07-24): o lint mobile falhou em `new-sale.tsx` com `sonarjs/different-types-comparison` ao testar `product.stockQuantity === undefined` e `product.stockAlertThreshold !== undefined`. No contrato `Product`, ambos são `number | null`; somente estoques de variação são opcionais. CORREÇÃO: manter o teste de `undefined` apenas no array de variações e usar somente `null` nos campos do produto. COMO EVITAR: conferir o tipo refinado do contrato antes de combinar guardas de `null` e `undefined`; guardas impossíveis também são erro de lint.
