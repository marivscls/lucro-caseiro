---
id: 8a5e633e-3863-4a13-9030-d0ea779bad97
slug: ui
type: scar
title: Arte decorativa não pode simular padding superior dobrado em superfícies
tags: padding, card, pricing, responsive, whitelabel, desktop, mobile
provenance: dito
evidence: apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; .aerofortress/tmp/padding-audit-current.png (antes: top 39 px, lateral 25 px); .aerofortress/tmp/padding-audit-after.png e padding-audit-mobile-after.png (depois: topo e lateral ~22–25 px); typecheck/lint e 443 testes aprovados; builds PWA caseiro/papelaria/manicure/revenda/oficina/obra aprovados
decay: stable
created: 2026-08-14T16:46:41.587760200+00:00
updated: 2026-08-14T16:46:41.587760200+00:00
validated: 2026-08-14T16:46:41.587760200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): depois de retirar o padding superior duplicado do shell desktop, ainda havia containers cujo conteúdo parecia começar com quase o dobro do respiro lateral. A auditoria renderizada encontrou o caso reproduzível no painel `Custos da unidade` da Precificação: o `Card` tinha padding próprio, mas o primeiro cabeçalho era uma linha alta com ilustração e `alignItems: "center"`; o título ficava centralizado verticalmente e começava 39 px abaixo da borda, contra 25 px na lateral. CORREÇÃO: em superfícies com arte meramente decorativa ao lado do cabeçalho, alinhar a linha em `flex-start` e não impor `minHeight` adicional. Assim o primeiro conteúdo começa no padding canônico do próprio Card. A implementação é compartilhada por todas as marcas e vale para PWA, Android e iOS. COMO EVITAR: auditar o inset visual do primeiro texto, não somente as propriedades `padding`; altura mínima e centralização também podem fabricar padding aparente.
