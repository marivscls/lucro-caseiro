---
id: 6c7c76f2-a614-49fa-8635-9786991c1b2d
slug: ui
type: scar
title: Bottom sheet com ação no rodapé deve somar o inset inferior do Android
tags: android, modal, bottom-sheet, safe-area, rodape, encomendas
provenance: observado
evidence: apps/mobile/src/features/orders/components/order-form.tsx; screenshot enviado pela usuária em 2026-07-13; lint e typecheck mobile aprovados
decay: stable
created: 2026-07-13T12:50:22.724625500+00:00
updated: 2026-07-13T12:50:22.724625500+00:00
validated: 2026-07-13T12:50:22.724625500+00:00
links:
---

SINTOMA (2026-07-13, Android): no modal “Selecionar cliente” de Nova encomenda, o botão “Fechar” terminava atrás da barra de navegação do sistema e ficava parcialmente inacessível. CAUSA: o painel encostava na borda inferior da tela e usava padding fixo, sem considerar a safe area. CORREÇÃO: obter `useSafeAreaInsets()` e usar `paddingBottom: spacing.lg + insets.bottom` no contêiner do bottom sheet, preservando padding horizontal/superior. COMO EVITAR: todo modal/bottom sheet ancorado no fim da tela com ação inferior deve reservar o inset do sistema; limite de altura ou padding fixo não substitui a safe area.
