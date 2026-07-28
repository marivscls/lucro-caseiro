---
id: 731ae6a9-a93c-4de4-98c6-ef7e3ab2aeb5
slug: ui
type: scar
title: Checkout: ícones de benefícios precisam de tamanho e cor visual uniformes
tags: checkout, paywall, plans, icones, tamanho, cor, png, ui
provenance: dito
evidence: apps/mobile/src/features/subscription/components/paywall.tsx; .aerofortress/tmp/design-audit/mobile-checkout.png; correções visuais da usuária em 2026-07-25
decay: stable
created: 2026-07-26T00:25:32.335350500+00:00
updated: 2026-07-26T00:25:32.335350500+00:00
validated: 2026-07-26T00:25:32.335350500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): os quatro PNGs fornecidos para os benefícios tinham caixas transparentes e tons de rosa internos diferentes; mesmo usando width/height iguais, os desenhos apareciam pequenos, com tamanhos percebidos e cores diferentes. CORREÇÃO CANÔNICA: no checkout `/plans` e no paywall contextual, usar o mesmo círculo de 54 px no mobile (64 px amplo), o mesmo tamanho de glifo e a mesma cor `theme.colors.primary` para gráfico, sacola, documento e calendário. O hero 3D continua usando o PNG fornecido. COMO EVITAR: comparar o bounding box visível e a paleta, não apenas as dimensões externas do arquivo.
