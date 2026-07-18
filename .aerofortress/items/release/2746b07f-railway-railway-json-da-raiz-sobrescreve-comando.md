---
id: 2746b07f-f8a1-4bf4-a3bb-121ac693ddbd
slug: release
type: scar
title: Railway: railway.json da raiz sobrescreve comandos dos serviços do monorepo
tags: railway, monorepo, deploy, web
provenance: observado
evidence: railway.json; scripts/railway-service.mjs; deployment web a73941e5-c2d6-4473-a2db-2b9880cafea1
decay: stable
created: 2026-07-14T16:30:42.263527100+00:00
updated: 2026-07-14T16:30:42.263527100+00:00
validated: 2026-07-14T16:30:42.263527100+00:00
links: 
---

SINTOMA (2026-07-14): o novo serviço `@lucro-caseiro/web` iniciou `@lucro-caseiro/api` e falhou por ausência de `DATABASE_URL`, mesmo com build/start do PWA configurados no serviço. CAUSA OBSERVADA: durante o build o Railway carregou `/railway.json`; a configuração como código da raiz prevaleceu sobre os comandos do painel e a tentativa de definir `/apps/web/railway.json` via IaC beta não persistiu corretamente. CORREÇÃO: o `railway.json` raiz chama `scripts/railway-service.mjs`, que despacha build/start pelo `RAILWAY_SERVICE_NAME`; web executa o Next e os demais preservam a API. PREVENÇÃO: ao adicionar outro serviço neste monorepo, atualizar o despachante raiz e validar nos metadados/logs do deployment qual `configFile` e `startCommand` efetivamente foram usados.
