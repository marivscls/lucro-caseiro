---
id: ced631fa-6b1b-4f70-bd43-333b5cf6ed77
slug: ui
type: scar
title: Patches em hooks repetidos do onboarding exigem conferir o escopo
tags: onboarding, apply-patch, typecheck, logo
provenance: observado
evidence: apps/mobile/src/app/onboarding.tsx; `pnpm --filter @lucro-caseiro/mobile typecheck` falhou e depois passou em 2026-08-14
decay: stable
created: 2026-08-14T14:38:18.145203500+00:00
updated: 2026-08-14T14:38:18.145203500+00:00
validated: 2026-08-14T14:38:18.145203500+00:00
links:
---

FALHA REAL (2026-08-14): ao restaurar a logo por marca no onboarding, um patch baseado apenas na sequência repetida `useTheme()` + `useBrand()` inseriu `brandLogo` em `StepHeader`, mas o valor era usado em `WelcomeStep`; o typecheck falhou com `Cannot find name 'brandLogo'`. CORREÇÃO: ancorar a alteração pelo nome da função/componente, remover a declaração do cabeçalho e declará-la dentro de `WelcomeStep`. PREVENÇÃO: em arquivos com hooks repetidos, revisar o hunk aplicado ou usar contexto de função antes de rodar typecheck.
