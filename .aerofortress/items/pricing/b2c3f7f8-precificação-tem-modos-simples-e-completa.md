---
id: b2c3f7f8-84bf-4a40-9162-a55c0772e58c
slug: pricing
type: decision
title: Precificação tem modos Simples e Completa
tags: pricing, ux, simple, complete, automation, estimates, plans
provenance: dito
evidence: apps/mobile/src/app/pricing-complete.tsx; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-calculator.tsx; packages/contracts/src/schemas/plans.ts; decisão confirmada em 2026-07-22
decay: stable
created: 2026-07-22T21:46:21.190816800+00:00
updated: 2026-07-22T22:44:29.113143700+00:00
validated: 2026-07-22T22:44:29.113143700+00:00
links:
---

Decisão consolidada da usuária em 2026-07-22: a precificação oferece duas telas conectadas e nenhuma promete exatidão absoluta. `/pricing` é a entrada Simples, disponível a todos os planos: insumos, embalagem e lucro ficam evidentes; mão de obra e gastos fixos permanecem em “Incluir outros custos”, fechado por padrão. Ela nunca importa gastos fixos, presume produção mensal ou inclui uma premissa silenciosamente. `/pricing-complete` é exclusiva do plano Profissional pela feature `advancedPricing`; antes do formulário, contas sem a feature veem apresentação e CTA. A Completa usa embalagem cadastrada exata, mão de obra por tempo total do lote/rendimento/valor da hora e rateio com total mensal e produção confirmados. Ambos apresentam estimativas baseadas nos dados informados, mostram custos incluídos/não incluídos e salvam no mesmo histórico. O Profissional vende profundidade e controle, nunca a correção matemática básica.
