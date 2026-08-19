---
id: 8ef01252-1851-4325-b6db-85de87aff0d1
slug: backend
type: scar
title: Tabelas novas expostas pelo Supabase precisam nascer com RLS e privilégios revogados
tags: security, supabase, rls, vertical-apps
provenance: observado
evidence: packages/database/src/migrations/056_vertical_apps_foundation.sql
decay: stable
created: 2026-08-14T03:09:44.062029600+00:00
updated: 2026-08-14T03:09:44.062029600+00:00
validated: 2026-08-14T03:09:44.062029600+00:00
links:
---

SINTOMA (2026-08-14): a migração inicial dos apps verticais criou tabelas com `user_id` e a API filtrava corretamente, mas não ativava RLS nem revogava `anon`/`authenticated`, deixando a segurança direta do Supabase incompleta. CORREÇÃO: toda tabela operacional acessada exclusivamente pela API deve nascer com `ENABLE ROW LEVEL SECURITY` e `REVOKE ALL ... FROM anon, authenticated` na mesma migração. Verificar isso antes de aplicar a migração.
