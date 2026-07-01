---
id: 463cf176-63ad-47ee-aa7f-a70445ca43c4
slug: scripts
type: fact
title: Servidores locais de desenvolvimento
tags:
provenance: observado
evidence: package.json; apps/api/package.json; apps/mobile/package.json; apps/api/.env
decay: seasonal
created: 2026-06-28T22:40:31.781035700+00:00
updated: 2026-06-28T22:40:31.781035700+00:00
validated: 2026-06-28T22:40:31.781035700+00:00
links:
---

O dev server raiz roda `pnpm dev`, que dispara `turbo run dev`. A API local usa `API_PORT=3001` e o script `apps/api` é `tsx watch --env-file=.env src/main.ts`, então a URL local da API é `http://localhost:3001`. O app mobile/Expo tem script `expo start --port 8082`, então o servidor Expo local é `http://localhost:8082`. Observação: `apps/mobile/.env` atualmente aponta `EXPO_PUBLIC_API_URL` para a API de produção, não para a API local.
