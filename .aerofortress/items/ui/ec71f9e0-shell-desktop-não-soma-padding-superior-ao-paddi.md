---
id: ec71f9e0-4e6e-450e-91f5-94283910c489
slug: ui
type: scar
title: Shell desktop não soma padding superior ao padding das páginas
tags: desktop, spacing, layout, padding
provenance: dito
evidence: apps/mobile/src/shared/components/desktop-shell.tsx; pnpm --filter @lucro-caseiro/mobile typecheck; pnpm --filter @lucro-caseiro/mobile lint; pnpm --filter @lucro-caseiro/mobile build:pwa:revenda; http://localhost:8086 retornou HTTP 200
decay: stable
created: 2026-08-14T16:24:11.041871900+00:00
updated: 2026-08-14T16:24:11.041871900+00:00
validated: 2026-08-14T16:24:11.041871900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): nas páginas da versão computador, o respiro superior parecia aproximadamente o dobro do gutter horizontal. CAUSA: o `DesktopShell` aplicava `paddingTop: spacing["3xl"]` (32 px) e as próprias páginas já aplicavam seu padding vertical (`spacing.md`/`xl`), enquanto no eixo horizontal `pageGutter(isDesktop)` zera o padding da página e deixa somente o shell como dono dos 32 px. CORREÇÃO: o shell desktop deve possuir apenas o gutter horizontal; o ritmo vertical fica sob responsabilidade de cada página. Remover o `paddingTop` global evita a soma em todas as rotas sem alterar o mobile.
