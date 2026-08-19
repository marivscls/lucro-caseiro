---
id: 018ff4d8-5e6b-4125-aa1c-0fb92ea29ec8
slug: ui
type: rule
title: Home usa escala tipográfica semântica compacta e localizada
tags: home, tipografia, manrope, acessibilidade, mobile, pwa, tokens
provenance: dito
evidence: packages/ui/src/theme.ts; packages/ui/src/components/typography.tsx; apps/mobile/src/app/tabs/index.tsx; apps/mobile/src/app/tabs/_layout.tsx; apps/mobile/src/app/_layout.tsx; typechecks UI/mobile, lint direcionado, 453 testes e build:pwa:caseiro aprovados em 2026-08-16
decay: stable
created: 2026-08-16T16:42:34.408643800+00:00
updated: 2026-08-16T16:42:34.408643800+00:00
validated: 2026-08-16T16:42:34.408643800+00:00
links:
---

A tela inicial usa uma escala própria centralizada em `homeTypography`, sem redução global: títulos 22/28; texto base 14/20; card de próximo passo 11/15, 17/22 e 14/19; valor financeiro principal 44/50 em bold; métricas 12/16 e 21/26; meta 16/22 e 23/29; atalhos 14/18; navegação 12/16, com ativo em bold. Pesos 500 usam a fonte real Manrope Medium, não `fontWeight` sintético. Áreas de toque permanecem intactas, títulos quebram naturalmente e a tab bar não bloqueia a escala de fonte do sistema.
