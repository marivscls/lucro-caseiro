---
id: ec74a44d-0473-408a-a3af-c0c74211d398
slug: backend
type: scar
title: TransactionSql do postgres-js perde assinatura de tag no TypeScript
tags:
provenance: observado
evidence: apps/api/src/features/email/grant-professional-trials.ts; postgres-js 3.4.8 types/index.d.ts:718; typecheck de 2026-08-06
decay: stable
created: 2026-08-06T16:12:59.967485300+00:00
updated: 2026-08-06T16:12:59.967485300+00:00
validated: 2026-08-06T16:12:59.967485300+00:00
links:
---

SINTOMA (2026-08-06): o script de concessão promocional usou o callback de `sql.begin` como tagged template, mas o TypeScript informou que `TransactionSql<{}>` não tinha call signatures. No postgres-js 3.4.8, `TransactionSql` é declarado como `Omit<Sql<...>>`; o `Omit` preserva métodos, mas perde as assinaturas de chamada da interface. CORREÇÃO: dentro da transação, usar `transaction.unsafe` com SQL estático e parâmetros posicionais, mantendo dados fora da string. Para o resultado, desestruturar a primeira linha e validar sua existência antes de adicioná-la. COMO EVITAR: em scripts TypeScript deste repo, não usar `transaction\`...\``enquanto essa tipagem estiver presente; conferir o fonte do postgres-js e usar`unsafe(query, parameters)` somente com query estática.
