---
id: 25c92ebd-df83-46a1-9fe8-c84f504ff1fe
slug: build
type: scar
title: Mocks em assertions devem usar a referência da função, não o método da interface
tags: vitest, eslint, unbound-method, mocks
provenance: observado
evidence: apps/api/src/features/analytics/analytics.usecases.test.ts; apps/mobile/src/features/analytics/installation.test.ts; lint API/mobile aprovado em 2026-07-13
decay: stable
created: 2026-07-14T02:15:01.884996+00:00
updated: 2026-07-14T02:15:01.884996+00:00
validated: 2026-07-14T02:15:01.884996+00:00
links:
---

SINTOMA (2026-07-13): o lint falhou com `@typescript-eslint/unbound-method` nos novos testes de analytics ao fazer assertions como `expect(repo.recordOpen)` e `expect(storage.setItem)`. CORREÇÃO: guardar o `vi.fn()` em variável própria, injetá-la no objeto e fazer a assertion nessa referência. COMO EVITAR: em testes Vitest de interfaces com métodos, capture o mock em uma constante antes de montar o fake; não separe o método tipado do objeto dentro do `expect`.
