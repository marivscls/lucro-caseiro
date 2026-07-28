---
id: 3a23baac-af1f-4310-b97f-8c6723e88102
slug: ui
type: scar
title: FieldLabel aceita uma única string, não texto JSX fragmentado
tags: typescript, react-native, forms, pricing
provenance: observado
evidence: apps/mobile/src/features/pricing/components/pricing-calculator.tsx; typecheck falhou em 635/711/782/815 e passou após a correção em 2026-07-25
decay: stable
created: 2026-07-25T15:07:44.683142700+00:00
updated: 2026-07-25T15:07:44.683142700+00:00
validated: 2026-07-25T15:07:44.683142700+00:00
links:
---

SINTOMA OBSERVADO (2026-07-25): ao contextualizar os rótulos da calculadora de preço, o typecheck falhou com TS2322 porque `FieldLabel` declara `children: string`, mas a interpolação foi escrita como vários nós JSX (`string[]`).

CORREÇÃO: montar todo rótulo dinâmico como uma única template string antes de passá-lo a `FieldLabel`.

PREVENÇÃO: ao personalizar texto em componentes tipados com `children: string`, usar `{`template string`}` ou uma variável string; não intercalar texto literal e expressões como filhos separados. Validar com `pnpm --filter @lucro-caseiro/mobile typecheck`.
