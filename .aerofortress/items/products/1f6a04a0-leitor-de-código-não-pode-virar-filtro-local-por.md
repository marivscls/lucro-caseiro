---
id: 1f6a04a0-356d-42c0-82f4-ca95470f5e1b
slug: products
type: scar
title: Leitor de código não pode virar filtro local por nome nem depender da primeira página
tags: barcode, scanner, pagination, nova-venda, varejo
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/app/retail.tsx; apps/api/src/features/products/products.routes.ts; apps/api/src/features/products/products.usecases.ts
decay: stable
created: 2026-07-20T21:22:00.705587500+00:00
updated: 2026-07-20T21:22:00.705587500+00:00
validated: 2026-07-20T21:22:00.705587500+00:00
links:
---

SINTOMA (2026-07-20): na Nova Venda, o scanner escrevia o código em `productSearch`, mas `filteredProducts` comparava somente `p.name`; no Varejo a leitura filtrava apenas os até 100 produtos carregados. Assim o recurso parecia existir, porém não identificava corretamente o produto ou falhava em catálogos maiores. CORREÇÃO: criar consulta autenticada exata por código na API, usada diretamente pelos fluxos de scan; manter filtro visual por nome OU código e carregar o catálogo completo apenas onde a seleção visual exige. Leituras encontradas executam a ação de negócio (adicionar/incrementar), em vez de apenas preencher uma busca. COMO EVITAR: scanner é entrada determinística por identificador e nunca deve ser implementado como substring sobre uma página parcial da UI.
