---
id: 248f559a-4f79-4a59-8c9d-c2281f2c3c3e
slug: design
type: decision
title: Catálogo administrativo — geometria responsiva validada
tags: catalogo, ui, responsividade, pwa
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; .aerofortress/catalog-measurements-852x1838.json; .aerofortress/catalog-comparison-852x1838.png
decay: seasonal
created: 2026-08-17T02:57:32.855360600+00:00
updated: 2026-08-17T02:57:32.855360600+00:00
validated: 2026-08-17T02:57:32.855360600+00:00
links:
---

A tela administrativa Catálogo usa como validação visual principal 852×1838, sem sidebar e com navbar móvel. Medido após o ajuste de 2026-08-16: conteúdo 800 px em x=26; hero 800×367 em y=132; arte PNG única 420 px, top relativo −42 e right 12, com o hero como offsetParent; card branco 776×392 em x=38/y=441, sobrepondo o hero em 58 px. Em desktop (>=1024), o conteúdo é centralizado na área após a sidebar e limitado a 960 px; em 1440 e 3072 px a medição confirmou 960 px. O catálogo público /c/:slug e o renderer SSR não fazem parte desta implementação.
