---
id: 5c217bc0-834b-4c64-9fe6-793c19fac61e
slug: arch
type: fact
title: Stripe Live: 4 price IDs dos tiers + URL do webhook (conta Orionseven)
tags: stripe, price, webhook, billing, railway, lancamento
provenance: observado
evidence: Stripe Inspector 2026-07-08: price_1TqxR3...5hSwROzD interval=month unit_amount=2990; price_1TqxVg...bIdZRjVY interval=year unit_amount=69900; livemode=true. Rotas: apps/api/src/main.ts:221,292; stripe.routes.ts.
decay: stable
created: 2026-07-08T15:49:09.576836200+00:00
updated: 2026-07-08T15:49:09.576836200+00:00
validated: 2026-07-08T15:49:09.576836200+00:00
links: 
---

Prices **Live** criados na conta Stripe do Orionseven Software (conta compartilhada com o sócio Lucas/Orion Dev — ver [[entidade-legal-do-lucro-caseiro-cnpj-ltda-em-soc]]). Todos `livemode: true`, BRL.

Mapeamento (env → price id), confirmado via Inspector do Stripe:

- `STRIPE_PRICE_ESSENTIAL_MONTHLY_ID` = `price_1TqxR3KXpL7ZV3el5hSwROzD` (R$ 29,90/mês, prod_UqekxsV7bFMFb0)
- `STRIPE_PRICE_ESSENTIAL_ANNUAL_ID` = `price_1TqxR3KXpL7ZV3elVx5p42Wa` (R$ 299,00/ano)
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID` = `price_1TqxVgKXpL7ZV3elt0maEbHO` (R$ 69,90/mês, prod_UqepEztYTWJO7e)
- `STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID` = `price_1TqxVgKXpL7ZV3elbIdZRjVY` (R$ 699,00/ano)

**Webhook URL (Live):** `https://lucro-caseiroapi-production.up.railway.app/api/v1/webhooks/stripe` (router montado em `/api/v1/webhooks`, rota `/stripe` — main.ts:221; checkout em `/api/v1/payments/stripe/checkout`).
**Eventos tratados** (stripe.usecases.ts handleEvent): checkout.session.completed, customer.subscription.created/updated/deleted.

Faltando pôr no Railway: os 4 acima + STRIPE*SECRET_KEY (sk_live*) + STRIPE*WEBHOOK_SECRET (whsec*). Depois rodar migration 029 no Supabase. Ver [[stripe-billing-live-launch-todo]].
