---
id: 280cdf43-af3d-4885-a2c5-5c9668ffedca
slug: ui
type: scar
title: Modal de filtros: não mutar evento com stopPropagation em Pressables aninhados
tags: android, modal, pressable, fabric, eventos, vendas
provenance: inferido
evidence: apps/mobile/src/app/tabs/sales.tsx; screenshot da usuária em 2026-07-13; pnpm --filter @lucro-caseiro/mobile typecheck/lint/test
decay: stable
created: 2026-07-13T03:55:43.445937+00:00
updated: 2026-07-13T03:55:43.445937+00:00
validated: 2026-07-13T03:55:43.445937+00:00
links: 
---

SINTOMA (2026-07-13, Android): ao abrir/interagir com “Filtrar vendas”, o overlay de desenvolvimento mostrou `property is not writable`. CAUSA INFERIDA A PARTIR DO CÓDIGO: o painel era um `Pressable` aninhado no backdrop e chamava `event.stopPropagation()`, o que tenta mutar o evento sintético no renderer/Fabric. CORREÇÃO: backdrop e painel passaram a ser irmãos; o backdrop é um Pressable absoluto e o conteúdo é um View, preservando o fechamento por toque fora sem `stopPropagation`. COMO EVITAR: em modais/bottom sheets, não depender de Pressables aninhados + mutação do evento para impedir fechamento; separar backdrop e conteúdo em camadas irmãs. Typecheck, lint e 294 testes passaram; o fluxo autenticado não foi reproduzido no emulador local porque ele estava deslogado.
