---
id: af8e0cbe-0312-4642-9b3b-24692d001b6d
slug: build
type: scar
title: Schema do pacote database não deve importar contracts sem declarar a dependência
tags: database, contracts, typecheck, jsonb
provenance: observado
evidence: packages/database/src/schema/catalog.ts; apps/api/src/features/catalog/catalog.repo.pg.ts; pnpm typecheck (passou após a correção)
decay: stable
created: 2026-08-18T23:11:49.340219300+00:00
updated: 2026-08-18T23:11:49.340219300+00:00
validated: 2026-08-18T23:11:49.340219300+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): ao tipar diretamente uma coluna JSONB do Drizzle com `StorefrontCustomization` importado de `@lucro-caseiro/contracts`, o typecheck de `@lucro-caseiro/database` falhou porque esse pacote não declara contracts como dependência. Correção: manter o schema físico JSONB sem acoplamento ao DTO e validar/tipar o documento na fronteira do repositório da API com Zod. Antes de importar tipos entre pacotes workspace, confirme a direção e as dependências declaradas.
