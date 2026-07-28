---
id: 4d42bec5-3a84-48ea-bbf1-ee4c8ad04dda
slug: ui
type: scar
title: Inset inferior da tab bar não pode aumentar a altura da superfície
tags: tab-bar, android, safe-area, overflow, position-absolute
provenance: observado
evidence: apps/mobile/src/app/tabs/_layout.tsx; captura da usuária em 2026-07-25; `pnpm --filter @lucro-caseiro/mobile exec eslint src/app/tabs/_layout.tsx` e `pnpm --filter @lucro-caseiro/mobile typecheck` aprovados
decay: stable
created: 2026-07-26T02:27:56.491387300+00:00
updated: 2026-07-26T02:27:56.491387300+00:00
validated: 2026-07-26T02:27:56.491387300+00:00
links:
---

SINTOMA (2026-07-25, Android): a superfície branca da tab bar flutuante atravessava a parte inferior e continuava visível por trás da barra cinza de navegação do sistema. CAUSA: `insets.bottom` era somado simultaneamente à `height` e ao `paddingBottom`, fazendo a própria superfície crescer para dentro da área reservada pelo Android. CORREÇÃO: usar o inset como afastamento (`bottom: bottomInset + 8`), manter altura Android própria de 64 px e padding inferior fixo. COMO EVITAR: numa tab bar flutuante absoluta, safe area posiciona a superfície acima do sistema; não deve inflar a altura do card. Validar em captura Android com navegação de três botões e por gestos.
