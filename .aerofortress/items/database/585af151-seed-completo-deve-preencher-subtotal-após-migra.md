---
id: 585af151-dabc-4ff8-896f-8b8062d69254
slug: database
type: scar
title: Seed completo deve preencher subtotal após migração operacional
tags: seed, postgresql, sales, quotes, schema-drift
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql; erro PostgreSQL 23502 e execução confirmada em produção para marivscls@gmail.com em 2026-08-10
decay: stable
created: 2026-08-10T23:38:43.915798+00:00
updated: 2026-08-10T23:38:43.915798+00:00
validated: 2026-08-10T23:38:43.915798+00:00
links:
---

SINTOMA (2026-08-10): `seed-full-mariana.sql` falhou com PostgreSQL 23502 porque `sales.subtotal` passou a ser NOT NULL na migração 043, mas o seed ainda inseria somente `total`. O próximo bloco de orçamentos também omitia `quotes.subtotal`. O bloco DO foi revertido integralmente, comprovado pela consulta que voltou a mostrar 0 registros. CORREÇÃO: vendas agora gravam `subtotal`, `total` e `paid_amount` coerentes com o status; orçamentos gravam `subtotal` e `total` iguais à soma dos itens. PREVENÇÃO: depois de adicionar coluna NOT NULL sem default a uma entidade, revisar e executar contra PostgreSQL real todos os seeds que inserem nessa tabela; typecheck não valida SQL estático.
