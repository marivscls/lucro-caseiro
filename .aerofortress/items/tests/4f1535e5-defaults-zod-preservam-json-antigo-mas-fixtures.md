---
id: 4f1535e5-b0c9-4c5c-adab-e9cbaebd1e91
slug: tests
type: scar
title: Defaults Zod preservam JSON antigo, mas fixtures tipados precisam do novo output
tags: zod, typescript, contratos, fixtures, typecheck, marketing
provenance: observado
evidence: packages/contracts/src/schemas/marketing.ts; apps/api/src/features/marketing/campaign-ai.eval.ts; `pnpm --filter @lucro-caseiro/api typecheck` reportou TS2739
decay: stable
created: 2026-07-18T23:18:55.486405700+00:00
updated: 2026-07-18T23:18:55.486405700+00:00
validated: 2026-07-18T23:18:55.486405700+00:00
links:
---

SINTOMA (2026-07-18): após adicionar `research` e `creativeStrategy` com `.default({})` ao schema de campanhas, o teste focado passou e JSON legado continuou parseável, mas o typecheck da API falhou em `campaign-ai.eval.ts` porque o fixture construía diretamente o tipo de saída sem os campos novos. CAUSA: defaults Zod tornam o input de parse retrocompatível, porém `z.infer` representa o output já normalizado, onde os campos são obrigatórios. CORREÇÃO: manter o teste de parse legado e atualizar fixtures/objetos TypeScript diretos com o formato canônico completo. COMO EVITAR: ao ampliar um contrato Zod com defaults, validar separadamente compatibilidade de input legado e todos os consumidores que constroem o tipo de output em compile time.
