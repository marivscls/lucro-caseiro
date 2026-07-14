---
id: 2beb3c67-abd2-4503-9972-e03bc72146a9
slug: build
type: scar
title: Validação de placeholder não precisa de regex vulnerável ao slow-regex
tags: eslint, sonarjs, slow-regex, config, prepush
provenance: observado
evidence: apps/api/src/features/analytics/report.ts; pnpm prepush aprovado em 2026-07-13
decay: stable
created: 2026-07-14T02:31:29.910188300+00:00
updated: 2026-07-14T02:31:29.910188300+00:00
validated: 2026-07-14T02:31:29.910188300+00:00
links:
---

SINTOMA (2026-07-13): o prepush falhou em `analytics/report.ts` porque `/<[^>]+>/` acionou `sonarjs/slow-regex`, embora servisse apenas para detectar placeholders na `DATABASE_URL`. CORREÇÃO: usar `databaseUrl.includes("<") || databaseUrl.includes(">")`. COMO EVITAR: para detectar caracteres ou marcadores fixos em configuração, prefira `includes`/comparações diretas; não introduza regex com repetição quando uma busca literal resolve.
