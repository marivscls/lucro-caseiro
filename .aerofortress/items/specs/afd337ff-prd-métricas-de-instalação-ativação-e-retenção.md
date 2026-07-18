---
id: afd337ff-da2a-47d7-bf68-b7eed4055869
slug: specs
type: doc
title: PRD — Métricas de instalação, ativação e retenção
tags: analytics, marketing, activation
provenance: observado
evidence: .aerofortress/specs/prd-metricas-instalacao-retencao.md; packages/contracts/src/schemas/analytics.ts; apps/api/src/features/analytics/analytics.report-query.ts; packages/database/src/migrations/037_activation_funnel_events.sql; builds de API, web e PWA aprovados; suítes focadas e mobile aprovadas
decay: seasonal
created: 2026-07-14T02:15:01.867924900+00:00
updated: 2026-07-18T18:01:17.116459700+00:00
validated: 2026-07-18T18:01:17.116459700+00:00
links:
---

Define e implementa o funil do Lucro Caseiro: instalação observada, vínculo instalação-conta, atividade diária e retenção D1/D7/D30. Em 2026-07-18, ativação deixou de aceitar qualquer combinação ampla e passou a exigir, para a mesma instalação e em ordem temporal, `pricing_completed` → `product_created_from_pricing` → `catalog_published` ou `sale_completed`. Também passaram a ser registrados início de precificação, limite atingido, recurso pago solicitado e ciclo de assinatura. A atribuição de origem usa referrer da Google Play e reconciliação com Play Console/GA; o app não possui SDK interno de install-referrer.
