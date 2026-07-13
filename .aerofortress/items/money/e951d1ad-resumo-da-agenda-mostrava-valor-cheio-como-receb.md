---
id: e951d1ad-0d1f-4a03-b014-dbff06166354
slug: money
type: scar
title: Resumo da Agenda mostrava valor cheio como "Recebido" e ignorava o sinal (deposit)
tags: encomendas, sinal, deposit, agenda, resumo, a-receber, recebido
provenance: dito
evidence: apps/api/src/features/orders/orders.domain.ts (buildOrdersSummary); orders.repo.pg.ts (sum deposit); apps/mobile/src/app/agenda.tsx (OrdersSummaryHeader); packages/contracts/src/schemas/order.ts (OrdersSummaryDto). Testes: orders.domain.test.ts, orders.usecases.test.ts (23 verdes).
decay: stable
created: 2026-07-10T12:05:30.208789500+00:00
updated: 2026-07-10T12:05:30.208789500+00:00
validated: 2026-07-10T12:05:30.208789500+00:00
links: 
---

SINTOMA (2026-07-10, testes internos): encomenda de R$1.200 com sinal R$60, entregue. O card de detalhe mostrava "Falta R$1.140" (certo = valor − sinal), MAS o resumo da Agenda ("Resumo do dia") mostrava "Recebido R$1.200 · A receber R$0" — ignorando que só o sinal (60) entrou.

CAUSA: `buildOrdersSummary` (apps/api/src/features/orders/orders.domain.ts) agregava por STATUS: `delivered.amount` = Σ amount das `done`; `pending.amount` = Σ amount das ativas. Nunca olhava `deposit`. O repo `summarize` nem trazia o `deposit`.

CORREÇÃO: trocada a semântica de STATUS → PAGAMENTO. `OrdersSummary` agora é `{ totalOrders, totalAmount, received, toReceive }`: `received` = Σ `deposit`; `toReceive` = Σ (`amount − deposit`) das não canceladas. Repo passou a somar `deposit`. Mobile (agenda.tsx) mapeia "Recebido"→received, "A receber"→toReceive. Contrato `OrdersSummaryDto` atualizado. `deposit ≤ amount` é validado, então (amount−deposit) ≥ 0.

DECISÃO: "entregue" NÃO significa "pago em cheio" neste app — pagamento é rastreado pelo `deposit` (= quanto já recebi). Pra marcar quitado, sinal = valor total. Isso alinha o resumo ao "Falta" do card (que aparece mesmo em done). Se um dia quiserem "entregue = recebido total", é outra decisão.

COMO EVITAR REPETIR: qualquer agregação financeira de encomendas tem que considerar `deposit`, não o `amount` cheio; e "recebido/a receber" é conceito de PAGAMENTO, não de status de entrega. Ver [[backlog-de-testes-internos-2026-07-10-18-itens-pre]].
