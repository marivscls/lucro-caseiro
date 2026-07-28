---
id: 87538157-a73e-4e2c-8d98-528401f6ecfd
slug: build
type: scar
title: Novo ai.context precisa nascer completo antes do prepush
tags: prepush, context-lint, mobile, documentation
provenance: observado
evidence: apps/mobile/src/features/services/ai.context.mobile.md; apps/mobile/src/features/subscription/ai.context.mobile.md; pnpm prepush (2026-07-28)
decay: stable
created: 2026-07-28T21:39:08.648566+00:00
updated: 2026-07-28T21:39:08.648566+00:00
validated: 2026-07-28T21:39:08.648566+00:00
links:
---

SINTOMA (2026-07-28): `pnpm prepush` passou por lint, typecheck e todos os testes, mas falhou no `context:lint` porque o novo `features/services/ai.context.mobile.md` não tinha as seções obrigatórias (`Components`, `Hooks`, `Contracts`, `Error Handling`, `Performance`, `Examples`) e o contexto de assinatura ainda continha a palavra reservada `placeholder`. COMO EVITAR: ao criar ou alterar um `ai.context.*.md`, usar imediatamente a estrutura completa exigida pelo validador e remover marcadores TODO/PLACEHOLDER antes da validação final; sempre rodar `pnpm context:lint` ou o `pnpm prepush` completo antes de publicar.
