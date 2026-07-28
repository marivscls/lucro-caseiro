---
id: 85fe7d2b-a53e-4643-aa7b-2024792342c9
slug: design
type: scar
title: Nunito Sans não elimina a hierarquia: títulos grandes em 700, textos menores
tags: tipografia, nunito-sans, peso, tamanho, titulos, hierarquia
provenance: dito
evidence: Correções visuais da usuária em 2026-07-25; packages/ui/src/components/typography.tsx; apps/mobile/src/shared/components/screen-header.tsx
decay: stable
created: 2026-07-25T20:35:36.814454700+00:00
updated: 2026-07-25T20:35:36.814454700+00:00
validated: 2026-07-25T20:35:36.814454700+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): a primeira troca global aplicou ExtraBold 800 aos títulos, deixando `Descubra quanto cobrar` grosseiro; em seguida, reduzir também display/h1/h2 deixou `Precificação` pequeno demais. CORREÇÃO CANÔNICA: usar Nunito Sans Bold 700 nos títulos, preservar a escala grande de display/h1/h2 e reduzir apenas body/caption. COMO EVITAR: mudança de família não autoriza achatar a hierarquia; peso, tamanho e função tipográfica são decisões separadas.
