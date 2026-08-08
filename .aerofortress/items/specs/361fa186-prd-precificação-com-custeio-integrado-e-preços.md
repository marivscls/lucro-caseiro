---
id: 361fa186-cf20-404b-bd80-dcfe75483892
slug: specs
type: doc
title: PRD — Precificação com custeio integrado e preços por canal
tags: pricing, custeio, financeiro, canais, prd, production
provenance: observado
evidence: .aerofortress/specs/prd-precificacao-custeio-integrado.md
decay: stable
created: 2026-08-08T14:43:57.493920300+00:00
updated: 2026-08-08T15:25:34.006468700+00:00
validated: 2026-08-08T15:25:34.006468700+00:00
links:
---

PRD implementado e publicado em produção em 2026-08-08. Integra Gastos Fixos, faturamento observado e Meta de pró-labore à Precificação Completa como sugestões confirmadas; entrega rateio por unidades e custeio por faturamento, perfis persistidos de taxas por canal, proteção `advancedPricing`, evidências no histórico e compatibilidade com cálculos antigos, mantendo o modo Simples inalterado. A migration 051 foi aplicada no Supabase `ujwxvpceqigvyxcqolch`. O commit `93839a0` foi publicado nos serviços Railway da API (`aa904abf...`) e PWA (`113913d5...`); health, bundle novo e service worker responderam HTTP 200.
