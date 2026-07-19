---
id: 1a6d62f1-6009-48c4-87f7-a5f2972ffed4
slug: build
type: scar
title: PWA não deve copiar fonte Ionicons depois da migração para Lucide
tags: pwa, expo, ionicons, lucide, pnpm, build
provenance: observado
evidence: apps/mobile/scripts/generate-pwa-service-worker.mjs; build:pwa:caseiro e build:pwa:papelaria concluídos em 2026-07-19
decay: stable
created: 2026-07-19T04:10:20.475323800+00:00
updated: 2026-07-19T04:10:20.475323800+00:00
validated: 2026-07-19T04:10:20.475323800+00:00
links:
---

SINTOMA (2026-07-19): o export Expo terminava, mas `build:pwa:caseiro` falhava ao copiar `@expo/vector-icons/.../Fonts/Ionicons.ttf`, caminho que já não existia na instalação pnpm. CAUSA: o gerador de service worker ainda mantinha uma correção antiga para Ionicons, embora o app já use o componente `AppIcon` baseado em Lucide e não importe Ionicons. CORREÇÃO: remover a cópia, a reescrita do bundle e a entrada `ionicons.ttf` do app shell. COMO EVITAR: quando uma dependência visual for substituída, remover também os pós-processamentos de build que conhecem sua estrutura interna; nunca depender de caminhos físicos dentro de `node_modules`.
