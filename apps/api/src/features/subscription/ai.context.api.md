# ai.context.api.md - Subscription

---

## Purpose

Backend ownership for user profile, plan state (Free / Essencial / Profissional), freemium limits, and provider-backed plan validation.

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
  - Payments use cases call `activatePlan(userId, plan, expiresAt)` / `deactivatePlan`.
  - Limit guards call `getLimits` and `freemiumGuard`; feature guards call `requireFeature` / `hasActiveFeature`.

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
- `users.plan` is the enum `plan_type = free | essential | professional` (+ legacy `premium`, kept in the enum but normalized to `professional` on read). Optional `users.planExpiresAt`.
- `planExpiresAt = null` means the paid plan has no known expiry from the provider.
- The plan matrix (limits + feature flags) is the single source of truth in `@lucro-caseiro/contracts` (`PLAN_LIMITS`, `PLAN_FEATURES`, `planLimit`, `planHasFeature`, `resolveActivePlan`, `hasActiveFeature`). Free volume limits: sales 30/mês, clients 20, products 15, recipes 5, packaging 3, suppliers 3. Essencial removes volume limits but keeps suppliers capped at 3, and gains the `exportBasic` feature (PDF do resumo mensal — ADR-0005). Profissional unlocks everything (all premium features + `exportBasic` + suppliers/compras).
- Freemium usage counts are read from feature tables and converted into limits per active plan.

## Invariants

- `userId` always comes from the Supabase JWT via `authMiddleware`.
- Client cannot set a paid `plan` through profile update.
- `resolvePlan(plan, expiresAt)` (via contracts `resolveActivePlan`) falls back to `free` when `planExpiresAt` is in the past, and normalizes legacy `premium` → `professional`.
- Provider sync activates a paid plan only after server-side validation; the tier comes from the purchased product id.
- If Google Play returns free/inactive, `/sync-plan` returns the current profile instead of downgrading other payment channels.
- Canceled but unexpired Google Play subscriptions remain paid until their expiry time.

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
        productId: lucrocaseiro_essential_monthly | lucrocaseiro_essential_annual | lucrocaseiro_professional_monthly | lucrocaseiro_professional_annual | (legacy) lucrocaseiro_premium_monthly | lucrocaseiro_premium_annual
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
- `productId` must be one of the four tier SKUs (`lucrocaseiro_{essential,professional}_{monthly,annual}`) or a legacy `lucrocaseiro_premium_{monthly,annual}`.
- `purchaseToken` must be a non-empty string.

## Errors

| Status | When                                 | Message/code                                           |
| ------ | ------------------------------------ | ------------------------------------------------------ |
| 401    | Missing/invalid JWT                  | auth middleware response                               |
| 404    | Profile not found                    | `NotFoundError`                                        |
| 503    | Google Play service account missing  | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON nao configurado...`  |
| 503    | Google Play verification unavailable | `Nao foi possivel verificar assinatura no Google Play` |

## Events / Side effects

- `activatePlan(userId, plan, expiresAt)` writes the paid plan state.
- `deactivatePlan` writes Free plan state.
- `syncPlanFromProvider` may update plan state after provider validation.
- `getLimits` reads usage counters and returns the active plan's limits.

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
  "productId": "lucrocaseiro_essential_monthly",
  "purchaseToken": "<GOOGLE_PLAY_PURCHASE_TOKEN>"
}
```

## Change log / Decisions

