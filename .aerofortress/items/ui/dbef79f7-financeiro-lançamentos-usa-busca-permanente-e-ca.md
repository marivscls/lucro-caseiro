---
id: dbef79f7-a955-4084-ab13-2e4b8dc76312
slug: ui
type: decision
title: Financeiro: Lançamentos usa busca permanente e card adaptativo abaixo de 390 px
tags: financeiro, lancamentos, responsividade, react-native-web, mobile, busca, filtros
provenance: observado
evidence: apps/mobile/src/features/finance/components/finance-dashboard.tsx; ESLint e build PWA aprovados em 2026-08-16; inspeção CDP em 320, 360, 390, 412 e 480 px confirmou scrollWidth igual à viewport, controles sem sobreposição e interações de filtro/busca/Novo; captura .aerofortress/finance-entries-360-section.png
decay: stable
created: 2026-08-16T19:59:31.595359400+00:00
updated: 2026-08-16T19:59:31.595359400+00:00
validated: 2026-08-16T19:59:31.595359400+00:00
links:
---

A seção Lançamentos do Financeiro mantém cabeçalho em linha com título à esquerda e CTA `+ Novo` à direita, busca sempre visível em largura total, filtros Tudo/Entradas/Saídas em três colunas flexíveis e contador compacto. O card diário usa superfície branca, divisor e valor reservado à direita; abaixo de 390 px, a linha do lançamento passa a empilhar o valor sob a descrição/metadados para impedir truncamento. A lógica existente de busca, filtros, abertura do formulário e navegação do lançamento permanece compartilhada. Não alterar o conteúdo acima da seção ao evoluir esse bloco.
