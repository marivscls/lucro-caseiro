---
id: 46343eea-b9cb-4702-919b-97bde8fe9d1b
slug: ui
type: scar
title: Financeiro não pode truncar valores nem ocultar controles de período
tags: financeiro, mobile, truncamento, valores-monetarios, filtros, responsividade
provenance: dito
evidence: Correção da usuária e referências anexadas em 2026-08-16; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-08-16T17:59:33.968697600+00:00
updated: 2026-08-16T17:59:33.968697600+00:00
validated: 2026-08-16T17:59:33.968697600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): após o redesign do Financeiro, a implementação observada pulava do cabeçalho para o hero e exibia valores/contagens truncados (`-R$ 305,...`, `R$ 2.00...`, `12 lançament...`). REGRA CANÔNICA: Hoje/7 dias/Mês/Personalizado e o seletor mensal devem permanecer visíveis e funcionais no topo; valores monetários e contagens nunca usam reticências nem quebram em duas linhas. COMO EVITAR: não depender de `numberOfLines={1}`/ellipsis para encaixe financeiro; reservar largura ao número, usar fonte responsiva/tabular, reduzir padding/ícone/PNG antes de cortar texto e validar visualmente em 390 px e 540–560 px.
