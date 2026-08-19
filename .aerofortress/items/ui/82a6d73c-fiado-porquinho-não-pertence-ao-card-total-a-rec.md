---
id: 82a6d73c-8230-430f-b621-7e97f894e483
slug: ui
type: scar
title: Fiado: porquinho não pertence ao card Total a receber
tags: fiado, ui, asset, card-financeiro, porquinho
provenance: dito
evidence: Captura da usuária em 2026-08-16; correção em apps/mobile/src/app/fiado.tsx (TotalCard)
decay: stable
created: 2026-08-16T18:01:37.362407200+00:00
updated: 2026-08-16T18:01:37.362407200+00:00
validated: 2026-08-16T18:01:37.362407200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): o asset `fiado-hero.png` apareceu como decoração azul desfocada dentro do card `Total a receber`, poluindo o resumo financeiro. REGRA CANÔNICA: o card de total deve permanecer limpo, sem o porquinho; `fiado-hero.png` pode continuar nos estados vazios/sem resultados da tela de Fiado. COMO EVITAR: ao reutilizar a ilustração canônica de Fiado, distinguir conteúdo de empty state de decoração de card financeiro e validar que valores monetários ficam sem sobreposição visual.
