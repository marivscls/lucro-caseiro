---
id: a6f19ff4-14ed-4a8a-9c4f-93fbbc87310e
slug: ui
type: scar
title: PNGs estáticos grandes precisam ser otimizados e pré-carregados na abertura
tags: png, assets, preload, expo, pwa, performance, cache, ui
provenance: observado
evidence: apps/mobile/src/shared/static-image-assets.ts; apps/mobile/src/app/_layout.tsx; export PWA 2026-07-25 listou os assets entre 3,16 kB e 238 kB; 395 testes, typecheck e lint passaram
decay: stable
created: 2026-07-26T00:53:33.732943100+00:00
updated: 2026-07-26T00:53:33.732943100+00:00
validated: 2026-07-26T00:53:33.732943100+00:00
links:
---

FALHA OBSERVADA (2026-07-25): ao abrir várias telas, as ilustrações PNG apareciam depois do restante do conteúdo. CAUSAS CONFIRMADAS: os 37 assets estáticos importados somavam 43,9 MB (arquivos individuais de até 2,5 MB) e o PWA só os colocava no cache quando cada tela os solicitava pela primeira vez. CORREÇÃO: converter os PNGs para paleta otimizada mantendo dimensões e transparência (total 3,54 MB, 91,9% menor) e usar `expo-asset` em `preloadStaticImageAssets()` durante a abertura `BrandIntro`, com fallback de 3 s para nunca bloquear o app. COMO EVITAR: novas ilustrações devem entrar comprimidas e no manifesto de preload; validar o peso exportado, não apenas largura/altura ou aparência local.
