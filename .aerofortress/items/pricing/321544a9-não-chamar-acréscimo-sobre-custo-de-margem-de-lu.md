---
id: 321544a9-507c-407a-ad5d-cf6948488ad3
slug: pricing
type: scar
title: Não chamar acréscimo sobre custo de margem de lucro
tags: pricing, margin, markup, ux, money
provenance: observado
evidence: apps/mobile/src/features/pricing/components/pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-result.tsx; apps/mobile/src/features/pricing/calc.ts; 357 testes mobile e build PWA aprovados em 2026-07-22
decay: stable
created: 2026-07-22T21:46:21.218206600+00:00
updated: 2026-07-22T21:46:21.218206600+00:00
validated: 2026-07-22T21:46:21.218206600+00:00
links:
---

SINTOMA: a interface chamava `custo × (1 + percentual)` de “margem de lucro”. Essa fórmula é acréscimo/markup sobre o custo; por exemplo, custo 100 com 30% gera preço 130, cuja margem real sobre o preço é 23,1%. CORREÇÃO: o modo completo passou a dizer “Acréscimo sobre o custo” e o resultado reserva “Margem sobre o preço” para `(preço − custo) / preço`. O modo Simples evita o jargão perguntando “Quanto você quer ganhar por unidade?” e converte esse valor para o campo técnico legado `marginPercent` ao salvar. COMO EVITAR: nunca rotular markup como margem; manter o nome técnico legado apenas na persistência/contrato enquanto a UI apresenta o conceito correto.
