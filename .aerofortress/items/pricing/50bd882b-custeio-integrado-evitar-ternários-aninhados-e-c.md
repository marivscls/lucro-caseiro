---
id: 50bd882b-46ea-49a3-9f6c-d0a86e3890da
slug: pricing
type: scar
title: Custeio integrado: evitar ternários aninhados e casts em dados de query
tags: pricing, lint, sonarjs, react-query
provenance: observado
evidence: apps/mobile/src/features/pricing/components/pricing-calculator.tsx; apps/mobile/src/features/pricing/hooks.ts; lint mobile aprovado após correção em 2026-08-08
decay: stable
created: 2026-08-08T14:59:14.594427+00:00
updated: 2026-08-08T14:59:14.594427+00:00
validated: 2026-08-08T14:59:14.594427+00:00
links:
---

SINTOMA: o primeiro lint da implementação de custeio falhou em `sonarjs/no-nested-conditional` por derivar fonte de faturamento e subtítulo com ternários aninhados, e em `no-unnecessary-type-assertion` por fazer cast do resultado já tipado de `useQueries`. CORREÇÃO: calcular `revenueBasis` e `costingSummary` com variáveis/branches explícitos e consumir `query.data` sem cast. COMO EVITAR: em telas financeiras com três ou mais fontes/modos, derivar estados por statements nomeados; confiar na inferência dos hooks tipados antes de adicionar assertions.
