---
id: d93a52e1-888e-4187-bee1-a09a37abaf31
slug: release
type: scar
title: Antes de executar DDL no Supabase, conferir o project ref contra o app
tags: supabase, migration, project-ref, release
provenance: observado
evidence: 2026-08-04: `npx supabase projects list` → linked gisqtmdqppwhonkkorid; apps/mobile/.env e apps/web/.env.local → ujwxvpceqigvyxcqolch; `db query --linked --file ...048...` falhou com relation users does not exist antes de criar tabela
decay: stable
created: 2026-08-04T12:46:54.895256800+00:00
updated: 2026-08-04T12:46:54.895256800+00:00
validated: 2026-08-04T12:46:54.895256800+00:00
links:
---

SINTOMA (2026-08-04): `supabase projects list` marcou `Selenita` (`gisqtmdqppwhonkkorid`) como linked, e a migration 048 foi enviada a esse vínculo; ela falhou antes de criar objetos porque o projeto não tinha `public.users`. DIAGNÓSTICO: o app mobile/web aponta para `ujwxvpceqigvyxcqolch`, enquanto a conta Supabase autenticada não possui acesso a esse projeto. CORREÇÃO: interromper o release, confirmar o project ref a partir de `EXPO_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` e exigir vínculo/autorização ao ref correto antes de qualquer DDL. COMO EVITAR: `linked:true` não prova que o vínculo pertence a este produto; comparar refs e consultar uma tabela canônica antes de aplicar migrations.
