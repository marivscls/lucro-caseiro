---
id: 8f8a4bf0-7e5d-4d50-8f37-2fbc1372e2c1
slug: build
type: scar
title: remotion add no Windows pode exigir npm.cmd explícito
tags: remotion, windows, npm, dependência, build
provenance: observado
evidence: apps/promo-video/package.json; instalação observada em 2026-08-12
decay: stable
created: 2026-08-12T15:36:52.801792800+00:00
updated: 2026-08-12T15:36:52.801792800+00:00
validated: 2026-08-12T15:36:52.801792800+00:00
links:
---

FALHA REAL (2026-08-12): `npx remotion add @remotion/captions` encontrou o helper, mas ele tentou `spawn npm` e falhou com ENOENT no Windows, apesar de `npm.cmd` existir. CORREÇÃO: executar diretamente `C:\Program Files\nodejs\npm.cmd install --save-exact --no-fund --no-audit @remotion/captions@<mesma-versão-do-remotion>`, preservando o alinhamento exato das versões. COMO EVITAR: se o helper Remotion falhar ao resolver npm no Windows, localizar `npm.cmd` com Get-Command e chamar o executável explicitamente.
