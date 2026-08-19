---
id: cd6ee411-9b94-442c-89f5-c644706d17d3
slug: ui
type: scar
title: Imagem decorativa sem eventos usa wrapper View no React Native
tags: react-native, typescript, image, pointer-events, serviços
provenance: observado
evidence: apps/mobile/src/app/services.tsx; pnpm --filter @lucro-caseiro/mobile typecheck em 2026-08-16
decay: stable
created: 2026-08-16T23:06:58.581178800+00:00
updated: 2026-08-16T23:06:58.581178800+00:00
validated: 2026-08-16T23:06:58.581178800+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): `pointerEvents="none"` foi aplicado diretamente a `Image` no hero de Serviços; o React Native 0.81 não declara essa prop em `ImageProps`, e o typecheck falhou. CORREÇÃO: posicionar uma `View` decorativa absoluta com `pointerEvents="none"` e renderizar o `Image` acessível=false dentro dela. COMO EVITAR: quando uma imagem decorativa precisar ignorar eventos, colocar a responsabilidade de interação no contêiner `View`, preservando a imagem apenas como conteúdo visual.
