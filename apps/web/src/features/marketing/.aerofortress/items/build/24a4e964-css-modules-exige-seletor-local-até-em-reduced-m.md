---
id: 24a4e964-face-4bed-a150-750132d691ec
slug: build
type: scar
title: CSS Modules exige seletor local até em reduced-motion
tags: nextjs, turbopack, css-modules, reduced-motion, build, acessibilidade
provenance: observado
evidence: apps/web/src/features/marketing/video-prompt-studio.module.css; pnpm --filter @lucro-caseiro/web build em 2026-08-12
decay: stable
created: 2026-08-12T17:05:14.708184+00:00
updated: 2026-08-12T17:05:14.708184+00:00
validated: 2026-08-12T17:05:14.708184+00:00
links:
---

FALHA REAL (2026-08-12): o build Next/Turbopack do Estúdio de Prompts falhou porque o CSS Module usou o seletor global `*` dentro de `@media (prefers-reduced-motion: reduce)`. CSS Modules exige seletor puro com ao menos uma classe ou id local, inclusive dentro de media queries. CORREÇÃO: escopar como `.studio *`, preservando o comportamento de acessibilidade somente na feature. COMO EVITAR: em arquivos `.module.css`, nunca introduzir seletores globais soltos; ancorar resets e preferências numa classe local e confirmar com `next build`, não apenas lint/typecheck.
