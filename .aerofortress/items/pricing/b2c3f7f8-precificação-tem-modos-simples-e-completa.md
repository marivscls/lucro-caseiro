---
id: b2c3f7f8-84bf-4a40-9162-a55c0772e58c
slug: pricing
type: decision
title: Precificação tem modos Simples e Completa
tags: pricing, plans, ux, estimates
provenance: dito
evidence: Decisão confirmada pela usuária em 2026-07-22; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/app/pricing-complete.tsx
decay: stable
created: 2026-07-22T21:46:21.190816800+00:00
updated: 2026-07-22T23:12:11.883077200+00:00
validated: 2026-07-22T23:12:11.883077200+00:00
links:
---

Decisão consolidada da usuária em 2026-07-22: `/pricing` é o modo Simples, disponível em qualquer plano, e usa somente custos diretos compreensíveis — insumos, embalagem, lucro desejado e taxa de venda opcional. Ele não pede nem inclui minutos, valor da hora, gastos mensais ou produção mensal porque esses dados podem ser incertos; o resultado declara explicitamente que mão de obra e gastos mensais não estão incluídos. `/pricing-complete` é o modo Completo do plano Profissional (`advancedPricing`): mantém mão de obra por lote e rateio de gastos fixos como estimativas opcionais, sem premissas automáticas. Os dois modos chamam o resultado de preço sugerido/estimativa e salvam no mesmo histórico.
