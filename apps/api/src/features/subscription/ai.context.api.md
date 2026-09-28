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
  - `google-play.client.ts` for Android purchase-token validation fallback and subscriptionsv2 snapshots.
  - `shared/middleware/pubsub-push-auth.ts` for Pub/Sub push OIDC verification (RTDN webhook).
  - `features/email/subscription-lifecycle-email.ts` for best-effort transactional notifications.
- **Dependents:**
  - Mobile profile/settings/plans screens.
  - Payments use cases call `activatePlan(userId, plan, expiresAt)` / `deactivatePlan`.
  - Google Play RTDN (`GooglePlayNotificationsUseCases`) calls the same `activatePlan` / `deactivatePlan`.
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
| `google-play-rtdn.routes.ts`    | Pub/Sub push webhook for Google Play RTDN    |
| `google-play-rtdn.usecases.ts`  | Applies a Play notification to plan state    |
| `google-play-rtdn.domain.ts`    | Push body parsing and plan decision rules    |
| `google-play-rtdn.*.test.ts`    | RTDN route, use case and domain tests        |
| `subscription.usecases.test.ts` | Subscription use case tests                  |
| `subscription.domain.test.ts`   | Domain helper tests                          |

## Data Model

- User profile and plan state live on the users table.
- `users.plan` is the enum `plan_type = free | essential | professional` (+ legacy `premium`, kept in the enum but normalized to `professional` on read). Optional `users.planExpiresAt`.
- `planExpiresAt = null` means the paid plan has no known expiry from the provider.
- `users.plan_is_trial` (boolean, default false; `UserProfile.planIsTrial`) is true while the plan came from the free Essencial trial, not from a payment.
- The plan matrix (limits + feature flags) is the single source of truth in `@lucro-caseiro/contracts` (`PLAN_LIMITS`, `PLAN_FEATURES`, `planLimit`, `planHasFeature`, `resolveActivePlan`, `hasActiveFeature`). Free volume limits: sales unlimited (`null`), clients 50, products 30, recipes 5, packaging 3, suppliers 3. Essencial removes volume limits but keeps suppliers capped at 3, and gains the `exportBasic` feature (PDF do resumo mensal — ADR-0005). Profissional unlocks everything (all premium features + `exportBasic` + suppliers/compras).
- `subscription_purchase_claims(user_id, provider, token_hash)` links a verified Play purchase token (SHA-256 only) to one account. `hasPurchaseClaim(userId, provider, tokenHash)` is the user-scoped lookup the RTDN flow uses.
- The plan source (Stripe x Google Play) is **not** stored; RTDN decisions compare `planExpiresAt` with the Play expiry instead.
- Freemium usage counts are read from feature tables and converted into limits per active plan.

## Invariants

