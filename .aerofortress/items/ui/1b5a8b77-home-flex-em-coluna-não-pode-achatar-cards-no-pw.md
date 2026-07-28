---
id: 1b5a8b77-c553-41a9-9b9a-666db6ab34b7
slug: ui
type: scar
title: Home: flex em coluna não pode achatar cards no PWA compacto
tags: pwa, web, home, meta-do-mes, card, flexbox, layout-responsivo
provenance: observado
evidence: Captura da usuária em 2026-07-25; apps/mobile/src/app/tabs/index.tsx; ESLint direcionado, typecheck mobile e build PWA Lucro Caseiro aprovados
decay: stable
created: 2026-07-26T02:52:41.534578500+00:00
updated: 2026-07-26T02:52:41.534578500+00:00
validated: 2026-07-26T02:52:41.534578500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): no PWA estreito, o card “Meta do mês” terminava antes da mensagem “Faltam…”, que vazava por baixo da borda e encavalava o card seguinte. A causa era `flex: 1` aplicado aos cards tanto na linha desktop quanto na coluna compacta; no React Native Web, o item flexível podia ser reduzido abaixo da altura intrínseca do conteúdo. CORREÇÃO CANÔNICA: no dashboard inferior da Home, manter `flex: 1` para desktop e app nativo, mas omiti-lo exclusivamente em `Platform.OS === "web" && !isDesktop`, deixando a altura do card PWA compacto ser definida pelo conteúdo. Aplicar a mesma regra aos dois cards irmãos para manter o layout coerente. COMO EVITAR: ao reutilizar cards `flex: 1` entre linha e coluna responsivas, separar a regra por plataforma/layout e validar se a superfície contém todo o último filho em PWA estreito.
