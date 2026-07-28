---
id: 0244951a-20b0-4375-98af-40d70cf8157a
slug: ui
type: scar
title: Orçamentos antigos sem rentabilidade não podem derrubar o detalhe
tags: orcamentos, compatibilidade, api, runtime, undefined, toFixed, normalizacao, pwa
provenance: observado
evidence: Erro runtime enviado pela usuária; apps/mobile/src/features/quotes/api.ts; apps/mobile/src/features/quotes/api.test.ts; lint, typecheck e teste direcionado aprovados em 2026-07-25
decay: stable
created: 2026-07-26T01:02:19.168332300+00:00
updated: 2026-07-26T01:02:19.168332300+00:00
validated: 2026-07-26T01:02:19.168332300+00:00
links:
---

FALHA OBSERVADA (2026-07-25): abrir um orçamento existente no PWA causou `Cannot read properties of undefined (reading 'toFixed')` em `QuoteDetail`, porque a UI nova chamou `quote.estimatedMargin.toFixed(...)`, mas respostas antigas/cacheadas não continham subtotal, desconto, custo, ganho e margem. CORREÇÃO: normalizar todo `Quote` na fronteira `features/quotes/api.ts`; campos ausentes são derivados de `total` e custo zero antes de chegar aos componentes, em listagem, detalhe, criação, edição, status e conversão. COMO EVITAR: quando UI/contrato ganham campos obrigatórios e podem rodar contra API anterior, reproduzir payload legado em teste e normalizar uma vez na API; não espalhar `?? 0` pela renderização nem confiar apenas no TypeScript para JSON externo.
