---
id: 24607a4b-2b7f-4cb1-bfc8-4e63613a2319
slug: build
type: scar
title: Asserções de prompt devem acompanhar o trecho canônico real
tags: testes, prompt, capitalizacao, texto-canonico, vitest
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/marketing.domain.test.ts; falhas observadas em pnpm --filter @lucro-caseiro/api test em 2026-07-17
decay: stable
created: 2026-07-17T12:56:09.507951300+00:00
updated: 2026-07-17T13:17:36.541207300+00:00
validated: 2026-07-17T13:17:36.541207300+00:00
links:
---

SINTOMA (2026-07-17): testes de marketing falharam duas vezes ao procurar trechos que não correspondiam literalmente ao prompt: primeiro `Potencial de compartilhamento` com capitalização inventada; depois `potencial de compartilhamento` após o texto ter sido reescrito como uma enumeração sem repetir `potencial de`. CAUSA: asserções novas foram baseadas na intenção semântica, mas usavam comparação literal. CORREÇÃO: manter no prompt os termos canônicos exigidos pelo PRD e copiar exatamente esses trechos nas asserções. COMO EVITAR: quando a literalidade faz parte do contrato, testar a frase canônica atual; quando não fizer, normalizar ou testar termos menores deliberadamente.
