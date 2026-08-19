---
id: 18f74dd5-dc4d-48fb-9066-3ae27ad21301
slug: design
type: decision
title: Vendas usa ilustração de recibo e pacote no resumo do cabeçalho
tags: vendas, cabecalho, ilustracao, asset, lucro-caseiro
provenance: dito
evidence: apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/assets/sales-header-icon.png
decay: stable
created: 2026-08-16T17:28:44.459807900+00:00
updated: 2026-08-16T17:28:44.459807900+00:00
validated: 2026-08-16T17:28:44.459807900+00:00
links:
---

A usuária escolheu a ilustração gerada em tons vinho e rosa, com recibo saindo de um pacote, para substituir o ícone genérico de maleta dentro do círculo branco no card de resumo do cabeçalho de Vendas. O asset canônico é `apps/mobile/src/assets/sales-header-icon.png`; `SalesHeader` o renderiza diretamente, preservando o `sales-empty-v2.png` do estado vazio.
