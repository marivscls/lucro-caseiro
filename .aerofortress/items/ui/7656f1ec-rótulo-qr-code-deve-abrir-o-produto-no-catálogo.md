---
id: 7656f1ec-dd66-4103-be79-635035be80ce
slug: ui
type: scar
title: Rótulo: QR Code deve abrir o produto no catálogo da própria conta
tags: rotulos, qrcode, catalogo, produto, link-direto, seletor, busca, scroll
provenance: dito
evidence: apps/mobile/src/features/labels/components/label-product-picker.tsx; apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/app/labels.tsx; apps/mobile/src/features/catalog/api.ts; correções da usuária em 2026-07-13 e 2026-07-19; typecheck, lint e build:pwa:caseiro aprovados em 2026-07-19
decay: stable
created: 2026-07-13T21:15:57.289871+00:00
updated: 2026-07-19T18:43:00.456859800+00:00
validated: 2026-07-19T18:43:00.456859800+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) em 2026-07-13, o QR Code do rótulo não deveria aceitar link livre nem abrir apenas a página geral; precisava apontar para o catálogo público já posicionado no produto vinculado. CORREÇÃO: seleção obrigatória do produto, URL canônica `.../c/<slug>?produto=<id>#produto-<id>`, âncora no card e preview/PDF derivados de `catalogSettings.slug + label.productId`. (2) Em 2026-07-19, o seletor mostrava produtos como chips num scroll horizontal sem indicador; os demais pareciam inexistentes. CORREÇÃO: substituir por lista vertical pesquisável, com altura limitada, barra de rolagem visível, seleção destacada e suporte a rolagem aninhada. COMO EVITAR: seletores de coleções potencialmente grandes não usam carrossel horizontal invisível; devem oferecer busca e rolagem vertical explícita.
