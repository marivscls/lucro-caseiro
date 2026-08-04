---
id: 8e560c43-118f-4ad6-af86-1a0b14724963
slug: build
type: scar
title: Mocks de fetch devem atravessar unknown quando os tipos DOM e undici divergem
tags: typescript, tests, dependencies, security
provenance: observado
evidence: apps/api/src/features/notifications/expo-push.test.ts; pnpm --filter @lucro-caseiro/api typecheck
decay: stable
created: 2026-08-04T12:37:47.603320900+00:00
updated: 2026-08-04T12:37:47.603320900+00:00
validated: 2026-08-04T12:37:47.603320900+00:00
links:
---

SINTOMA (2026-08-04): após atualizar as dependências de segurança, o typecheck da API falhou em `expo-push.test.ts` porque `vi.fn(... Response)` era convertido diretamente para `typeof fetch`, enquanto as declarações DOM e `undici-types` descreviam variantes incompatíveis de `Response`. CORREÇÃO: em mocks deliberadamente compatíveis em runtime, converter por `unknown` antes de `typeof fetch`; não relaxar o tipo de produção nem reverter a atualização de segurança. PREVENÇÃO: executar o typecheck completo depois de overrides transitivos que afetam tipos web.
