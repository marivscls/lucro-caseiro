---
id: afd337ff-da2a-47d7-bf68-b7eed4055869
slug: specs
type: doc
title: PRD — Métricas de instalação, ativação e retenção
tags: prd, analytics, metricas, ativacao, retencao, privacidade
provenance: observado
evidence: .aerofortress/specs/prd-metricas-produto.md; packages/database/src/migrations/034_product_analytics.sql; apps/api/src/features/analytics; apps/mobile/src/features/analytics; docs/privacy-policy.html; docs/play-store/data-safety.md
decay: stable
created: 2026-07-14T02:15:01.867924900+00:00
updated: 2026-07-14T02:16:25.694457100+00:00
validated: 2026-07-14T02:16:25.694457100+00:00
links:
---

Define e implementa o funil mínimo do Lucro Caseiro: instalação observada, vínculo muitos-para-muitos instalação-conta, ativação derivada de precificação/venda/encomenda, atividade diária e retenção D1/D7/D30. A solução é própria, sem SDK externo, coleta apenas UUID aleatório de instalação/plataforma/versão e disponibiliza `pnpm analytics:report`; política de privacidade e guia de Data Safety foram alinhados. A migration deve ser aplicada antes do deploy da API e da atualização do app.
