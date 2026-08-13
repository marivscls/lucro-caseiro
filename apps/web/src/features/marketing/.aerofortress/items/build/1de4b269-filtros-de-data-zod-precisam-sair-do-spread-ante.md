---
id: 1de4b269-4239-4059-88c0-22a12befa53c
slug: build
type: scar
title: Filtros de data Zod precisam sair do spread antes da conversão
tags: typescript, zod, express, filtros, datas, typecheck
provenance: observado
evidence: apps/api/src/features/marketing/video-prompt.routes.ts; pnpm --filter @lucro-caseiro/api typecheck em 2026-08-12
decay: stable
created: 2026-08-12T17:03:53.381425200+00:00
updated: 2026-08-12T17:03:53.381425200+00:00
validated: 2026-08-12T17:03:53.381425200+00:00
links:
---

FALHA REAL (2026-08-12): a rota de listagem do Estúdio de Prompts espalhou o objeto validado por Zod, ainda contendo `from`/`to` como strings, e depois tentou sobrescrever essas chaves com `Date`. O TypeScript preservou a união `string | Date` e bloqueou o typecheck da API. CORREÇÃO: desestruturar `from` e `to` antes do spread, espalhar somente os filtros restantes e então adicionar as datas convertidas condicionalmente. COMO EVITAR: em adapters HTTP, remova campos cujo tipo muda antes de montar o DTO interno; não confie que um spread posterior estreitará o tipo.
