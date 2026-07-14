---
id: 9d728c02-ee8b-4058-975f-cce07e74a95b
slug: ui
type: scar
title: Tela de métricas administrativas deve respeitar a safe area superior
tags: android, safe-area, metricas, admin, status-bar
provenance: dito
evidence: Screenshot da usuária em 2026-07-14; apps/mobile/src/app/admin-metrics.tsx; lint e typecheck mobile aprovados
decay: stable
created: 2026-07-14T03:10:10.622916+00:00
updated: 2026-07-14T03:10:10.622916+00:00
validated: 2026-07-14T03:10:10.622916+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-14): a tela “Métricas do produto” começava atrás/colada à barra de status no Android. CAUSA: o `SafeAreaView` da rota reservava somente `bottom`. CORREÇÃO: usar `edges={["top", "bottom"]}`. COMO EVITAR: telas full-screen fora da tab bar, com cabeçalho desenhado no próprio conteúdo, devem reservar explicitamente o inset superior; não assumir que o Stack criará um header visível.
