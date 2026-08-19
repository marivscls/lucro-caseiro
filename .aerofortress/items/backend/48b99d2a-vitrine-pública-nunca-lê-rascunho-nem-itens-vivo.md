---
id: 48b99d2a-7408-4b22-9028-28d5ecbacd9d
slug: backend
type: scar
title: Vitrine pública nunca lê rascunho nem itens vivos após publicar
tags: catalogo, publicacao, rascunho, snapshot, seguranca
provenance: observado
evidence: packages/database/src/migrations/060_storefront_customization.sql; apps/api/src/features/catalog/catalog.usecases.ts; apps/api/src/features/catalog/catalog.usecases.test.ts
decay: stable
created: 2026-08-19T00:20:02.538436400+00:00
updated: 2026-08-19T00:23:34.917537500+00:00
validated: 2026-08-19T00:23:34.917537500+00:00
links:
---

FALHA EVITADA/CORRIGIDA (2026-08-18): a fase 1 persistia apenas `catalog_settings.customization`; se a rota pública consumisse esse campo, salvar alterações em um catálogo ativo vazaria o rascunho. Além disso, consultar produtos/serviços vivos faria alterações posteriores aparecerem antes da próxima publicação. CORREÇÃO CANÔNICA: `customization` é só rascunho; `published_customization`, `published_products` e `published_services` formam o snapshot público. `publishStorefront` congela os três, `/c/:slug` usa somente o snapshot, e a prévia autenticada usa rascunho/dados atuais com `noindex`. Catálogos legados sem snapshot continuam no renderer clássico.
