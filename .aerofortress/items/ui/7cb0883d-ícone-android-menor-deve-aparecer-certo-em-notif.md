---
id: 7cb0883d-9228-4ad4-aec9-7dcf0758f957
slug: ui
type: scar
title: Ícone Android menor deve aparecer certo em notificações e ao minimizar o app
tags: android, adaptive-icon, notification, recent-apps, branding
provenance: dito
evidence: apps/mobile/assets/adaptive-icon.png; apps/mobile/app.config.ts; apps/mobile/app.json; validações desta sessão: Expo config resolveu #FAF5F2, typecheck passou e prévias 32/48 px foram inspecionadas
decay: stable
created: 2026-08-16T19:09:53.601872+00:00
updated: 2026-08-16T19:16:47.629960700+00:00
validated: 2026-08-16T19:16:47.629960700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): o ajuste de escala da logo não se limita às notificações; deve valer também para a representação do aplicativo quando ele é minimizado no Android. Implementação canônica confirmada: `apps/mobile/assets/adaptive-icon.png` é um foreground ARGB transparente 1024×1024, com o monograma original reduzido a 75% e centralizado em 511,5/511,5; o fundo claro `#FAF5F2` é definido tanto no `app.json` quanto na fonte efetiva `app.config.ts`. `icon.png` e `notification-icon.png` permanecem inalterados. Ao mudar esse ícone, validar o config resolvido do Expo e prévias circulares em tamanhos pequenos, além de gerar um novo APK para aceite no Android.
