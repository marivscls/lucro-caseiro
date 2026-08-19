---
id: 84c140e1-956c-4456-9c31-6a88456af650
slug: build
type: scar
title: Expo export no Windows pode falhar uma vez com ENOTDIR ao recriar assets
tags: expo, pwa, windows, enotdir, build, metro
provenance: observado
evidence: Execuções observadas de build:pwa:caseiro em 2026-08-18; segunda execução gerou entry-141d9a9dcf1d51f7735281b719011625.js
decay: stable
created: 2026-08-19T01:57:33.735702200+00:00
updated: 2026-08-19T01:57:33.735702200+00:00
validated: 2026-08-19T01:57:33.735702200+00:00
links:
---

FALHA RECUPERADA (2026-08-18): `pnpm --filter @lucro-caseiro/mobile build:pwa:caseiro` concluiu o bundle, mas a primeira exportação falhou com `ENOTDIR: not a directory, mkdir .../dist/lucro-caseiro/assets/src` durante `saveAssets.ts`. A inspeção imediatamente depois mostrou `assets` e `assets/src` como diretórios, e repetir exatamente o mesmo build, sem apagar fontes nem alterar configuração, concluiu a exportação e gerou o PWA. COMO EVITAR: quando esse ENOTDIR transitório aparecer no Expo export do Windows, inspecionar o alvo para confirmar que não há arquivo ocupando o caminho e repetir o build uma vez antes de fazer limpeza destrutiva do `dist` ou mudar scripts.
