---
id: dab0ed5d-120d-4b8d-9f37-aca03513b6e0
slug: ui
type: scar
title: Orçamento web precisa declarar viewport e separar leitura de impressão
tags: pwa, orcamentos, safari, mobile, viewport, pdf, impressao, responsividade, producao
provenance: observado
evidence: apps/mobile/src/features/quotes/quote-pdf.ts; apps/mobile/src/features/quotes/quote-pdf.test.ts; 345 testes e prepush aprovados; Railway SUCCESS; https://app.lucrocaseiro.com.br validado em Chrome headless sem erros críticos em 2026-07-20
decay: stable
created: 2026-07-20T20:31:41.969618800+00:00
updated: 2026-07-20T21:03:39.816725+00:00
validated: 2026-07-20T21:03:39.816725+00:00
links:
---

SINTOMA (2026-07-20, iPhone/PWA): o orçamento aberto no navegador ocupava apenas uma faixa no topo e todo o conteúdo aparecia minúsculo. CAUSA: o HTML gerado em `quote-pdf.ts` não declarava `meta viewport`; o Safari móvel adotava uma viewport de desktop e reduzia a página inteira para caber. CORREÇÃO: adicionar `width=device-width, initial-scale=1`, envolver o conteúdo em uma folha responsiva e aplicar estilos maiores em `@media screen`, preservando o A5 e as medidas originais em `@media print`. COMO EVITAR: qualquer HTML exportado que também seja aberto diretamente no navegador deve ter viewport explícita e separar CSS de leitura (`screen`) do CSS de PDF/impressão (`print`); validar no bundle PWA e no domínio publicado, não apenas no fonte. PUBLICAÇÃO: commit `09b4db1`; Railway mobile atualizado junto ao commit final `329b6da`; bundle de produção `entry-ad387667d074c6d1f02e8004dc764312.js` contém o CSS responsivo.
