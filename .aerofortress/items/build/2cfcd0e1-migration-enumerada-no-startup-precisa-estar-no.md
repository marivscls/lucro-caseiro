---
id: 2cfcd0e1-4f24-4aa2-96ce-748b83752eb8
slug: build
type: scar
title: Migration enumerada no startup precisa estar no commit do deploy
tags: railway, migration, deploy, startup, enoent
provenance: observado
evidence: apps/api/src/security-migrations.ts; Railway logs do deploy ff9aa6b2; correção em commit subsequente
decay: stable
created: 2026-08-18T21:07:37.523938500+00:00
updated: 2026-08-18T21:07:37.523938500+00:00
validated: 2026-08-18T21:07:37.523938500+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): o deploy da API na Railway entrou em `Crashed` porque `security-migrations.ts` enumerava migrations 056/057/058, mas esses SQL estavam fora do commit; o build TypeScript passou e a falha só apareceu no startup com `ENOENT`. Antes de publicar qualquer alteração em `securityMigrationFiles`, confirmar com `git ls-files` que cada caminho enumerado está rastreado e incluído no commit; validar o deploy pelo JSON/health e pelos logs da Railway, pois build verde não cobre leitura runtime dos arquivos.
