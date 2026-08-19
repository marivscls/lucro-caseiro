---
id: 8ab016e0-436c-4275-af62-aee6c2d46ead
slug: testes
type: scar
title: Callback de act sem await não deve ser async
tags: vitest, testing-library, lint
provenance: observado
evidence: apps/mobile/src/features/suppliers/components/supplier-form.test.tsx
decay: stable
created: 2026-08-19T01:21:04.164550300+00:00
updated: 2026-08-19T01:21:04.164550300+00:00
validated: 2026-08-19T01:21:04.164550300+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): o lint do teste de upload de SupplierForm falhou em `@typescript-eslint/require-await` porque `act(async () => fireEvent.click(...))` não continha nenhum `await`. CORREÇÃO: usar `act(() => fireEvent.click(...))` e aguardar a atualização assíncrona pelo `screen.findBy...` fora do callback. COMO EVITAR: marcar callbacks de `act` como `async` apenas quando o próprio callback realmente aguarda uma Promise.
