---
id: 28816e3b-c2b5-47b3-8288-43da72d89a2b
slug: ui
type: scar
title: Insumos: lista compacta deve empilhar antes de comprimir a linha
tags: insumos, responsividade, pwa, spacing, breakpoint, prefixo-tecnico
provenance: dito
evidence: Screenshot da usuaria em 2026-08-18; apps/mobile/src/features/materials/components/material-card.tsx; apps/mobile/src/shared/ingredient-image/resolve.ts; bundle PWA entry-eec062f8f38f9ac1cf509ab1d72b95e6.js
decay: stable
created: 2026-08-19T01:14:56.407872+00:00
updated: 2026-08-19T01:14:56.407872+00:00
validated: 2026-08-19T01:14:56.407872+00:00
links:
---

CORRECAO DA USUARIA (2026-08-18): em uma tela estreita de aproximadamente 486 px, cada insumo ainda usava a linha larga com icone, nome, quantidade, status e dois controles lado a lado; o nome aparecia truncado como `[ma...` e a linha ficava sem respiro. CAUSA: o layout compacto so entrava abaixo de 430 px. CORRECAO: antecipar o modo compacto para larguras abaixo de 640 px, deixando identificacao na primeira faixa e quantidade/status/controles na segunda; nomes exibidos passam pela funcao compartilhada `displayIngredientName`, que remove prefixos tecnicos como `[massa]` apenas na apresentacao. COMO EVITAR: validar listas densas tambem nas larguras intermediarias de PWA (430-640 px) e preferir empilhamento antes de reduzir a legibilidade ou truncar informacao essencial.
