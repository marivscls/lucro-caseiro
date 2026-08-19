---
id: 30973483-85e4-4da5-8540-ca38dea1acf9
slug: ui
type: scar
title: Valor principal da Home deve caber inteiro no card
tags: home, tipografia, mobile, valor-monetario, truncamento, testes
provenance: dito
evidence: Captura da usuária em 2026-08-16; packages/ui/src/theme.ts; apps/mobile/src/test/lucro-caseiro-theme.test.ts; suíte mobile executada em 2026-08-16
decay: stable
created: 2026-08-16T17:16:28.682014500+00:00
updated: 2026-08-16T18:44:32.804385900+00:00
validated: 2026-08-16T18:44:32.804385900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): o valor de `Vendas no mês` na Home estava grande demais e aparecia truncado com reticências, impedindo a leitura. CAUSA: a variante canônica `homeFinancialValue` usava 44 px; o ajuste automático de fonte não evitou o corte no layout observado. CORREÇÃO: manter esse valor em uma única linha com a variante da Home em 32 px e line-height 40, preservando a hierarquia sem esconder os centavos/dígitos. O teste de tema também deve afirmar 32/40; manter 44/50 no teste deixa a suíte quebrada contra o valor canônico. COMO EVITAR: ao alterar a tipografia do hero financeiro, atualizar junto a asserção semântica e validar um valor monetário real na largura mobile; não aceitar reticências no número principal.
