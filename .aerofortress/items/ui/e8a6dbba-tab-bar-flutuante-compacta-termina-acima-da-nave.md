---
id: e8a6dbba-b007-45e5-9e00-5b051a61409e
slug: ui
type: decision
title: Tab bar flutuante compacta termina acima da navegação do sistema
tags: tab-bar, android, safe-area, bottom-inset, layout
provenance: observado
evidence: apps/mobile/src/app/tabs/_layout.tsx; captura Android enviada pela usuária em 2026-07-25; ESLint direcionado e typecheck mobile aprovados
decay: stable
created: 2026-07-10T16:15:36.056705700+00:00
updated: 2026-07-26T02:28:09.491226200+00:00
validated: 2026-07-26T02:28:09.491226200+00:00
links:
---

A navegação inferior flutuante mantém superfície elevada, insets laterais simétricos e conteúdo compacto. No Android, o inset inferior é usado como POSIÇÃO (`bottom: insets.bottom + 8`), não somado à altura nem ao padding: a barra tem 64 px e termina acima da navegação do sistema. No iOS, permanece com 88 px e afastamento inferior de 4 px. Essa separação evita que a superfície branca cresça ou seja desenhada por trás da barra de navegação do aparelho.
