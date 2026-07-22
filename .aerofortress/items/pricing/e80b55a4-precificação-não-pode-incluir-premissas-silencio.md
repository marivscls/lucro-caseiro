---
id: e80b55a4-939c-42d5-9ab7-9e7b2fe5454d
slug: pricing
type: scar
title: Precificação não pode incluir premissas silenciosas nem prometer exatidão
tags: pricing, ux, simple, assumptions, estimates, trust
provenance: dito
evidence: Correção confirmada pela usuária em 2026-07-22 a partir da tela publicada; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx
decay: stable
created: 2026-07-22T22:31:30.097830700+00:00
updated: 2026-07-22T22:31:30.097830700+00:00
validated: 2026-07-22T22:31:30.097830700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-22): a tela Simples exibiu mão de obra e importou R$ 3.434,80 de gastos fixos, dividindo por uma produção presumida de 100 unidades e gerando R$ 34,35 por unidade. Pessoas menos experientes podem se confundir, tomar a estimativa como exata e responsabilizar o app quando a premissa estiver errada. CORREÇÃO: no modo Simples, insumos, embalagem e lucro ficam evidentes; mão de obra e rateio ficam em “Incluir outros custos”, fechado por padrão. Nunca preencher produção mensal com valor presumido nem incluir gastos fixos sem confirmação explícita. Em ambos os modos, chamar o resultado de estimativa baseada nos dados informados e mostrar o que foi incluído.
