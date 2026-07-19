---
id: e3688e9d-799d-433d-aaaf-d49a8b58cdca
slug: tests
type: scar
title: Rótulo derivado de coleção `as const` precisa ser alargado antes da marca
tags: typescript, as-const, typecheck, branding, mobile
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; falha TS2322 observada em `pnpm --filter @lucro-caseiro/mobile typecheck`
decay: stable
created: 2026-07-19T04:54:12.404728900+00:00
updated: 2026-07-19T04:54:12.404728900+00:00
validated: 2026-07-19T04:54:12.404728900+00:00
links:
---

SINTOMA (2026-07-19): o typecheck mobile falhou com TS2322 depois que a transformação dos atalhos da home trocou ternários por `let label = item.label`; como `HOME_SHORTCUT_CATEGORIES` usa `as const`, o TypeScript inferiu `label` como a união fechada dos textos literais e recusou os rótulos dinâmicos da marca. CORREÇÃO: declarar `let label: string = item.label` antes de aplicar os textos de `brand.copy`. COMO EVITAR: ao transformar objetos `as const` com valores que poderão ser substituídos por configuração dinâmica, alargue explicitamente somente a propriedade mutável.
