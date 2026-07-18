---
id: ec389601-e7c7-48c6-a80b-4c1475a9b5af
slug: specs
type: doc
title: PRD — Analytics comportamental e funis de produto
tags: prd, analytics, eventos, funil, retencao, versao, privacidade, ativacao
provenance: observado
evidence: .aerofortress/specs/prd-analytics-comportamental.md; packages/contracts/src/schemas/analytics.ts; apps/api/src/features/analytics/analytics.report-query.ts; packages/database/src/migrations/037_activation_funnel_events.sql
decay: seasonal
created: 2026-07-14T03:16:38.620388+00:00
updated: 2026-07-18T17:57:19.798182100+00:00
validated: 2026-07-18T17:57:19.798182100+00:00
links:
---

Implementado e ampliado em 2026-07-18. O analytics mede telas, ações canônicas, funil temporal, adoção por versão e retenção; os marcos novos cobrem início de precificação, produto criado pelo resultado, publicação do catálogo, limite de plano, intenção de recurso pago e ciclo real de assinatura. O painel conta negócio ativado somente depois da sequência precificação→produto→catálogo/venda; os endpoints usam allowlists estritas sem conteúdo pessoal e a persistência depende das migrations 035 e 037.
