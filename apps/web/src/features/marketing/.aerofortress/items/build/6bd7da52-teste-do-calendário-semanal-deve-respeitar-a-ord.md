---
id: 6bd7da52-7444-4611-9958-9e47402db5b1
slug: build
type: scar
title: Teste do calendário semanal deve respeitar a ordenação editorial observada
tags: calendar, tests, ordering, marketing
provenance: observado
evidence: apps/web/src/features/marketing/calendar-week.ts; apps/web/src/features/marketing/calendar-week.test.ts — Vitest falhou e a expectativa foi corrigida em 2026-08-15
decay: stable
created: 2026-08-15T17:05:11.094540600+00:00
updated: 2026-08-15T17:05:11.094540600+00:00
validated: 2026-08-15T17:05:11.094540600+00:00
links:
---

FALHA REAL DE TESTE CORRIGIDA (2026-08-15): o helper da semana ordena várias cartas do mesmo dia pelo título em pt-BR, mas a primeira expectativa preservava a ordem do fixture e falhou. COMO EVITAR: ao testar agrupamento por dia, alinhar a expectativa com a ordenação explícita do contrato ou testar apenas o conjunto quando a ordem não fizer parte do comportamento.
