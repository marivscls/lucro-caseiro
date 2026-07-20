---
id: aacb7fe3-9625-4f5b-b0c0-77a65dab1b3b
slug: products
type: fact
title: Leitor de código de barras usa busca exata local e sugestão externa opcional
tags: barcode, produtos, vendas, varejo, cosmos
provenance: observado
evidence: apps/api/src/features/products/products.usecases.ts; apps/api/src/features/products/products.catalog.ts; apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/app/retail.tsx; apps/mobile/src/features/products/components/create-product-form.tsx; 647 testes API + 347 testes mobile + typecheck/lint/build PWA em 2026-07-20
decay: seasonal
created: 2026-07-20T21:04:07.586637300+00:00
updated: 2026-07-20T21:22:00.655548500+00:00
validated: 2026-07-20T21:22:00.655548500+00:00
links:
---

O app mobile lê EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39 e QR via `expo-camera`. Desde 2026-07-20, Nova Venda e Varejo consultam `GET /api/v1/products/lookup/by-code/:code`: produto local é encontrado por correspondência exata sem depender da paginação; na venda ele entra no carrinho e leituras repetidas incrementam quantidade; no Varejo o item é selecionado e incrementado, com escolha obrigatória quando há múltiplas variações. Código desconhecido abre o cadastro já preenchido. O backend pode consultar Cosmos/Bluesoft e sugerir nome/categoria/marca/foto quando `COSMOS_API_TOKEN` e `COSMOS_USER_AGENT` estão configurados; sem credenciais ou em falha, mantém cadastro manual. `CreateProductForm` também gera código interno `LC-*`.
