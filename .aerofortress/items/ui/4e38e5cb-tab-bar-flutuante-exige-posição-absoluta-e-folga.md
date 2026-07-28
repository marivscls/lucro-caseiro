---
id: 4e38e5cb-9fb7-48ca-9cab-0968a70bb23f
slug: ui
type: scar
title: Tab bar flutuante exige posição absoluta e folga inferior nas listas
tags: tab-bar, react-native-web, android, layout, scrollview, flatlist, safe-area, padding-bottom, configuracoes
provenance: dito
evidence: Capturas e correções da usuária em 2026-07-25; apps/mobile/src/shared/layout/floating-tab-bar.ts; apps/mobile/src/app/tabs/_layout.tsx; index.tsx; more.tsx; clients.tsx; sales.tsx; lint completo, TypeScript, 399 testes e build PWA aprovados
decay: stable
created: 2026-07-25T20:53:23.776081500+00:00
updated: 2026-07-26T02:37:43.493489400+00:00
validated: 2026-07-26T02:37:43.493489400+00:00
links:
---

SINTOMAS E CORREÇÕES DA USUÁRIA (2026-07-25): (1) `marginHorizontal: 12` fez a tab bar ultrapassar a borda direita e esconder `Mais`; (2) `left: 12`/`right: 12` sem posição absoluta deslocou a barra; (3) depois da posição absoluta, a barra passou a cobrir os últimos itens roláveis — em `Mais`, o card Configurações ficava escondido, e na Home os últimos recursos terminavam atrás da barra. CAUSAS: `left/right` só delimitam corretamente a superfície quando `position: "absolute"`; uma barra absoluta deixa de reservar espaço no layout, portanto ScrollView/FlatList precisam compensar sua altura, offset inferior, safe area e um respiro final. CORREÇÃO CANÔNICA: barra com `position: "absolute"`, `left: 12`, `right: 12`, `width: "auto"`; métricas centralizadas em `shared/layout/floating-tab-bar.ts`; listas raiz usam `floatingTabBarContentPadding(...)`. Início e Mais, que excluem a edge inferior do SafeArea, passam o inset real; Clientes e Vendas, cujo SafeArea já reserva o inset, passam zero. Agenda e Nova Venda mantêm reservas próprias maiores. COMO EVITAR: toda tela rolável dentro das tabs deve provar que o último item sobe completamente acima da barra em Android com navegação do sistema; não usar padding fixo menor que a folga canônica.
