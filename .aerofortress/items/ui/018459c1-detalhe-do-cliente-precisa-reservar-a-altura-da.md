---
id: 018459c1-bbe7-4ae8-8ef2-c0f856ef2425
slug: ui
type: scar
title: Detalhe do cliente precisa reservar a altura da barra flutuante
tags: mobile, clientes, historico, scroll, tab-bar, safe-area
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-04; apps/mobile/src/features/clients/components/client-detail.tsx; lint direcionado, typecheck mobile e git diff --check aprovados
decay: stable
created: 2026-08-05T02:06:41.718125600+00:00
updated: 2026-08-05T02:06:41.718125600+00:00
validated: 2026-08-05T02:06:41.718125600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): no detalhe do cliente, as últimas compras do histórico ficavam atrás da navegação inferior flutuante e não podiam ser posicionadas acima dela para leitura. CAUSA: o ScrollView reservava apenas `spacing["3xl"]`, menor que a soma da altura e do deslocamento da tab bar. CORREÇÃO CANÔNICA: no mobile/PWA, o `ClientDetail` usa `floatingTabBarContentPadding(0)` como padding inferior; no desktop mantém `spacing["3xl"]`. COMO EVITAR: conteúdo rolável dentro de Tabs com barra absoluta deve reutilizar o cálculo compartilhado da barra, não um espaçamento genérico.
