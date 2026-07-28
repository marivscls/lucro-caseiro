---
id: a1c4e902-7b1e-4c2a-9f0d-3e8a5b6c1d20
slug: ui
type: scar
title: Shell desktop é o único dono do gutter horizontal
tags: desktop, padding, gutter, responsividade, todas-as-rotas, padronizacao
provenance: dito
evidence: Padronização 2026-07-26; DesktopShell paddingHorizontal spacing 3xl (32px); pageGutter em desktop-density; ScreenHeader e telas autenticadas zeradas no desktop; colunas 760/840/900 removidas de páginas
decay: stable
created: 2026-07-26T04:10:00.000000000+00:00
updated: 2026-07-26T04:10:00.000000000+00:00
validated: 2026-07-26T04:10:00.000000000+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): telas autenticadas no desktop (≥1024 px) tinham padding horizontal empilhado (shell + página) e colunas estreitas (ex.: Precificação 760 px), parecendo layout mobile. REGRA CANÔNICA: o DesktopShell é o único dono do gutter horizontal (`spacing["3xl"]` ≈ 2rem / 32 px); páginas usam `pageGutter(isDesktop)` (0 no desktop) e `desktopStretch` (alinhado à esquerda, maxWidth zona de dados 1280). ScreenHeader também zera `paddingHorizontal` no desktop. `desktopContained` permanece só em auth/onboarding/modais — nunca no chrome de páginas autenticadas (ver scar stretch/precificação). Modais e paywalls mantêm maxWidth próprio. COMO EVITAR: não reintroduzir `paddingHorizontal: spacing.lg|xl` em containers externos de página no desktop; não centralizar a página inteira com `desktopContained`.
