# ai.context.api.md - Subscription

---

## Purpose

Backend ownership for user profile, Free/Premium plan state, freemium limits, and provider-backed Premium validation.

## Non-goals

- Does not create payment checkout sessions; Stripe checkout lives in `features/payments`.
- Does not store payment history.
- Does not trust client-sent plan changes.
- Does not directly process card or payment method data.

## Boundaries & Ownership

- **Depends on:**
  - `subscription.repo.pg.ts` for profile and plan persistence.
  - `subscription.domain.ts` for freemium limit calculation.
  - `google-play.client.ts` for Android purchase-token validation fallback.
- **Dependents:**
  - Mobile profile/settings/plans screens.
  - Payments use cases call `activatePremium` / `deactivatePremium`.
  - Feature limit guards call `getLimits` / `isPremium`.

## Code pointers

| File                            | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `subscription.routes.ts`        | Profile, limits, and provider sync routes    |
| `subscription.usecases.ts`      | Profile/limits/plan orchestration            |
| `subscription.domain.ts`        | Freemium limits and premium activity helpers |
| `subscription.repo.pg.ts`       | Drizzle/Postgres persistence                 |
| `subscription.types.ts`         | Interfaces and provider purchase types       |
| `google-play.client.ts`         | Google Play subscription token validation    |
| `google-play.client.test.ts`    | Google Play validation tests                 |
| `subscription.usecases.test.ts` | Subscription use case tests                  |
| `subscription.domain.test.ts`   | Domain helper tests                          |

## Data Model

- User profile and plan state live on the users table.
- Premium state is represented by `users.plan = "premium"` and optional `users.planExpiresAt`.
- `planExpiresAt = null` means Premium has no known expiry from the provider.
- Freemium usage counts are read from feature tables and converted into limits.

## Invariants

- `userId` always comes from the Supabase JWT via `authMiddleware`.
- Client cannot set `plan = premium` through profile update.
- `isPremiumActive` returns false when `planExpiresAt` is in the past.
- Provider sync activates Premium only after server-side validation.
- If Google Play returns free/inactive, `/sync-plan` returns the current profile instead of downgrading other payment channels.
- Canceled but unexpired Google Play subscriptions remain Premium until their expiry time.

## Operations

```yaml
feature: subscription
app: api
api:
  base: /api/v1/subscription
  endpoints:
    - method: GET
      path: /profile
      auth: required
      response: UserProfile
    - method: PATCH
      path: /profile
      auth: required
      body: UpdateProfile
      response: UserProfile
    - method: GET
      path: /limits
      auth: required
      response: FreemiumLimits
    - method: POST
      path: /sync-plan
      auth: required
      body:
        platform: android
        productId: lucrocaseiro_premium_monthly | lucrocaseiro_premium_annual
        purchaseToken: string
      response: UserProfile
```

## Authorization & RLS

- Every route uses `authMiddleware`.
- Route handlers use `getUserId(req)` and ignore any client-sent user id.
- Database access is server-side through the repo layer.

## Contracts (Zod/DTO)

- `UpdateProfileDto` from `@lucro-caseiro/contracts` validates profile updates.
- `AndroidPurchaseDto` validates `/sync-plan`.
- `productId` must be `lucrocaseiro_premium_monthly` or `lucrocaseiro_premium_annual`.
- `purchaseToken` must be a non-empty string.

## Errors

| Status | When                                 | Message/code                                           |
| ------ | ------------------------------------ | ------------------------------------------------------ |
| 401    | Missing/invalid JWT                  | auth middleware response                               |
| 404    | Profile not found                    | `NotFoundError`                                        |
| 503    | Google Play service account missing  | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON nao configurado...`  |
| 503    | Google Play verification unavailable | `Nao foi possivel verificar assinatura no Google Play` |

## Events / Side effects

- `activatePremium` writes Premium plan state.
- `deactivatePremium` writes Free plan state.
- `syncPremiumFromProvider` may update plan state after provider validation.
- `getLimits` reads usage counters and returns current free/premium limits.

## Performance

- Profile and limits endpoints perform bounded database reads.
- `/sync-plan` performs one Google Play API request.
- No cache is used; data is inexpensive and plan state must be fresh.

## Security

- Google Play service account credentials stay server-side.
- Purchase tokens are verified server-side before Premium activation.
- Stripe webhook-driven plan changes go through these use cases, not through client input.

## Test matrix

- Free and Premium limit calculation.
- Expired Premium detection.
- Profile fetch/update.
- Premium activation/deactivation.
- Google Play active/canceled/expired/mismatched purchase handling.
- Provider unavailable error paths.

## Examples

```http
GET /api/v1/subscription/profile
Authorization: Bearer <jwt>

=> 200 { "plan": "free", ... }
```

```http
POST /api/v1/subscription/sync-plan
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "platform": "android",
  "productId": "lucrocaseiro_premium_monthly",
  "purchaseToken": "<GOOGLE_PLAY_PURCHASE_TOKEN>"
}
```

## Change log / Decisions

- Subscription feature owns plan state; payment providers only trigger use cases.
- Stripe is the active checkout/webhook integration in `features/payments`.
- Google Play validation remains as a provider fallback for Android store flows.
- Downgrade on failed Google Play sync is intentionally conservative to avoid removing Stripe-granted Premium.
- 2026-06-15: **avatar do perfil** (migration `018_user_avatar.sql`): coluna `users.avatar_url` (NULLABLE). `UserProfile.avatarUrl` + `UpdateProfile.avatarUrl?` no contrato; propagado por `upsertProfile`/`updateProfile` (merge mantém o atual quando não enviado). Sem ela, o app mostra a inicial do nome.
- 2026-06-16: **limite de produtos (20 no free)** — `products` adicionado a `ResourceCounts`/`ResourceType`/`FreemiumConfig` (`maxProducts = 20`) e os campos `maxProducts`/`currentProducts` ao contrato `FreemiumLimits`. `getResourceCounts` conta produtos ativos; `freemiumGuard("products")` aplicado no `POST /api/v1/products`. Mensagem de limite em `LIMIT_MESSAGES.products`.
- 2026-06-16: **vendas com teto alto no free (200/mês)** — `FREE_PLAN_LIMITS.maxSalesPerMonth = 200` (era 30; chegou a ser Infinity por algumas horas na mesma data). Teto folgado (~7/dia) pra não atrapalhar o uso diário, mas finito (gatilho suave + barreira de abuso). `freemiumGuard("sales")` mantido no `POST /api/v1/sales`. O app filtra o "uso atual" por limite finito (`Number.isFinite`), então qualquer recurso ilimitado não aparece lá.
- 2026-06-16: **free enxuto (recalibração)** — `maxSalesPerMonth` 200→**50**/mês e `maxProducts` 20→**15**; catálogo público free 5→**3** produtos. Motivo: dev solo bootstrapped — o free precisa converter cedo e ser barato de servir (o caro — catálogo público, exportação, relatórios completos — fica no Premium). `maxClients` (20), `maxRecipes` (5) e `maxPackaging` (3) mantidos.
