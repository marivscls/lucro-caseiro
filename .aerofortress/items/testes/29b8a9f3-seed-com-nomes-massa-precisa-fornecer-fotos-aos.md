---
id: 29b8a9f3-299b-4c51-a543-e653d4418fcb
slug: testes
type: scar
title: Seed com nomes [massa] precisa fornecer fotos aos produtos
tags: seed, vendas, imagens, produtos, massa-de-testes
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql; captura da usuária em 2026-08-16; execução Railway production confirmou products_with_images=18 e sales_with_images=72
decay: stable
created: 2026-08-16T17:17:02.598563300+00:00
updated: 2026-08-16T17:17:02.598563300+00:00
validated: 2026-08-16T17:17:02.598563300+00:00
links:
---

SINTOMA (2026-08-16): após popular a conta de teste, os cards de Vendas exibiam `[` dentro da miniatura. CAUSA: os 18 produtos do seed tinham `photo_url = NULL` e o fallback visual usa `title.charAt(0)`; como todos os nomes começam por `[massa]`, o caractere mostrado era `[`. CORREÇÃO: o seed atribui imagens públicas por tipo de produto e a conta carregada foi atualizada; a consulta confirmou 18 produtos com foto e 72 vendas vinculadas a produtos com foto. COMO EVITAR: toda massa visual que prefixa nomes técnicos deve preencher `photo_url` ou usar um nome de exibição sem o prefixo; validar o card renderizado, não só a existência das linhas.
