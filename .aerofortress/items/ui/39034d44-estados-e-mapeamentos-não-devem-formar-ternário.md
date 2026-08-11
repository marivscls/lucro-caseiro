---
id: 39034d44-4056-46a7-992c-3530fde80fe5
slug: ui
type: scar
title: Estados e mapeamentos não devem formar ternário encadeado
tags: ui, lint, sonarjs, ternario, react-native
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; ESLint falhou e depois aprovou em 2026-08-10
decay: stable
created: 2026-07-14T02:46:23.562114800+00:00
updated: 2026-08-10T18:48:03.073672100+00:00
validated: 2026-08-10T18:48:03.073672100+00:00
links:
---

SINTOMA (2026-07-13): o lint mobile falhou em `admin-metrics.tsx` com `sonarjs/no-nested-conditional` ao renderizar loading, erro e conteúdo com ternários encadeados. RECORRÊNCIAS: em 2026-07-16 no botão de rascunho por IA de `resource-board.tsx`; em `sitemap.ts` ao escolher prioridades; em 2026-07-18 no botão de preenchimento do Campaign Studio; em 2026-07-24 no filtro de reposição de `product-list.tsx`; em 2026-07-25 no seletor de cor de `FilterPill` do Financeiro, onde `selected ? filled ? corA : corB : undefined` falhou no lint; no novo `LimitBanner`, ao escolher entre “limite atingido”, “resta 1” e “restam N”; e em 2026-08-10 no piloto de paleta da Home, tanto ao escolher cores por marca/tema quanto ao escolher cores de lucro/progresso. CORREÇÃO: escolher conteúdo ou valor antes do retorno com fluxo explícito (`if/else`) ou função nomeada (`priorityFor`). COMO EVITAR: sempre que houver três ou mais estados ou valores possíveis, resolver em fluxo explícito antes do JSX/objeto em vez de encadear ternários.
