---
id: b2c3f7f8-84bf-4a40-9162-a55c0772e58c
slug: pricing
type: decision
title: Precificação tem modos Simples e Completa
tags: pricing, ux, simple, complete, automation
provenance: dito
evidence: apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-calculator.tsx; correção da usuária em 2026-07-22
decay: stable
created: 2026-07-22T21:46:21.190816800+00:00
updated: 2026-07-22T22:07:18.741790600+00:00
validated: 2026-07-22T22:07:18.741790600+00:00
links:
---

Decisão consolidada da usuária em 2026-07-22: a precificação oferece duas telas conectadas. `/pricing` é a entrada Simples, mas simplicidade significa automação: ela separa insumos, embalagem, mão de obra e rateio de gastos fixos, preenchendo receita/produto, embalagem cadastrada e gastos fixos registrados quando disponíveis; o app faz todas as somas e divisões e a pessoa informa o lucro desejado e uma taxa opcional. `/pricing-complete` mantém o assistente detalhado para maior controle. As duas telas salvam no mesmo histórico. A camada Profissional deve vender profundidade e controle, nunca a correção matemática básica.
