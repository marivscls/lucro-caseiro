---
id: 463cf176-63ad-47ee-aa7f-a70445ca43c4
slug: scripts
type: fact
title: Servidores locais de desenvolvimento
tags: dev, localhost, expo, api
provenance: observado
evidence: apps/mobile/package.json; processo Expo e Test-NetConnection observados em 2026-07-14; apps/api/package.json; apps/mobile/.env
decay: seasonal
created: 2026-06-28T22:40:31.781035700+00:00
updated: 2026-07-14T12:06:20.860816500+00:00
validated: 2026-07-14T12:06:20.860816500+00:00
links:
---

O dev server raiz roda `pnpm dev`, que dispara `turbo run dev`. A API local usa `API_PORT=3001`, então sua URL local é `http://localhost:3001`. O app mobile/Expo tem script `expo start --port 8083`: no próprio PC, `http://localhost:8083`; no aparelho físico, usar `http://<IP_LAN_DO_PC>:8083`. Em 2026-07-14, o IP Wi‑Fi observado foi `192.168.1.7`. O `apps/mobile/.env` aponta `EXPO_PUBLIC_API_URL` para a API de produção, não para a API local.
