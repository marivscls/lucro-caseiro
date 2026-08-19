---
id: fe05d7cd-0183-409f-b778-97704b626408
slug: build
type: scar
title: Refs React modernas não devem usar React.ElementRef
tags: react, lint, focus, accessibility
provenance: observado
evidence: apps/mobile/src/shared/components/fab.tsx; pnpm --filter @lucro-caseiro/mobile lint
decay: stable
created: 2026-08-19T01:35:19.970469800+00:00
updated: 2026-08-19T01:35:19.970469800+00:00
validated: 2026-08-19T01:35:19.970469800+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): ao expor o ref do FAB para restaurar foco após fechar o modal de fornecedor, `React.ElementRef<typeof Pressable>` passou no TypeScript mas o lint falhou em `sonarjs/deprecation`. Neste projeto, tipar a instância nativa com `View` e usar `forwardRef<View, Props>` evita a API deprecated sem perder o foco web nem `findNodeHandle` no mobile. Sempre rodar lint, não apenas typecheck, ao alterar refs React.
