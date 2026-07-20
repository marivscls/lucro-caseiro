---
id: 67300b8d-0fbf-428e-b90d-0912affb9237
slug: payments
type: scar
title: Checkout Stripe exige chave secreta geral e retornos no domínio ativo
tags: stripe, checkout, railway, pwa, dominio, chave-api, webhook
provenance: observado
evidence: Railway API logs em 2026-07-20; apps/api/src/features/payments/stripe.usecases.ts; apps/api/src/config.ts; apps/mobile/src/features/subscription/use-stripe.ts
decay: stable
created: 2026-07-20T01:36:44.651521200+00:00
updated: 2026-07-20T01:36:44.651521200+00:00
validated: 2026-07-20T01:36:44.651521200+00:00
links:
---

SINTOMA (2026-07-19): no PWA em `app.lucrocaseiro.com.br`, Assinar Profissional mostrava “Não foi possível abrir o checkout da Stripe”; a API registrava POST `/api/v1/payments/stripe/checkout` 500. CAUSA OBSERVADA: `STRIPE_SECRET_KEY` no Railway era uma meter key `mk_…`, que não autoriza `checkout.sessions.create`; além disso, `STRIPE_SUCCESS_URL` e `STRIPE_CANCEL_URL` apontavam para `lucrocaseiro.app/checkout/*`, domínio/rotas que o PWA não usa. CORREÇÃO: configurar no serviço API a chave secreta live `sk_live_…` da mesma conta dos quatro Price IDs e retornos para `https://app.lucrocaseiro.com.br/plans?checkout=success|cancel`; manter webhook válido e provar sessão real + retorno + ativação por webhook. COMO EVITAR: classificar prefixo/tipo da chave sem expô-la, validar os Price IDs no mesmo modo/conta e revisar URLs de retorno sempre que o domínio público mudar.
