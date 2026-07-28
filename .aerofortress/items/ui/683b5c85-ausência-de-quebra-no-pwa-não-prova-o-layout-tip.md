---
id: 683b5c85-8d03-4b4b-b9e9-403b8a3565f1
slug: ui
type: scar
title: Ausência de quebra no PWA não prova o layout tipográfico do app nativo
tags: mobile, android, pwa, quebra-de-linha, button, screen-header, tab-bar, responsividade
provenance: dito
evidence: packages/ui/src/components/button.tsx; apps/mobile/src/shared/components/screen-header.tsx; apps/mobile/src/shared/components/form-section.tsx; apps/mobile/src/app/tabs/_layout.tsx; apps/mobile/src/features/pricing/components/pricing-mode-switch.tsx; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/features/subscription/components/paywall.tsx; Android emulator 360dp com font_scale 1.0 e 1.3; ESLint mobile, typecheck UI/mobile e 4 testes de ScreenHeader aprovados
decay: stable
created: 2026-07-26T02:36:14.843186300+00:00
updated: 2026-07-26T02:36:14.843186300+00:00
validated: 2026-07-26T02:36:14.843186300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): depois de ajustar as quebras no PWA, o app mobile continuou quebrando rótulos. CAUSA CONFIRMADA NO CÓDIGO: o Button compartilhado ainda aceitava duas linhas e controles compactos dependiam da medição específica do React Native/Android; o PWA não reproduzia esse comportamento. CORREÇÃO CANÔNICA: rótulos de ações usam uma linha com ajuste de fonte; ScreenHeader, títulos de seções, seletor de Precificação e rótulos da tab bar também permanecem em uma linha e ajustam a fonte; textos corridos continuam podendo quebrar. Quebras manuais sem significado semântico foram removidas do Financeiro e do checkout. COMO EVITAR: auditar separadamente Android/iOS e web, incluindo fonte do sistema ampliada; captura do PWA não valida a composição nativa.
