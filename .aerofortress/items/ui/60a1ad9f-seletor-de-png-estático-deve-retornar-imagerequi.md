---
id: 60a1ad9f-f214-4291-ade3-07538567caac
slug: ui
type: scar
title: Seletor de PNG estático deve retornar ImageRequireSource
tags: react-native, assets, lint, branding
provenance: observado
evidence: apps/mobile/src/shared/brand-illustrations.ts; `pnpm --filter @lucro-caseiro/mobile lint` aprovado em 2026-08-14
decay: stable
created: 2026-08-14T15:29:13.006479800+00:00
updated: 2026-08-14T15:29:13.006479800+00:00
validated: 2026-08-14T15:29:13.006479800+00:00
links:
---

SINTOMA (2026-08-14): o lint `sonarjs/function-return-type` rejeitou o hook de ilustrações por marca quando o retorno foi declarado como `ImageSourcePropType`, pois esse tipo é uma união ampla e o analisador inferiu retornos variáveis. CORREÇÃO: para imports estáticos de PNG resolvidos pelo Metro, tipar os mapas e o hook concretamente como `ImageRequireSource`. Isso mantém o seletor centralizado e satisfaz TypeScript e ESLint.
