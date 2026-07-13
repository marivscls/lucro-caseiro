---
id: 83e0dbc3-4c4a-4f91-b3c1-a8e4f10d0f91
slug: backend
type: scar
title: Rótulos: seed completo deve usar os mesmos IDs de template da API
tags: rotulos, templates, seed, migracao, compatibilidade
provenance: observado
evidence: apps/api/src/features/labels/labels.domain.ts; apps/api/src/features/labels/labels.usecases.ts; apps/api/src/features/labels/labels.repo.pg.ts; packages/database/src/migrations/032_normalize_label_template_ids.sql; packages/database/src/seeds/seed-full-mariana.sql; 593 testes da API, typecheck e lint executados em 2026-07-13
decay: stable
created: 2026-07-13T21:04:12.342269400+00:00
updated: 2026-07-13T21:04:12.342269400+00:00
validated: 2026-07-13T21:04:12.342269400+00:00
links:
---

SINTOMA (2026-07-13): ao editar e salvar um rótulo completo, a API respondia “Template invalido”, embora a prévia fosse exibida. CAUSA OBSERVADA: `seed-full-mariana.sql` gravava `classic`/`minimal`, enquanto o domínio aceita `classico`/`minimalista`; a prévia escondia a divergência ao usar o estilo clássico como fallback. CORREÇÃO: normalizar aliases legados na leitura e nos casos de uso, persistir o ID canônico ao salvar, migrar linhas existentes e corrigir o seed. COMO EVITAR: seeds que gravam identificadores de domínio devem usar exatamente os IDs canônicos; fallbacks visuais não podem ser tomados como prova de que o valor persistido é válido.
