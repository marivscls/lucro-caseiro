---
id: 9399f302-2896-41bb-9b8d-ef246d00df96
slug: database
type: scar
title: Seed PostgreSQL: CASE destinado a coluna enum precisa de cast explícito
tags: postgresql, enum, case, seed, sql
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql; erro Supabase 42804 relatado pela usuária em 2026-07-12
decay: stable
created: 2026-07-13T02:07:43.138679300+00:00
updated: 2026-07-13T02:07:43.138679300+00:00
validated: 2026-07-13T02:07:43.138679300+00:00
links: 
---

Falha real no `seed-full-mariana.sql`: PostgreSQL 42804 ao inserir em `purchases.category` (`expense_category`), porque `CASE WHEN ... THEN 'packaging' ELSE 'material' END` foi inferido como `text`. Correção: envolver o CASE e converter explicitamente para o enum: `(CASE ... END)::expense_category`. Ao gerar seeds, toda expressão CASE/array usada em coluna enum deve ser tipada explicitamente; literais simples podem ter coerção contextual, CASE frequentemente não.
