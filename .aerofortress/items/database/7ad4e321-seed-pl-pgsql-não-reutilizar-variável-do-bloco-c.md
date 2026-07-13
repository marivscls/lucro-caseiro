---
id: 7ad4e321-fabe-4464-a1ae-e2e942f1a023
slug: database
type: scar
title: Seed PL/pgSQL: não reutilizar variável do bloco como alias de generate_series
tags: postgresql, plpgsql, seed, sql, generate_series
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql; erro Supabase 42702 relatado pela usuária em 2026-07-12
decay: stable
created: 2026-07-13T01:53:01.559826+00:00
updated: 2026-07-13T01:53:01.559826+00:00
validated: 2026-07-13T01:53:01.559826+00:00
links: 
---

Falha real ao executar `seed-full-mariana.sql`: PostgreSQL 42702 informou que `i` era ambíguo porque existia tanto como variável declarada no bloco `DO` quanto como coluna `g(i)` do `generate_series`. Correção: usar alias próprio e sempre qualificá-lo (`AS g(series_idx)` e `g.series_idx`). Em seeds PL/pgSQL, aliases de consultas devem ter nomes distintos das variáveis do bloco e ser qualificados.
