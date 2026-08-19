---
id: 3340cbfe-e4f8-4383-948d-234a0bb4489e
slug: dev
type: scar
title: Fixtures locais da vitrine devem usar os enums públicos do contrato
tags: catalogo, preview, fixture, contratos, runtime
provenance: observado
evidence: .aerofortress/storefront-local-preview.mts; packages/contracts/src/schemas/operations.ts; HTTP 200 em http://127.0.0.1:4173 e /capturas
decay: stable
created: 2026-08-19T00:34:57.090732+00:00
updated: 2026-08-19T00:34:57.090732+00:00
validated: 2026-08-19T00:34:57.090732+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): o preview local da vitrine caiu na primeira requisição porque a fixture usou `locationMode: "customer_location"`, enquanto `PublicCatalogService` aceita apenas `business | client | online | flexible`; o renderer recebeu `undefined` ao resolver o rótulo. CORREÇÃO: usar `client` e confirmar a página interativa e a galeria com HTTP 200. COMO EVITAR: fixtures executadas via `tsx` sem typecheck precisam ser validadas pelo DTO ou usar `satisfies PublicCatalog`; nunca inventar vocabulário diferente do contrato público.
