---
id: 6fe7f9a9-d77b-49e9-9a33-84161eebb865
slug: product
type: decision
title: Tela de Produção foi retirada do Lucro Caseiro
tags: producao, simplificacao, navegacao, produto
provenance: dito
evidence: Decisão da usuária em 2026-07-25; apps/mobile/src/app/tabs/more.tsx; apps/mobile/src/app/insights.tsx; .aerofortress/specs/prd-operacao-acionavel-redesign.md
decay: stable
created: 2026-07-25T03:56:51.405414600+00:00
updated: 2026-07-25T03:56:51.405414600+00:00
validated: 2026-07-25T03:56:51.405414600+00:00
links:
---

Decisão da dona do produto em 2026-07-25: retirar do aplicativo a tela de fechamento de Produção. O fluxo exigia produto, quantidades planejada/produzida e consumo/perda de cada insumo, adicionando um ritual manual desproporcional ao valor entregue e aproximando o produto de uma operação industrial. Foram removidos rota, item do menu Mais, cliente mobile e alerta correspondente dos Insights. API, contratos e tabelas de produção permanecem preservados, sem migração destrutiva; só reavaliar a interface se houver demanda real validada.
