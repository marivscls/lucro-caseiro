---
id: 4192ebbb-6ef7-481e-ae2d-d6578edffd65
slug: video
type: scar
title: Render completo do Remotion não pode usar timeout de sondagem
tags: remotion, render, timeout, epipe
provenance: observado
evidence: apps/promo-video/package.json; comando `pnpm --dir apps/promo-video render:play-store` em 2026-07-31
decay: stable
created: 2026-07-31T16:57:19.491001400+00:00
updated: 2026-07-31T16:57:19.491001400+00:00
validated: 2026-07-31T16:57:19.491001400+00:00
links: []
---

SINTOMA (2026-07-31): `pnpm --dir apps/promo-video render:play-store` foi iniciado com timeout de 1 segundo; o processo perdeu o pipe de saída e encerrou com `EPIPE` durante o bundle. CAUSA: um render completo e verboso foi tratado como uma sondagem rápida. CORREÇÃO: executar renders finais do Remotion com timeout suficiente para toda a exportação (neste projeto, pelo menos 120 segundos) e usar render de still para validações rápidas. COMO EVITAR: nunca usar timeout curto para iniciar um render que precisa sobreviver ao retorno da ferramenta.
