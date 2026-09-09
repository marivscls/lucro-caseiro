---
id: 04ce4542-f162-4724-bcd0-e26338cba69a
slug: releases
type: fact
title: Orientação contextual e primeiro valor publicada no PWA/API
tags: release, guidance, pwa, api, android, railway, eas
provenance: observado
evidence: commits 0dc946e e 2074d8e; Railway deployments 06738605-bdb8-4b02-8718-a61347d6285c e 142f2343-cc16-48d0-8252-c5a0ba0801e8; EAS build 2a9d2917-74ac-4c4a-b81c-3cf7a5f67810; validações HTTP em 2026-09-08
decay: seasonal
created: 2026-09-08T13:49:41.008558100+00:00
updated: 2026-09-08T13:49:41.008558100+00:00
validated: 2026-09-08T13:49:41.008558100+00:00
links:
---

Em 2026-09-08, a entrega de orientação contextual e primeiro valor foi publicada na main. O commit funcional é `0dc946e416857320241d401b512a9cf20f0a5a60`; o release Android elevou o versionCode para 29 em `2074d8e7e0f5e8f42830945f77335d0af5f76ef8`. Railway concluiu SUCCESS para `@lucro-caseiro/api` no primeiro commit e `@lucro-caseiro/mobile` no segundo. A produção foi comprovada por HTTP 200 no health da API, pelo novo status do renderer em catalogo.lucrocaseiro.com.br e pelo marcador `Como usar esta tela` no bundle servido em app.lucrocaseiro.com.br. O AAB EAS 29 foi criado como job `2a9d2917-74ac-4c4a-b81c-3cf7a5f67810`; a submissão automática à Play não foi criada porque falta Google Service Account Key configurada para modo não interativo.
