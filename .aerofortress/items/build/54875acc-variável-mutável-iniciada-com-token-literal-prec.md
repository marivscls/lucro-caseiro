---
id: 54875acc-b333-4be8-9d46-3e0080cf8ef5
slug: build
type: scar
title: Variável mutável iniciada com token literal precisa de tipo amplo
tags: typescript, as-const, inferencia-literal, typecheck, recorrencia
provenance: observado
evidence: apps/mobile/src/features/catalog/components/catalog-customizer.tsx; duas falhas de pnpm typecheck em 2026-08-18, ambas aprovadas após anotações explícitas
decay: stable
created: 2026-08-18T19:46:52.070194+00:00
updated: 2026-08-18T19:53:28.092078+00:00
validated: 2026-08-18T19:53:28.092078+00:00
links:
---

FALHA CORRIGIDA E RECORRENTE (2026-08-18): ao criar `thumbnailBottom` com tokens de spacing, o TypeScript inferiu `16 | 12` e rejeitou 20; pouco depois, `gradientColor` inicializado com `COLORS.wine` foi inferido como apenas `"#4A2332"` e rejeitou `"#160F12"`. CORREÇÃO: declarar explicitamente `thumbnailBottom: number` e `gradientColor: string`. COMO EVITAR: qualquer `let` inicializado com token `as const` que receberá outro valor deve nascer com tipo amplo; revisar isso antes do primeiro typecheck.
