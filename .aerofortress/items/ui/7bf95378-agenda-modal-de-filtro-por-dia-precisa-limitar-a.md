---
id: 7bf95378-6048-4238-9142-a07ad78634e9
slug: ui
type: scar
title: Agenda: modal de filtro por dia precisa limitar altura e rolar as opções
tags: agenda, filtro, modal, scroll, android
provenance: observado
evidence: apps/mobile/src/app/tabs/agenda.tsx; screenshot e pedido da usuária em 2026-07-13; ESLint do arquivo e typecheck mobile aprovados
decay: stable
created: 2026-07-13T03:56:30.546739+00:00
updated: 2026-07-13T03:56:30.546739+00:00
validated: 2026-07-13T03:56:30.546739+00:00
links: 
---

SINTOMA (2026-07-13, Android): ao abrir “Filtrar por dia” com muitas datas, a lista crescia além da altura da tela e os últimos dias ficavam inacessíveis. CAUSA: todas as opções eram renderizadas em um View sem limite de altura. CORREÇÃO: limitar o card do modal a 80% da tela, manter o cabeçalho fixo e colocar “Todos os dias” + datas em um ScrollView vertical com flexShrink. COMO EVITAR: modais com coleções de tamanho variável devem ter altura máxima e região interna rolável; não depender do conteúdo caber na viewport.
