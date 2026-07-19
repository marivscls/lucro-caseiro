---
id: 707b1f4a-369b-4950-b94f-5f4345afd185
slug: tests
type: scar
title: Fixture mutável não deve compartilhar o mesmo objeto entre campos
tags: fixture, vitest, mutabilidade, rotulos
provenance: observado
evidence: apps/mobile/src/features/labels/nutrition.test.ts
decay: stable
created: 2026-07-19T17:39:20.931321800+00:00
updated: 2026-07-19T17:39:20.931321800+00:00
validated: 2026-07-19T17:39:20.931321800+00:00
links:
---

SINTOMA (2026-07-19): o teste dos limites da lupa frontal acusou gordura saturada alta mesmo após definir 2,9 g/100 ml. A fixture atribuía o mesmo objeto `fullValue` a vários nutrientes; ao alterar sódio, todas as linhas eram mutadas pela referência compartilhada. CORREÇÃO: construir um objeto novo por campo (`fullValue()`). PREVENÇÃO: fixtures que serão ajustadas por cenário devem usar fábricas ou cópias independentes, nunca reutilizar a mesma referência mutável.
