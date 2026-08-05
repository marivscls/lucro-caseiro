---
id: c072b9ca-ce11-41d1-988b-69f7ed3d6635
slug: releases
type: fact
title: Serviços completos publicados em produção — 467be48
tags: release, servicos, producao, railway
provenance: observado
evidence: commit 467be48; packages/database/src/migrations/045_service_business_suite.sql; Railway deployments b048477b-7697-439c-9e45-5933dc5aead6 and 250cbf14-e5a8-4c9d-8e77-c2c17e466e45; https://catalogo.lucrocaseiro.com.br/api/v1/health; https://app.lucrocaseiro.com.br
decay: seasonal
created: 2026-07-29T02:52:22.241425800+00:00
updated: 2026-07-29T02:52:22.241425800+00:00
validated: 2026-07-29T02:52:22.241425800+00:00
links:
---

Em 2026-07-28/29, a suíte completa de serviços foi publicada na `main` no commit `467be48f2c63f03d4fcfc2fa281ceae4896d2397` (`feat(services): complete service business suite`). A migração `045_service_business_suite.sql` foi aplicada transacionalmente no Postgres de produção e verificada (`services.is_public`, pacotes, solicitações de agendamento e `paid_amount` presentes). Os deploys Railway da API (`b048477b-7697-439c-9e45-5933dc5aead6`) e do PWA (`250cbf14-e5a8-4c9d-8e77-c2c17e466e45`) terminaram em SUCCESS. Validação pública: health da API 200, nova rota de pacotes protegida respondendo 401, app e service worker 200, bundle contendo o novo painel de serviços.
