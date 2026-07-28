---
id: 9a139144-8eb4-41c1-8470-11867d8abbf1
slug: scripts
type: scar
title: Testes do mobile usam Vitest e não aceitam --runInBand
tags: vitest, test, pnpm
provenance: observado
evidence: apps/mobile/package.json; saída `Unknown option: 'runInBand'` em 2026-07-25
decay: stable
created: 2026-07-25T03:55:37.629037400+00:00
updated: 2026-07-25T03:55:37.629037400+00:00
validated: 2026-07-25T03:55:37.629037400+00:00
links:
---

SINTOMA OBSERVADO (2026-07-25): a validação do redesenho de Produtos chamou `pnpm --filter @lucro-caseiro/mobile test -- --runInBand`; o comando falhou antes de rodar testes porque `--runInBand` é uma opção do Jest, enquanto o script mobile executa `vitest run`. CORREÇÃO: executar o script sem essa opção (`pnpm --filter @lucro-caseiro/mobile test`). COMO EVITAR: consultar o script do pacote antes de acrescentar flags específicas de runner.
