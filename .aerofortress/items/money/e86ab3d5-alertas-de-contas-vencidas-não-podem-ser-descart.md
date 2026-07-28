---
id: e86ab3d5-685d-4c44-88d2-956369d4b6d8
slug: money
type: scar
title: Alertas de contas vencidas não podem ser descartados dizendo que faltam dados
tags: financeiro, compras, vencimento, alertas, inspirações
provenance: observado
evidence: packages/contracts/src/schemas/purchase.ts; packages/database/src/schema/purchases.ts; apps/api/src/features/purchases/purchases.repo.pg.ts; ausência de compras vencidas em apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T00:32:35.819622700+00:00
updated: 2026-07-25T00:32:35.819622700+00:00
validated: 2026-07-25T00:32:35.819622700+00:00
links:
---

SINTOMA (2026-07-24): a auditoria das inspirações declarou que alertas de contas vencidas não podiam ser implementados porque o modelo não registrava pagamento/vencimento suficiente. Isso estava errado: Compras já possuem `dueDate`, `paymentStatus` e `paidAt` nos contratos, banco e API. O que falta é integrar esses dados ao Financeiro/Insights e definir o escopo de quais obrigações entram no alerta; a lacuna é de implementação, não de impossibilidade do modelo. COMO EVITAR: antes de descartar um insight por falta de dados, verificar os contratos e schemas de todos os módulos financeiros, especialmente Compras e Gastos Fixos.
