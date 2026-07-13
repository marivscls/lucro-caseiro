---
id: 7656f1ec-dd66-4103-be79-635035be80ce
slug: ui
type: scar
title: Rótulo: QR Code deve abrir o produto no catálogo da própria conta
tags: rotulos, qrcode, catalogo, produto, link-direto
provenance: dito
evidence: apps/mobile/src/app/labels.tsx; apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/features/labels/components/label-product-picker.tsx; apps/mobile/src/features/catalog/api.ts; apps/api/src/features/catalog/catalog.domain.ts; apps/api/src/features/catalog/catalog.usecases.ts; packages/database/src/migrations/033_label_qr_product_catalog.sql; 594 testes API e 293 testes mobile aprovados
decay: stable
created: 2026-07-13T21:15:57.289871+00:00
updated: 2026-07-13T21:15:57.289871+00:00
validated: 2026-07-13T21:15:57.289871+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-13): o QR Code do rótulo não deve aceitar um link livre nem abrir apenas a página geral; ele precisa apontar para o catálogo público da pessoa já posicionado no produto vinculado ao rótulo. CORREÇÃO: seleção obrigatória do produto no formulário, URL canônica `.../c/<slug>?produto=<id>#produto-<id>`, card do catálogo com âncora própria e garantia de incluir o produto focado mesmo no limite de 3 itens; preview/PDF recalculam o link pelo slug atual. COMO EVITAR: todo QR de rótulo deve ser derivado de `catalogSettings.slug + label.productId`, nunca de texto manual ou URL geral do catálogo.
