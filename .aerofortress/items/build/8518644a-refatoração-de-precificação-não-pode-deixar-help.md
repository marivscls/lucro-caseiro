---
id: 8518644a-b0c7-4605-8b78-e8776f154a35
slug: build
type: scar
title: Refatoração de Precificação não pode deixar helper órfão
tags: lint, pricing, unused-code
provenance: observado
evidence: apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; `pnpm --filter @lucro-caseiro/mobile lint` em 2026-07-25
decay: stable
created: 2026-07-26T02:16:04.574421200+00:00
updated: 2026-07-26T02:16:04.574421200+00:00
validated: 2026-07-26T02:16:04.574421200+00:00
links:
---

SINTOMA (2026-07-25): o lint completo do mobile falhou com `@typescript-eslint/no-unused-vars` porque `simple-pricing-calculator.tsx` manteve o helper `capitalize` depois que seus usos foram removidos. CORREÇÃO: remover o helper órfão. PREVENÇÃO: ao substituir uma transformação de texto durante refatorações, buscar o nome do helper no arquivo e remover a declaração quando não houver callers; fechar a alteração com o lint completo do app.
