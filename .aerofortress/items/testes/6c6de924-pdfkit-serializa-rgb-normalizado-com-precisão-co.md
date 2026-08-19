---
id: 6c6de924-346f-4c3b-ade7-373bea75d945
slug: testes
type: scar
title: PDFKit serializa RGB normalizado com precisão completa
tags: pdfkit, pdf, testes, cores
provenance: observado
evidence: apps/api/src/features/finance/finance.export.test.ts — falha observada e teste corrigido em 2026-08-14
decay: stable
created: 2026-08-14T17:21:01.206664400+00:00
updated: 2026-08-14T17:21:01.206664400+00:00
validated: 2026-08-14T17:21:01.206664400+00:00
links:
---

Um teste de cor do PDF falhou ao esperar canais RGB arredondados a quatro casas. O PDFKit grava cada canal hexadecimal dividido por 255 com a precisão completa do JavaScript (por exemplo, `0.09019607843137255`). Em testes de branding de PDF, calcule a sequência a partir do hex em vez de hardcodar valores arredondados.
