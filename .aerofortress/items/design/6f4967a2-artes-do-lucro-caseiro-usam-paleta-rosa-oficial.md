---
id: 6f4967a2-ffa8-4d41-8084-240a174b54c3
slug: design
type: scar
title: Artes do Lucro Caseiro usam paleta rosa oficial, não as cores da referência
tags: marketing, play-store, identidade-visual, rosa, imagem
provenance: dito
evidence: packages/brands/src/lucro-caseiro/brand.json; packages/ui/src/theme.ts; imagens/play-store-conectadas-2026-07-23/01-venda-e-organizacao.png; correção direta da usuária nesta conversa
decay: stable
created: 2026-07-23T13:24:26.680209500+00:00
updated: 2026-07-23T13:24:26.680209500+00:00
validated: 2026-07-23T13:24:26.680209500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-23): as artes promocionais do Lucro Caseiro não podem herdar a paleta verde/verde-água da imagem usada apenas como referência. A identidade oficial é rosa quente e neutra: rose500 #C4707E, rose700 #A85A67, rose100 #F9E7EA, fundo #FAFAF8, superfície #F4F3F1, texto #292624; Fraunces nos títulos e Nunito Sans no restante. SINTOMA DO ERRO: duas artes conectadas foram geradas em turquesa, ficando visualmente próximas demais do exemplo. COMO EVITAR: antes de gerar material da marca, ler `packages/brands/src/lucro-caseiro/brand.json` e `packages/ui/src/theme.ts`; usar referências externas só para estrutura/ritmo, nunca para copiar paleta ou personagem. Quando a usuária pedir distinção, criar uma pessoa claramente diferente da referência.
