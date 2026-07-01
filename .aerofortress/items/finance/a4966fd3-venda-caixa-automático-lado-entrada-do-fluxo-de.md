---
id: a4966fd3-0681-4945-b9fc-364567aa8c45
slug: finance
type: decision
title: Venda → caixa automático (lado entrada do fluxo de caixa) — feito e no ar
tags: fluxo-de-caixa, sales, finance, venda-caixa, automatico
provenance: observado
evidence: commit 1bdbc6e; apps/api/src/features/sales/sales.usecases.ts, finance.usecases.ts (postSaleIncome/removeSaleIncome), main.ts
decay: stable
created: 2026-06-25T14:55:20.120427+00:00
updated: 2026-06-25T14:55:20.120427+00:00
validated: 2026-06-25T14:55:20.120427+00:00
links:
---

Fechado o lado ENTRADA do fluxo de caixa (commit 1bdbc6e em main). Antes `Finance.createFromSale` existia mas sales não chamava; agora chama via porta.

**Como funciona:** `SalesUseCases` recebe um 5º arg opcional `ISaleFinancePoster` (= `FinanceUseCases`, injetado no main.ts). Eventos:

- `createSale` com status `paid` → posta ENTRADA no caixa. Fiado (`credit`→`pending`) NÃO entra até ser pago.
- `updateStatus` pending→paid → posta; paid→cancelled → remove.
- `updateSale` em venda paga → re-sincroniza (remove+post).
  Idempotência: `FinanceUseCases.postSaleIncome` checa `repo.findBySaleId` antes de criar (não duplica); `removeSaleIncome` usa `deleteBySaleId`. Novos métodos no `IFinanceRepo`: `findBySaleId`, `deleteBySaleId`. Entrada usa data=`soldAt`, descrição "Venda — {cliente}", categoria "sale". **Best-effort**: falha no caixa nunca derruba a venda (igual baixa de insumos).

**Decisão de produto (dito pela dona):** fluxo de caixa FAZ sentido pro Lucro Caseiro, MAS só na versão "entrou/saiu/sobrou/quem me deve/o que devo" — NADA de projeção de saldo, gráficos pesados ou contas a receber com aging (vira ERP, foge do público idoso/simples). Manter linguagem simples, sem jargão "fluxo de caixa". Relacionado: [[fornecedores-fase-1-cadastro]] e a virada premium.

**Pendência conhecida:** a entrada de fiado pago usa a data da venda (`soldAt`), não a data do pagamento — simplificação aceita; refinar se a visão de caixa mensal precisar.
