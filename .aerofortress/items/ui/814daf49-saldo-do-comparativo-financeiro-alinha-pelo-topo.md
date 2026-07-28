---
id: 814daf49-0fbc-44f4-8574-cc8d8699efa9
slug: ui
type: scar
title: Saldo do comparativo financeiro alinha pelo topo do cabeçalho
tags: financeiro, comparativo, alinhamento, saldo, cabecalho
provenance: dito
evidence: Correção visual da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T19:34:08.968975600+00:00
updated: 2026-07-25T19:34:08.968975600+00:00
validated: 2026-07-25T19:34:08.968975600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): o indicador `Saldo positivo` no card `Entradas x saídas` estava baixo porque a linha do cabeçalho centralizava verticalmente o indicador contra o bloco de título mais subtítulo. CORREÇÃO CANÔNICA: alinhar os filhos do `flowHeader` por `flex-start`, deixando o saldo na altura do título e o subtítulo continuar somente abaixo do lado esquerdo. COMO EVITAR: cabeçalhos com um lado em duas linhas e outro em uma linha devem alinhar pelo topo, não pelo centro.
