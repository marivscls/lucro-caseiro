---
id: 39034d44-4056-46a7-992c-3530fde80fe5
slug: ui
type: scar
title: Estados e mapeamentos não devem formar ternário encadeado
tags: lint, sonarjs, estado, renderizacao, web, mobile, sitemap
provenance: observado
evidence: apps/mobile/src/app/admin-metrics.tsx; apps/web/src/features/marketing/resource-board.tsx; apps/web/src/app/sitemap.ts; lint mobile/web
decay: stable
created: 2026-07-14T02:46:23.562114800+00:00
updated: 2026-07-17T00:57:01.844717400+00:00
validated: 2026-07-17T00:57:01.844717400+00:00
links:
---

SINTOMA (2026-07-13): o lint mobile falhou em `admin-metrics.tsx` com `sonarjs/no-nested-conditional` ao renderizar loading, erro e conteúdo com ternários encadeados. RECORRÊNCIAS: em 2026-07-16 o lint web falhou no botão do rascunho por IA de `resource-board.tsx`; na expansão do site público, falhou novamente em `sitemap.ts` ao escolher prioridades 1/0.9/0.6 com ternário encadeado. CORREÇÃO: escolher o conteúdo ou valor antes do retorno com fluxo explícito (`if/else`) ou função nomeada (`priorityFor`). COMO EVITAR: sempre que houver três ou mais estados ou valores possíveis, resolver em fluxo explícito antes do JSX/objeto em vez de encadear ternários.
