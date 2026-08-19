---
id: f9ff7058-6867-4a3e-90ee-ea4b0197a352
slug: ui
type: scar
title: Clientes: ScrollView horizontal do filtro precisa limitar a altura
tags: clientes, filtros, scrollview, react-native-web, layout
provenance: observado
evidence: apps/mobile/src/app/tabs/clients.tsx; .aerofortress/clients-filter-check.png; captura 1012x1150 confirmou chips com 42 px
decay: stable
created: 2026-08-18T13:02:15.357256900+00:00
updated: 2026-08-18T13:02:15.357256900+00:00
validated: 2026-08-18T13:02:15.357256900+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): na tela Clientes, os chips Todos/Recentes/Frequentes/Com fiado viraram cápsulas verticais com cerca de 300 px porque o ScrollView horizontal não limitava o eixo transversal dentro do ScrollView vertical com flexGrow. CORREÇÃO: definir altura explícita de 42 px no FilterChip e no ScrollView horizontal, usar flexGrow: 0/flexShrink: 0 e alinhar o contentContainer no centro. COMO EVITAR: controles horizontais aninhados em áreas flexíveis devem limitar a altura e o alinhamento transversal; validar por screenshot real, pois lint e typecheck não detectam esse esticamento.
