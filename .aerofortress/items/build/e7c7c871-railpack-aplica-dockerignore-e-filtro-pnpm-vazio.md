---
id: e7c7c871-4642-4d4c-8379-389b33ae6b3d
slug: build
type: scar
title: Railpack aplica .dockerignore e filtro pnpm vazio pode publicar container sem app
tags: railway, railpack, dockerignore, pnpm, pwa, deploy, 502
provenance: observado
evidence: .dockerignore; scripts/railway-service.mjs; Railway deployment 3a9329c7-aa0f-4033-ab9f-a7a8abd4ba4e; logs e HTTP 502 observados em 2026-08-13
decay: stable
created: 2026-08-13T16:31:44.303548300+00:00
updated: 2026-08-13T16:31:44.303548300+00:00
validated: 2026-08-13T16:31:44.303548300+00:00
links:
---

SINTOMA (2026-08-13): após push em main, o serviço Railway `@lucro-caseiro/mobile` ficou `Completed` e `app.lucrocaseiro.com.br` respondeu 502 / “Application failed to respond”. Os logs mostraram `Found .dockerignore file, applying filters`, `No projects matched the filters in "/app"` tanto no build quanto no start. CAUSA: `.dockerignore` excluía `apps/mobile` e `packages/ui`; além disso, `pnpm --filter <serviço> <script>` retornava sucesso quando nenhum projeto correspondia, então a imagem vazia foi aceita. CORREÇÃO: não excluir pacotes usados pelos serviços Railway no `.dockerignore` compartilhado e executar o despachante com `--fail-if-no-match`. PREVENÇÃO: validar o domínio HTTP real após deploy e tratar serviço `Completed` como falha para servidores persistentes.
