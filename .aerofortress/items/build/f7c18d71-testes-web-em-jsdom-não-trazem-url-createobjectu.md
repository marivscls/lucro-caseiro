---
id: f7c18d71-0aea-4220-a713-4d6759013523
slug: build
type: scar
title: Testes web em jsdom não trazem URL.createObjectURL e misturam tipos de timer
tags: vitest, jsdom, web, blob, typescript
provenance: observado
evidence: apps/mobile/src/shared/utils/export-html.web.test.ts; typecheck e teste específico aprovados em 2026-07-16
decay: stable
created: 2026-07-17T00:49:55.719698300+00:00
updated: 2026-07-17T00:49:55.719698300+00:00
validated: 2026-07-17T00:49:55.719698300+00:00
links:
---

SINTOMA (2026-07-16): o novo teste de exportação web falhou primeiro no typecheck porque `window.setTimeout` foi inferido como `Timeout` no ambiente misto e depois no Vitest porque jsdom não implementa `URL.createObjectURL`. CORREÇÃO: tipar o retorno mockado com `ReturnType<typeof window.setTimeout>` e definir/remover explicitamente `URL.createObjectURL` e `URL.revokeObjectURL` no ciclo do teste. COMO EVITAR: testes de APIs de download/impressão do navegador devem instalar apenas os polyfills mínimos que jsdom não fornece e limpá-los ao final.
