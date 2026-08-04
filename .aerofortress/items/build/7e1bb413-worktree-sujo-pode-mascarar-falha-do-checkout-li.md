---
id: 7e1bb413-d9a1-4625-94e5-6812a3c5a119
slug: build
type: scar
title: Worktree sujo pode mascarar falha do checkout limpo no CI
tags: ci, git, dirty-worktree, typecheck, fixtures
provenance: observado
evidence: GitHub Actions run 30913228067; apps/mobile/src/features/recipes/statistics.test.ts; commit c776ff8
decay: stable
created: 2026-08-04T13:22:01.320747100+00:00
updated: 2026-08-04T13:22:01.320747100+00:00
validated: 2026-08-04T13:22:01.320747100+00:00
links:
---

SINTOMA (2026-08-04): o prepush e o typecheck local passaram antes de publicar push notifications, mas o CI do commit `c776ff8` falhou em `apps/mobile/src/features/recipes/statistics.test.ts` porque a fixture não tinha `Product.publicEnabled`. CAUSA: o worktree local já continha, sem commit, a linha corretiva `publicEnabled: true`; o TypeScript local a enxergou, enquanto o checkout limpo do GitHub não. CORREÇÃO: publicar essa correção mínima em commit separado e confirmar o CI remoto. COMO EVITAR: em árvore com WIP paralelo, validação local prova o worktree inteiro, não o conteúdo do commit; antes de declarar um release verde, validar o SHA em checkout limpo ou aguardar o CI desse SHA.
