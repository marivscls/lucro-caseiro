---
id: 7d0e8276-3874-4acf-8cdd-d91bdf13d58f
slug: money
type: scar
title: Mock de venda deve refletir paidAmount do status
tags: vendas, testes, fiado, paidAmount
provenance: observado
evidence: apps/api/src/features/sales/sales.usecases.test.ts
decay: stable
created: 2026-07-29T02:27:38.664519900+00:00
updated: 2026-07-29T02:27:38.664519900+00:00
validated: 2026-07-29T02:27:38.664519900+00:00
links:
---

SINTOMA: o teste de venda fiado acusou lançamento no Caixa porque o repo fake sempre devolvia `paidAmount = total`, mesmo quando o status era `pending`. CORREÇÃO: mocks de criação de venda devem derivar `paidAmount` do payload ou usar zero para pending/credit e total somente para paid. Isso preserva a regra: Fiado sem recebimento não posta entrada financeira.
