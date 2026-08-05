---
id: 4192ebbb-6ef7-481e-ae2d-d6578edffd65
slug: video
type: scar
title: Render completo do Remotion não pode usar timeout de sondagem
tags: remotion, render, timeout, epipe
provenance: observado
evidence: apps/promo-video/package.json; renders `LucroCaseiroPlayStore` de 2026-07-31 e 2026-08-01
decay: stable
created: 2026-07-31T16:57:19.491001400+00:00
updated: 2026-08-01T23:39:03.529536100+00:00
validated: 2026-08-01T23:39:03.529536100+00:00
links:
---

SINTOMA (2026-07-31, repetido em 2026-08-01): um render completo do Remotion iniciado por um comando com timeout curto perdeu o pipe de saída e encerrou com `EPIPE`, apesar de a composição estar correta. CAUSA: o render final e verboso foi tratado como uma sondagem rápida. CORREÇÃO: executar o render em processo oculto em segundo plano com stdout/stderr redirecionados para arquivos, acompanhar processo e logs por sondagens curtas e só validar o MP4 após o processo terminar; alternativamente, usar um timeout que cubra toda a exportação. Neste projeto, `LucroCaseiroPlayStore` tem 810 quadros e leva mais que uma sondagem curta. Use `remotion still` apenas para validações rápidas de quadros. COMO EVITAR: nunca iniciar um render que precisa sobreviver ao retorno da ferramenta dentro de uma chamada com timeout curto.
