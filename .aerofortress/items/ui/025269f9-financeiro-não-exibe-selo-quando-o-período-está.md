---
id: 025269f9-5e7c-4560-b74a-633895e7f645
slug: ui
type: scar
title: Financeiro não exibe selo quando o período está sem movimentações
tags: financeiro, lucro, empty-state, badge, correcao
provenance: dito
evidence: Correção visual da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T19:14:56.577441300+00:00
updated: 2026-07-25T19:14:56.577441300+00:00
validated: 2026-07-25T19:14:56.577441300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): o selo arredondado com ponto verde e texto `Sem movimentações neste período` não deve aparecer abaixo do valor no banner de lucro do Financeiro. CORREÇÃO CANÔNICA: quando entradas e saídas são zero, deixar somente o título e o valor do lucro; não renderizar badge, texto substituto nem reservar espaço para essa mensagem. COMO EVITAR: a referência anterior não torna todos os elementos obrigatórios quando a usuária pede uma simplificação posterior; remover também os estilos mortos para o espaçamento recolher de verdade.
