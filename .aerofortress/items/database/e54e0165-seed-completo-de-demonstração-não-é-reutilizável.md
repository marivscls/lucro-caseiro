---
id: e54e0165-cf5f-439b-8e50-ace5fe73eb18
slug: database
type: scar
title: Seed completo de demonstração não é reutilizável sem slug de catálogo único
tags: seed, postgresql, catalog, screenshots, unique-constraint
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql:328-329; execução Railway/Supabase em 2026-07-20 retornou catalog_settings_slug_key
decay: stable
created: 2026-07-20T13:02:55.727160+00:00
updated: 2026-07-20T13:02:55.727160+00:00
validated: 2026-07-20T13:02:55.727160+00:00
links:
---

SINTOMA (2026-07-20): ao reaplicar `seed-full-mariana.sql` em uma conta temporária de screenshots, o bloco falhou em `catalog_settings_slug_key` porque o seed fixa `mariana-vasconcelos-demo`, embora troque o e-mail-alvo. CORREÇÃO usada: substituir também o slug por um valor único da conta antes de executar. COMO EVITAR: qualquer execução do seed em outra conta deve parametrizar e-mail e slug juntos; não reutilizar o slug canônico da Mariana.
