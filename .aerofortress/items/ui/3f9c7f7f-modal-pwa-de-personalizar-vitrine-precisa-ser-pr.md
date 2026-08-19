---
id: 3f9c7f7f-0e4c-4ee1-87eb-54bc2f3b6f98
slug: ui
type: scar
title: Modal PWA de Personalizar vitrine precisa ser preso ao viewport
tags: pwa, viewport, barra-fixa, responsividade
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; .aerofortress/catalog-customizer-validation.json
decay: stable
created: 2026-08-17T01:04:24.704673+00:00
updated: 2026-08-17T01:04:24.704673+00:00
validated: 2026-08-17T01:04:24.704673+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): na primeira validação visual, a barra de ações ficava no fim do documento em 320 px porque o conteúdo do Modal web não tinha altura explícita de viewport. CORREÇÃO: no PWA, o wrapper full-screen usa `position: fixed` com `inset: 0`; a barra de ações permanece acima da navbar. PREVENÇÃO: validar `getBoundingClientRect()` das duas barras em 320/360/390/430/768 e confirmar ausência de overflow horizontal.
