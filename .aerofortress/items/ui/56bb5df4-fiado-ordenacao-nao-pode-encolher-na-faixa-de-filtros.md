---
id: 56bb5df4-ee25-4804-869c-77742fdae4d2
slug: ui
type: scar
title: Fiado: ordenação não pode encolher na faixa de filtros
tags: fiado, pwa, filtros, ordenacao, responsividade, react-native-web
provenance: dito
evidence: Captura e correção da usuária em 2026-08-16; apps/mobile/src/app/fiado.tsx
decay: stable
created: 2026-08-16T16:21:04.9323180-03:00
updated: 2026-08-16T16:21:04.9323180-03:00
validated: 2026-08-16T16:21:04.9323180-03:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): no PWA da tela Fiado, o controle `Mais antigos` aparecia esmagado no fim da faixa horizontal de filtros. CORREÇÃO CANÔNICA: o botão de ordenação usa largura intrínseca com `flexShrink: 0`, rótulo em uma linha e padding equivalente aos controles vizinhos; os chips e os gaps permanecem compactos para aproveitar a largura mobile sem reduzir a área de toque de 44 px. COMO EVITAR: em faixas horizontais do React Native Web, validar também o último controle e declarar explicitamente que ações com rótulo não podem encolher.
