---
id: cb3282fa-a336-4d8a-8c70-d84fe66018c7
slug: ui
type: rule
title: Checkout adapta benefícios e preços ao plano mínimo do recurso
tags: checkout, subscription, essential, professional
provenance: dito
evidence: apps/mobile/src/features/subscription/components/paywall.tsx; apps/mobile/src/features/subscription/limit-copy.ts
decay: stable
created: 2026-07-26T00:47:59.159269100+00:00
updated: 2026-07-26T00:47:59.159269100+00:00
validated: 2026-07-26T00:47:59.159269100+00:00
links:
---

O checkout compartilhado deve adaptar conteúdo e cobrança ao tier mínimo do recurso. Bloqueios por limite de volume usam **Essencial**, com benefícios próprios (vendas sem limite mensal; clientes/produtos/receitas/embalagens sem limite; catálogo online; rotina sem anúncios) e preços de R$ 29,90/mês ou R$ 299/ano. Recursos exclusivos usam **Profissional**, com benefícios e preços próprios. O nome “Premium” não aparece comercialmente.
