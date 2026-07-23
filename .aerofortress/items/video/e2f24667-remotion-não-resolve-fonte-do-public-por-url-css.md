---
id: e2f24667-9d65-454c-9dc1-e2a80aa33a8d
slug: video
type: scar
title: Remotion não resolve fonte do public por URL CSS absoluta
tags: remotion, font-face, webpack, render, assets
provenance: observado
evidence: apps/promo-video/src/index.css; comando `npx remotion still LucroCaseiroPlayStore out/previews/play-store-30.png --frame=30` falhou antes e passou após a correção em 2026-07-23
decay: stable
created: 2026-07-23T12:22:24.525238600+00:00
updated: 2026-07-23T12:22:24.525238600+00:00
validated: 2026-07-23T12:22:24.525238600+00:00
links:
---

SINTOMA (2026-07-23): o lint/typecheck do projeto Remotion passou, mas `remotion still` falhou no bundle com `Can't resolve '/Fraunces-Bold.ttf'` para fontes locais declaradas em `src/index.css`. CAUSA: URLs absolutas como `url('/Fraunces-Bold.ttf')` são tratadas pelo webpack do Remotion como imports a resolver no sistema de arquivos, não como referências ao diretório `public`. CORREÇÃO: em CSS dentro de `src`, apontar para o arquivo real com caminho relativo (`url('../public/Fraunces-Bold.ttf')`); o render de controle passou depois da troca. COMO EVITAR: sempre validar fontes com um `remotion still`, pois lint/typecheck não comprovam que assets CSS entram no bundle.
