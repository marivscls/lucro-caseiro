---
id: 3ba8f86b-f77b-4cdb-b201-6eaa3405d83e
slug: ui
type: scar
title: Insumos: hero da despensa precisa de respiro e indicadores na mesma linha
tags: insumos, hero, indicadores, mesma-linha, responsividade, pwa, correcao
provenance: dito
evidence: Orientação explícita da usuária em 2026-08-18; apps/mobile/src/app/materials.tsx; .aerofortress/materials-spacing-390.png (390×844, documentWidth=390, hero 350×316, sem erros de console)
decay: stable
created: 2026-08-19T02:00:58.448359200+00:00
updated: 2026-08-19T02:20:42.587712600+00:00
validated: 2026-08-19T02:20:42.587712600+00:00
links:
---

CORREÇÃO MAIS RECENTE DA USUÁRIA (2026-08-18): os três indicadores “em dia / atenção / baixo” devem permanecer juntos na mesma linha. Esta orientação substitui a regra anterior que os empilhava verticalmente. TENTATIVA INSUFICIENTE: aplicar somente `flexDirection: row` no grupo preservou cada métrica larga e fez “atenção/baixo” atravessarem a ilustração. CORREÇÃO CANÔNICA: cada indicador é uma coluna compacta, com o ícone em cima e número+rótulo juntos embaixo; as três colunas ficam lado a lado dentro da área esquerda do hero, com dimensões menores abaixo de 360 px. Preservar o respiro, a altura e a ilustração do card. COMO EVITAR: não voltar a empilhar os estados nem transformar as linhas largas em uma row sem compactá-las; validar em viewport estreito com captura real.