- `userId` always comes from the Supabase JWT via `authMiddleware`.
- Client cannot set a paid `plan` through profile update.
- Every NEW account starts on a 7-day Essencial trial (`ESSENTIAL_TRIAL_DAYS`): `plan = essential`, `planExpiresAt = now + 7d`, `planIsTrial = true`. Granted only when the `users` row is inserted (signup trigger `handle_new_user`, auth-middleware fallback insert, `upsertProfile` insert); never on conflict/update, so existing accounts are untouched. The trial ends by date through `resolvePlan` (no job).
- `updatePlan` (every purchase/provider write, including `deactivatePlan`) sets `planIsTrial = false`.
- `activatePlan` treats an active trial as Free: buying during the trial records `subscription_completed` and sends `activated`.
- `deactivatePlan` is a no-op while the trial is active (a Stripe/Play cancel or expiry can never end the trial early); RTDN also ignores an inactive purchase with `trial_in_progress` and never lets a trial block an active purchase.
- Direct Data API access to `users` and `subscription_purchase_claims` is denied for `PUBLIC`, `anon`, and `authenticated`; versioned RLS/grants hardening preserves API-only billing and profile writes (ADR-0010).
- `resolvePlan(plan, expiresAt)` (via contracts `resolveActivePlan`) falls back to `free` when `planExpiresAt` is in the past, and normalizes legacy `premium` → `professional`.
- Provider sync activates a paid plan only after server-side validation; the tier comes from the purchased product id.
- If Google Play returns free/inactive, `/sync-plan` returns the current profile instead of downgrading other payment channels.
- Canceled but unexpired Google Play subscriptions remain paid until their expiry time.
- A Free→paid transition sends `activated`; an expiration extension on the same paid plan sends `renewed`; a paid→Free transition sends `cancelled`. Provider retries are deduplicated by stable email keys.
- Email delivery failure is logged without reverting a provider-confirmed plan change.
- RTDN never trusts the notification body: it only carries the purchase token; plan, expiry and owner (`obfuscatedExternalAccountId`) come from subscriptionsv2.
- RTDN only acts when the owner already claimed that token hash via `/sync-plan` (`hasPurchaseClaim`); a notification can never grant a plan to an account that did not sync the purchase from the app.
- RTDN active purchase → `activatePlan(owner, tier, playExpiry)` (renewal), unless the current paid plan has no known expiry or expires later than Play (never shortens another channel's plan).
- RTDN inactive purchase → `deactivatePlan(owner)` only when the account is not already Free and its `planExpiresAt` is known and not later than the Play expiry (never removes a newer Stripe plan).
- RTDN is idempotent: redelivery re-reads Google and rewrites the same state; renewal/cancel emails keep their stable deduplication keys.

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
webhooks:
  base: /api/v1/webhooks
  endpoints:
    - method: POST
      path: /google-play
      auth: Pub/Sub push OIDC (Authorization Bearer, audience GOOGLE_PLAY_RTDN_AUDIENCE, email GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT_EMAIL, email_verified)
      body: Pub/Sub push envelope; message.data = base64 DeveloperNotification
      response: "{ ok: true, result: processed | ignored }"
```

## Authorization & RLS

- Every `/api/v1/subscription` route uses `authMiddleware`.
- `POST /api/v1/webhooks/google-play` has no app JWT; every request must carry a Google-signed OIDC token (verified by `OAuth2Client.verifyIdToken`) for the configured audience, with `email` equal to the configured push service account and `email_verified = true`. It is mounted before the global rate limit, like the Stripe webhook.
- Route handlers use `getUserId(req)` and ignore any client-sent user id.
- Database access is server-side through the repo layer.

## Contracts (Zod/DTO)

- `UpdateProfileDto` from `@lucro-caseiro/contracts` validates profile updates.
- `AndroidPurchaseDto` validates `/sync-plan`.
- `productId` must be one of the four tier SKUs (`lucrocaseiro_{essential,professional}_{monthly,annual}`) or a legacy `lucrocaseiro_premium_{monthly,annual}`.
- `purchaseToken` must be a non-empty string.

## Errors

| Status | When                                 | Message/code                                                                          |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------- |
| 401    | Missing/invalid JWT                  | auth middleware response                                                              |
| 404    | Profile not found                    | `NotFoundError`                                                                       |
| 503    | Google Play service account missing  | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON nao configurado...`                                 |
| 503    | Google Play verification unavailable | `Nao foi possivel verificar assinatura no Google Play`                                |
| 503    | RTDN env vars missing                | `GOOGLE_PLAY_RTDN_NOT_CONFIGURED` (does nothing)                                      |
| 401    | RTDN OIDC token missing/invalid      | `INVALID_PUBSUB_TOKEN`                                                                |
| 503    | RTDN Google certs/API unavailable    | `PUBSUB_TOKEN_VERIFICATION_UNAVAILABLE` / `GOOGLE_PLAY_UNAVAILABLE` (Pub/Sub retries) |
| 200    | RTDN test/other/foreign package      | `{ ok: true, result: "ignored" }`                                                     |

## Events / Side effects

- `activatePlan(userId, plan, expiresAt)` writes the paid plan state.
- `deactivatePlan` writes Free plan state.
- `syncPlanFromProvider` may update plan state after provider validation.
- `POST /api/v1/webhooks/google-play` may renew (`activatePlan`) or end (`deactivatePlan`) a Play plan without the app being opened. Logs `google_play_rtdn` with messageId, notificationType, userId and result; never the purchase token.
- Plan transitions may send lifecycle emails; `notifyPaymentFailed` sends the Stripe retry warning without changing plan state.
- `getLimits` reads usage counters and returns the active plan's limits.

## Performance

- Profile and limits endpoints perform bounded database reads.
- `/sync-plan` performs one Google Play API request.
- Each RTDN message performs at most one Google certs fetch (cached), one subscriptionsv2 request and bounded DB reads/writes.
- No cache is used; data is inexpensive and plan state must be fresh.

## Security

- Google Play service account credentials stay server-side.
- Purchase tokens are verified server-side before Premium activation.
- Stripe webhook-driven plan changes go through these use cases, not through client input.
- RTDN: OIDC token checked for signature, audience, issuer, expiry, email and `email_verified`; package name must match `GOOGLE_PLAY_PACKAGE_NAME`; purchase token is never logged or stored raw.

## Test matrix

- Free and Premium limit calculation.
- Expired Premium detection.
- Profile fetch/update.
- Premium activation/deactivation.
- Google Play active/canceled/expired/mismatched purchase handling.
- Activation, renewal, cancellation and payment-failure notification transitions.
- Provider unavailable error paths.
- RTDN: push body parsing (test/other/foreign package/invalid), renewal, deactivation, newer-plan protection, unknown plan source, unclaimed token, idempotent redelivery, OIDC 401/503 paths, token never logged.

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

```http
POST /api/v1/webhooks/google-play
Authorization: Bearer <GOOGLE_SIGNED_OIDC_TOKEN>
Content-Type: application/json

{ "message": { "messageId": "123", "data": "<base64 DeveloperNotification>" }, "subscription": "projects/<p>/subscriptions/<s>" }

=> 200 { "ok": true, "result": "processed" }
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

## Atualização de tier do Catálogo — 2026-07-25

Esta regra substitui as menções anteriores que colocavam `catalogPremium` e
`catalogCustomization` no Profissional: catálogo completo e personalização estão
disponíveis a partir do **Essencial**. Somente o Gratuito limita a vitrine e oculta a
personalização.

- 2026-08-23: **cadastro novo volta ao Free**. A campanha `professional-first-100-2026` (1 mês de Profissional para os primeiros 100) não vale mais para quem chega agora. Quem já recebeu o presente mantém plano e data de expiração. A 052 rodava no boot da API e religava `active` enquanto houvesse vaga; a 062 (depois da 052/057) desliga a campanha e tira a concessão do `handle_new_user`. O e-mail da campanha continua só para concessão já gravada e ainda não enviada.

- 2026-09-07: teste de notificação de ativação usa expiração futura relativa ao relógio, evitando que a fixture vencida em 06/09 transforme o cenário de ativação em plano expirado. Regras de assinatura inalteradas.

## Catálogo completo no Essencial — 2026-09-09

O Essencial inclui catálogo completo, personalização e galeria com até 3 fotos por produto (principal + 2 extras). A feature extraPhotos pertence ao Essencial e ao Profissional; o Gratuito mantém 1 foto. Paywall de productPhotos recomenda Essencial. Os demais recursos exclusivos do Profissional permanecem inalterados.

## Vendas ilimitadas no Gratuito — 2026-09-23

Decisão do dono do produto: registrar vendas é o hábito diário e não deve travar no Gratuito. `PLAN_LIMITS.free.maxSalesPerMonth = null` (ilimitado); `maxClients` 20→**50** e `maxProducts` 15→**30**. Receitas (5), embalagens (3), fornecedores (3) e o catálogo com 3 produtos seguem iguais. `freemiumGuard("sales")` continua no `POST /api/v1/sales` e passa a liberar sempre (limite `null`). A mensagem de limite de vendas não cita número.

## Google Play RTDN — 2026-09-23

Problema: o plano Play so era sincronizado quando o app chamava `POST /sync-plan`. `planExpiresAt` guarda a expiracao do periodo pago e `resolvePlan` cai para Free quando ela passa, entao um assinante que renovava sem abrir o app perdia o plano ate abrir; e um reembolso/revogacao nunca era refletido. Agora `POST /api/v1/webhooks/google-play` recebe as Real-time Developer Notifications via Pub/Sub push (OIDC) e reaplica o estado do subscriptionsv2. Env vars: `GOOGLE_PLAY_RTDN_AUDIENCE` e `GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT_EMAIL` (sem elas, 503). Setup no Play Console/GCP em `docs/subscription-setup.md`. Decisao: como a origem do plano nao e gravada, a desativacao so acontece quando `planExpiresAt` nao passa da expiracao da Play (e a renovacao nao encurta um plano mais longo); com isso uma revogacao que antecipa a expiracao da Play pode nao derrubar o plano na hora, e o acesso termina na expiracao ja gravada.

## Teste grátis do Essencial — 2026-09-24

Decisão do dono do produto: toda conta nova ganha 7 dias do Essencial, sem cartão, e volta sozinha para o Gratuito. Migration `20260924100000_essential_trial_signup.sql` (roda no boot, depois da 062): adiciona `users.plan_is_trial boolean NOT NULL DEFAULT false` e redefine `handle_new_user` para inserir `plan = 'essential'`, `plan_expires_at = now() + 7 days`, `plan_is_trial = true` só no INSERT. `newAccountTrialPlan()` (contracts) faz o mesmo no insert do `upsertProfile` e do fallback do `authMiddleware`. Os gates continuam usando `plan` + `planExpiresAt`. Não há evento de analytics `trial_started` (o teste nasce no trigger do banco, sem ponto único na API); dá para medir por `users.plan_is_trial`. Excluir a conta e recriar com o mesmo e-mail gera uma conta nova e, portanto, um novo teste.
