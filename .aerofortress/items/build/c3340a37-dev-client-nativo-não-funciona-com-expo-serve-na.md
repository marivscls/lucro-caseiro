---
id: c3340a37-12f1-4dc2-b601-2b004154e9ab
slug: build
type: scar
title: Dev client nativo não funciona com expo serve na porta do Metro
tags: expo, metro, dev-client, android, pwa, porta-8083
provenance: observado
evidence: Processos e endpoints observados em 2026-07-18: 8083 PID 19280 `expo serve`; substituído por PID 19832 `expo start --dev-client --port 8083 --lan --clear`; `/status` respondeu `packager-status:running` e launchAsset Android HTTP 200 (13.526.764 bytes).
decay: stable
created: 2026-07-18T20:41:43.301414700+00:00
updated: 2026-07-18T20:41:43.301414700+00:00
validated: 2026-07-18T20:41:43.301414700+00:00
links:
---

SINTOMA (2026-07-18): o development build Android abriu `Unable to load script`; a porta canônica 8083 estava ocupada por `expo serve` (preview estático do PWA), enquanto o único Metro ativo era do projeto Lunoa na 8081. CORREÇÃO: encerrar somente o `expo serve` do Lucro Caseiro e iniciar, em `apps/mobile`, `expo start --dev-client --port 8083 --lan`; validar `/status`, o manifesto Android e a `launchAsset.url`. COMO EVITAR: antes de testar o APK, confirmar pelo CommandLine do PID que 8083 pertence ao Metro do Lucro Caseiro; `expo serve` e `expo start` não são intercambiáveis.
