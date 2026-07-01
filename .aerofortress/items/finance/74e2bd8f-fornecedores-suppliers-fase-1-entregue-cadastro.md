---
id: 74e2bd8f-251b-403e-affe-bc661e141655
slug: finance
type: decision
title: Fornecedores (suppliers) — Fase 1 entregue: cadastro CRUD + limite freemium
tags: fornecedores, suppliers, freemium, fase-1, migration-020
provenance: observado
evidence: apps/api/src/features/suppliers/, packages/database/src/migrations/020_suppliers.sql, apps/mobile/src/features/suppliers/
decay: stable
created: 2026-06-25T13:09:50.733475300+00:00
updated: 2026-06-25T13:09:50.733475300+00:00
validated: 2026-06-25T13:09:50.733475300+00:00
links: 
---

Implementada a **Fase 1** da feature Fornecedores (decisão em [[virada-de-posicionamento]]): cadastro próprio (entidade), sem vínculo/compras ainda.

**Entregue:**

- DB: tabela `suppliers` (name obrigatório; phone/email/address/notes opcionais), migration `020_suppliers.sql`, índices `(user_id)` e `(user_id, name)`. **A migration 020 precisa ser rodada manualmente no Supabase** (convenção do projeto — ver [[pending-sql-migrations]]).
- Contracts: `packages/contracts/src/schemas/supplier.ts` (CreateSupplierDto/UpdateSupplierDto/SupplierDto).
- API: vertical slice `apps/api/src/features/suppliers/` (routes→usecases→repo→domain + testes + ai.context.api.md), montada em `main.ts` com `freemiumGuard(subscriptionRepo, "suppliers")`.
- Freemium: novo recurso `suppliers`, **limite 3 no free / ilimitado no Premium**. Tocou subscription.domain/types/repo, contracts/subscription.ts, e no mobile limit-copy.ts, use-limit-check.ts, limit-banner.tsx, plans.tsx.
- Mobile: feature `apps/mobile/src/features/suppliers/` (api, hooks, lista, card, create/edit form, detalhe), tela `/suppliers`, item no menu "Mais". Helper novo `shared/utils/email.ts` (isValidEmail linear — regex com backtracking quebra o lint sonarjs/slow-regex).

**Gates:** typecheck, 513 testes API + 234 mobile, lint do código novo, context:lint — todos verdes. (prepush = lint+typecheck+test+sherif+context:lint; knip só no CI.)

**Faltam Fase 2** (vincular supplierId em materials/packaging + SupplierSelector) **e Fase 3** (purchases → contas a pagar no finance, espelhando `createFromSale`).
