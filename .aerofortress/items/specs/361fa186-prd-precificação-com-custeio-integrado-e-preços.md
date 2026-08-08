---
id: 361fa186-cf20-404b-bd80-dcfe75483892
slug: specs
type: doc
title: PRD — Precificação com custeio integrado e preços por canal
tags: pricing, custeio, financeiro, canais, prd
provenance: observado
evidence: .aerofortress/specs/prd-precificacao-custeio-integrado.md
decay: stable
created: 2026-08-08T14:43:57.493920300+00:00
updated: 2026-08-08T15:10:08.883153600+00:00
validated: 2026-08-08T15:10:08.883153600+00:00
links:
---

PRD implementado no código em 2026-08-08 para integrar Gastos Fixos, faturamento observado e Meta de pró-labore à Precificação Completa, sempre como sugestões confirmadas. Entrega rateio por unidades e custeio por faturamento, perfis persistidos de taxas por canal, proteção `advancedPricing`, novas evidências no histórico e compatibilidade com cálculos antigos; o modo Simples permanece inalterado. A migration 051 foi criada, mas não aplicada em banco externo nesta sessão. Validação observada: 712 testes da API, 427 do app, quatro typechecks, lints, context lint e build PWA aprovados.