- Subscription feature owns plan state; payment providers only trigger use cases.
- Stripe is the active checkout/webhook integration in `features/payments`.
- Google Play validation remains as a provider fallback for Android store flows.
- Downgrade on failed Google Play sync is intentionally conservative to avoid removing Stripe-granted Premium.
- 2026-06-29: Google Play subscriptions may return the parent subscription productId plus offerDetails.basePlanId; validation accepts known Premium parent ids/base plans and still requires active, unexpired provider state.
- 2026-06-15: **avatar do perfil** (migration `018_user_avatar.sql`): coluna `users.avatar_url` (NULLABLE). `UserProfile.avatarUrl` + `UpdateProfile.avatarUrl?` no contrato; propagado por `upsertProfile`/`updateProfile` (merge mantém o atual quando não enviado). Sem ela, o app mostra a inicial do nome.
- 2026-06-16: **limite de produtos (20 no free)** — `products` adicionado a `ResourceCounts`/`ResourceType`/`FreemiumConfig` (`maxProducts = 20`) e os campos `maxProducts`/`currentProducts` ao contrato `FreemiumLimits`. `getResourceCounts` conta produtos ativos; `freemiumGuard("products")` aplicado no `POST /api/v1/products`. Mensagem de limite em `LIMIT_MESSAGES.products`.
- 2026-06-16: **vendas com teto alto no free (200/mês)** — `FREE_PLAN_LIMITS.maxSalesPerMonth = 200` (era 30; chegou a ser Infinity por algumas horas na mesma data). Teto folgado (~7/dia) pra não atrapalhar o uso diário, mas finito (gatilho suave + barreira de abuso). `freemiumGuard("sales")` mantido no `POST /api/v1/sales`. O app filtra o "uso atual" por limite finito (`Number.isFinite`), então qualquer recurso ilimitado não aparece lá.
- 2026-06-16: **free enxuto (recalibração)** — `maxSalesPerMonth` 200→**50**/mês e `maxProducts` 20→**15**; catálogo público free 5→**3** produtos. Motivo: dev solo bootstrapped — o free precisa converter cedo e ser barato de servir (o caro — catálogo público, exportação, relatórios completos — fica no Premium). `maxClients` (20), `maxRecipes` (5) e `maxPackaging` (3) mantidos.
- 2026-07-01: **planos comerciais — free/premium → free/essential/professional** (migration `029_commercial_plans.sql`; ver `docs/planos-comerciais.md`). O enum `plan_type` ganha `essential` e `professional`; assinantes `premium` migram para `professional` (o legado `premium` continua no enum, mas o repo normaliza para `professional` na leitura). A matriz de planos (limites + features) vira fonte única em `@lucro-caseiro/contracts` (`PLAN_LIMITS`, `PLAN_FEATURES`, `planLimit`, `planHasFeature`, `resolveActivePlan`, `hasActiveFeature`). **Limites:** `maxSalesPerMonth` free 50→**30**; Essencial remove os limites de volume (vendas/clientes/produtos/receitas/embalagens ilimitados) mas mantém **fornecedores em 3** (Fornecedores/Compras são diferenciais do Profissional); Profissional é ilimitado. **Gates de feature** (exclusivos do Profissional): `require-premium.ts`/`require-premium-photos.ts` foram substituídos por `require-feature.ts` (`requireFeature(repo, feature)` + `requireFeatureForExtraPhotos`); features: extraPhotos, catalogPremium, catalogCustomization, advancedReports, export, purchases, recurringExpenses, labelsPremium, quotesPdf, compositeProducts. Catálogo/labels passam a usar `hasActiveFeature`. Domínio: `resolvePlan`/`isPaidPlanActive`/`buildFreemiumLimits(counts, plan)`/`isLimitExceeded(resource, counts, plan)`. Usecases: `activatePlan(userId, plan, expiresAt)`/`deactivatePlan`/`getActivePlan`/`syncPlanFromProvider`; provider `getPlanState` retorna o tier pelo product id. Stripe: 4 price ids (`STRIPE_PRICE_{ESSENTIAL,PROFESSIONAL}_{MONTHLY,ANNUAL}_ID`), checkout recebe `{tier, period}` e o webhook resolve o tier pela metadata/price (fallback `professional`). Preços: Essencial R$ 29,90/mês (R$ 299/ano), Profissional R$ 69,90/mês (R$ 699/ano). **Pendências externas (fora do código):** criar os produtos/preços no painel Stripe e no Google Play e preencher os ids no `.env`.
- 2026-07-11: **`exportBasic` — Essencial ganha 1 diferencial qualitativo** (PRD melhorias pré-lançamento item 2.1, ADR-0005). Nova `PlanFeature` `exportBasic` (exportar o resumo mensal em PDF simples) entra na matriz do Essencial **e** do Profissional (`ESSENTIAL_FEATURES` em `plans.ts`, `PLAN_FEATURES.professional = essential ∪ profissional-only`). `export` (Excel + relatórios avançados) segue exclusivo do Profissional. Gate: `finance.routes.ts` — `GET /export/pdf` passa por `requireFeature(repo, "exportBasic")`, `GET /export/xlsx` continua por `requireFeature(repo, "export")` (`createFinanceRouter(useCases, exportBasicGuard?, exportGuard?, recurringGuard?)`, 4º arg agora é `recurringGuard`). Fronteira a manter (ADR-0005): se o PDF básico crescer (gráficos extras, períodos custom), isso vira `export`/Profissional — não inflar `exportBasic`.
