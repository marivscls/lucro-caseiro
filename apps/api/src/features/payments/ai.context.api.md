# ai.context.api.md - Payments

---

## Purpose

Stripe Billing integration for paid subscriptions (Essencial/Profissional). The backend creates Stripe Checkout Sessions and processes signed Stripe webhooks to activate/deactivate the plan.

## Non-goals

- Does not store payment history locally.
- Does not process card data directly; Checkout is hosted by Stripe.
- Does not create Products or Prices; those are configured in Stripe Dashboard and referenced by env vars.
- Does not manage plan state directly beyond calling `SubscriptionUseCases.activatePlan` / `deactivatePlan`.

## Boundaries & Ownership

- **Depends on:**
  - `features/subscription/subscription.usecases.ts`
  - `shared/middleware/auth` for checkout
  - Stripe Node SDK
- **Dependents:**
  - Mobile calls `POST /api/v1/payments/stripe/checkout` and opens the returned URL.
  - Stripe Dashboard webhook points to `POST /api/v1/webhooks/stripe`.

## Code pointers

| File                      | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `payments.types.ts`       | Shared checkout input (`tier` + `period`) types                |
| `stripe.domain.ts`        | Pure Stripe subscription state helpers                         |
| `stripe.domain.test.ts`   | Domain tests                                                   |
| `stripe.usecases.ts`      | Creates checkout URL and applies webhook subscription state    |
| `stripe.usecases.test.ts` | Use case tests with mocked Stripe client                       |
| `stripe.routes.ts`        | Checkout and webhook Express routes                            |
| `main.ts`                 | Mounts Stripe webhook before `express.json()` for raw body use |

## Data Model

No payment tables. Mapping is derived from Stripe metadata:

- Checkout Session `client_reference_id` = Lucro Caseiro `userId`
- Subscription `metadata` = `{ userId, tier, period }` (tier drives which paid plan is activated)
- Plan state stays in `users.plan` / `users.planExpiresAt`

## Invariants

- Checkout requires auth; `userId` comes from JWT, never request body.
- Checkout uses `mode: "subscription"` and one recurring Price (selected by `tier` + `period`).
- Webhook signature verification uses `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`.
- Stripe webhook route must receive raw request body before `express.json()`.
- `active` and `trialing` subscriptions activate the plan; the tier comes from `subscription.metadata.tier` (fallback: match the price id; last resort `professional`, covering legacy Premium subs).
- `canceled`, `incomplete_expired`, `paused`, and `unpaid` subscriptions deactivate the plan (back to Free).
- `past_due` is ignored so Stripe retry settings can run without immediate downgrade.

## Operations

```yaml
feature: payments
app: api
mobile_counterpart: subscription/use-stripe
api:
  base: /api/v1/payments/stripe
  endpoints:
    - method: POST
      path: /checkout
      auth: required
      body: { tier: "essential" | "professional", period: "monthly" | "annual" }
      response: { url: string }
  webhook_base: /api/v1/webhooks
  webhook_endpoints:
    - method: POST
      path: /stripe
      auth: Stripe-Signature
      response: 200 { ok: true }
external_apis:
  - POST /v1/checkout/sessions
  - GET /v1/subscriptions/:id
env:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - STRIPE_PRICE_ESSENTIAL_MONTHLY_ID
  - STRIPE_PRICE_ESSENTIAL_ANNUAL_ID
  - STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID
  - STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID
  - STRIPE_SUCCESS_URL
  - STRIPE_CANCEL_URL
```

## Authorization & RLS

- `/checkout` requires `authMiddleware`.
- Webhook does not require JWT auth; it authenticates with Stripe's signed webhook header.
- `userId` in Stripe metadata comes from the authenticated JWT on checkout.
- RLS is not directly used here; plan changes are delegated to subscription use cases/repo.

## Contracts (Zod/DTO)

- **Checkout body**: `{ tier: "essential" | "professional", period: "monthly" | "annual" }`
- **Checkout response**: `{ url: string }`
- **Webhook events handled**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

## Errors

| Status | When                                     | Message/code                   |
| ------ | ---------------------------------------- | ------------------------------ |
| 400    | Invalid checkout tier                    | `INVALID_PLAN`                 |
| 400    | Invalid checkout period                  | `INVALID_PERIOD`               |
| 500    | Stripe secret key missing                | `Stripe nao configurado`       |
| 500    | Stripe Price ID missing                  | `Preco Stripe nao configurado` |
| 400    | Stripe webhook signature invalid/missing | `INVALID_STRIPE_SIGNATURE`     |

## Events / Side effects

- `createCheckoutUrl` creates a hosted Stripe Checkout Session.
- `handleEvent` activates/deactivates Premium via `SubscriptionUseCases`.
- Webhook handling is idempotent at the plan-state level.

## Performance

- Checkout creation makes one Stripe API call.
- `checkout.session.completed` may make one Stripe subscription retrieve call when the subscription is not expanded.
- `customer.subscription.*` events are handled from the webhook payload without extra API calls.
- Events are infrequent and no cache is used.

## Security

- Stripe secret key is server-only.
- Stripe webhook signature is verified with the official SDK.
- Client cannot choose `userId`; the backend writes it from JWT into Stripe metadata.
- The webhook endpoint is mounted before JSON parsing so signature verification uses the exact raw body.

## Test matrix

### Domain

- Price selection for tier + period.
- Tier resolution from metadata/price id (fallback professional).
- Subscription user ID extraction from metadata.
- Active/trialing activation.
- Canceled deactivation.
- Past-due ignore behavior.

### UseCases

- Checkout Session creation with metadata and selected Price.
- Missing Price ID error.
- Checkout completion activates Premium.
- Deleted subscription deactivates Premium.
- Unrelated events ignored.

## Examples

```http
POST /api/v1/payments/stripe/checkout
Authorization: Bearer <jwt>
Content-Type: application/json

{ "tier": "essential", "period": "monthly" }

=> 200 { "url": "https://checkout.stripe.com/c/pay/cs_..." }
```

```http
POST /api/v1/webhooks/stripe
Stripe-Signature: t=...,v1=...

{ "type": "checkout.session.completed", "data": { "object": { ... } } }

=> 200 { "ok": true }
```

## Change log / Decisions

- Stripe is the active hosted checkout path.
- Products/Prices are dashboard-managed and referenced by env vars.
- Mobile opens Stripe Checkout in the system browser.
- Webhooks are the source of truth for plan activation.
- 2026-07-01: **três planos** — checkout passou de `{plan}` para `{tier, period}` e o config de 2 price ids para 4 (`STRIPE_PRICE_{ESSENTIAL,PROFESSIONAL}_{MONTHLY,ANNUAL}_ID`). O tier ativado vem de `subscription.metadata.tier` (ou casando o price id; fallback `professional` p/ assinaturas Premium legadas). Webhook chama `activatePlan(userId, tier, expiresAt)` / `deactivatePlan`.
