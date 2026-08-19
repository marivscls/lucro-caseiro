---
id: e05ad890-3c4b-408c-b7a3-625dee0159e7
slug: ui
type: scar
title: Image decorativa direta no React Native não aceita pointerEvents como prop
tags: react-native, catalogo, typecheck
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; `pnpm --filter @lucro-caseiro/mobile typecheck` falhou em src/app/catalog.tsx(211,9) e passou após remover pointerEvents
decay: stable
created: 2026-08-17T01:23:24.304602+00:00
updated: 2026-08-17T01:23:24.304602+00:00
validated: 2026-08-17T01:23:24.304602+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): ao trocar o wrapper da arte do hero do Catálogo por um único `Image`, manter `pointerEvents="none"` no componente quebrou o typecheck porque `ImageProps` do React Native 0.81 não declara essa prop. Para imagens decorativas diretas, omitir a prop (com `accessible={false}`) ou manter um wrapper `View` somente quando a supressão de eventos for realmente necessária.
