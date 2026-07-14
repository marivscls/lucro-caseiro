---
id: 39034d44-4056-46a7-992c-3530fde80fe5
slug: ui
type: scar
title: Estados de tela não devem formar ternário encadeado no JSX
tags: react-native, lint, sonarjs, estado, renderizacao
provenance: observado
evidence: apps/mobile/src/app/admin-metrics.tsx; lint mobile aprovado
decay: stable
created: 2026-07-14T02:46:23.562114800+00:00
updated: 2026-07-14T02:46:23.562114800+00:00
validated: 2026-07-14T02:46:23.562114800+00:00
links:
---

SINTOMA (2026-07-13): o lint mobile falhou em `admin-metrics.tsx` com `sonarjs/no-nested-conditional` ao renderizar loading, erro e conteúdo com ternários encadeados. CORREÇÃO: calcular `content` antes do retorno usando `if/else if/else`. COMO EVITAR: telas com três ou mais estados devem escolher o conteúdo em fluxo explícito antes do JSX.
