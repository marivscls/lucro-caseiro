---
id: b2c3f7f8-84bf-4a40-9162-a55c0772e58c
slug: pricing
type: decision
title: Precificação tem modos Simples e Completa
tags: pricing, ux, simple, complete, automation, estimates
provenance: dito
evidence: apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-result.tsx; decisão confirmada em 2026-07-22
decay: stable
created: 2026-07-22T21:46:21.190816800+00:00
updated: 2026-07-22T22:36:08.656849+00:00
validated: 2026-07-22T22:36:08.656849+00:00
links:
---

Decisão consolidada da usuária em 2026-07-22: a precificação oferece duas telas conectadas e nenhuma promete exatidão absoluta. `/pricing` é a entrada Simples: insumos, embalagem e lucro ficam evidentes; mão de obra e gastos fixos permanecem em “Incluir outros custos”, fechado por padrão. Ela nunca importa gastos fixos, presume produção mensal ou inclui uma premissa silenciosamente. `/pricing-complete` mantém o assistente detalhado: embalagem usa custo cadastrado exato; mão de obra usa tempo total do lote, rendimento e valor da hora; rateio exige total mensal e produção confirmados. Ambos apresentam uma estimativa baseada nos dados informados, mostram custos incluídos/não incluídos, salvam no mesmo histórico e deixam a pessoa revisar as premissas. A camada Profissional deve vender profundidade e controle, nunca a correção matemática básica.
