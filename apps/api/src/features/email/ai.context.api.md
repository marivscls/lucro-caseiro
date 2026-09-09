# Email — API context

## Purpose

Send transactional Lucro Caseiro emails through a verified Resend domain.

## Non-goals

- Provide a public or authenticated bulk-email endpoint.
- Run marketing campaigns or manage mailing-list consent.
- Receive email or host an inbox.

## Boundaries & Ownership

- The email feature owns the Resend HTTP adapter and its operational delivery probe.
- Business features own message composition when transactional emails are added to their flows.
- Resend owns delivery, bounce handling and sender-domain verification.

## Code pointers

- `resend-email.ts`: provider adapter, required user agent and delivery contract.
- `send-test-email.ts`: explicit command-line delivery probe.
- `send-test-email.args.ts`: strict parser for pnpm-forwarded probe arguments.
- `professional-trial-email.ts`: final one-month Professional gift copy and branded HTML.
- `grant-professional-trials.ts`: fixed allowlist campaign with dry-run, explicit confirmation and verification modes.
- `subscription-lifecycle-email.ts`: activated, renewed, payment-failed and cancelled subscription messages.
- `resend-email.test.ts`: provider-boundary tests.
- `apps/api/src/config.ts`: backend-only email environment variables.

## Data Model

The signup automation stores its activation boundary and delivery jobs in the private `app_email` schema. `welcome_settings` records activation once; `welcome_jobs` has one row per user, a frozen payload, claim token, retry state and provider message id. User deletion cascades to jobs.

## Invariants

- The API key never reaches a client bundle or log.
- Every send has an idempotency key.
- The test command requires an explicit recipient and `--confirm`.
- Transactional sending uses the already verified `lucrocaseiro.com.br` domain.
- Existing `supabase-smtp` and `Onboarding` keys are not reused or changed; the API gets its own domain-restricted sending key.
- Branded HTML uses the canonical `@lucro-caseiro/brands` palette and loads dedicated illustrations from public HTTPS assets on `lucrocaseiro.com.br`; images must not be email attachments because Gmail exposes them as downloadable files.
- The primary CTA uses the existing production native scheme `lucrocaseiro://`; it must not point to the PWA URL.
- The 2026-08-06 gift campaign and lifecycle templates use the neutral greeting `Oi!`; they never interpolate a profile name.
- Subscription lifecycle sends use event/state-derived idempotency keys so provider retries do not duplicate messages.

## Operations

- `WELCOME_EMAIL_ENABLED=true` starts a poller inside the production API. It requires `RESEND_API_KEY` and a monitored `EMAIL_REPLY_TO`; without either it stays disabled and logs a configuration error. No Codex scheduler is needed for this application event workflow.
- Startup applies the CLI-generated `20260909155011_welcome_email_automation.sql` migration through `welcome-email.setup.ts`. This step creates tables only; the first enabled worker records activation.
- Only active accounts whose public and Auth creation dates are at/after activation, whose email is confirmed, and whose public profile is at least five minutes old are eligible. Legacy accounts with no app membership are included; accounts with memberships must have an active `lucro-caseiro` membership.
- The worker queues at most 20 candidates and claims one email per 60-second tick using `FOR UPDATE SKIP LOCKED`. Restarting or running multiple replicas preserves delivery state.
- Each message freezes its recipient, sender, Reply-To, content and `welcome-v1-{userId}` key before sending. Retries use exactly that payload. Eight failures or a 23-hour ambiguity window require operator review rather than risking a duplicate after Resend's 24-hour idempotency expiry.
- Accounts deactivated, deleted, banned or with changed/unconfirmed email before claim are cancelled. No welcome message is backfilled for existing customers.
- `welcome-email.ts` personalizes the approved second template by first name, business and service/product profile; all user-provided HTML is escaped. CTA remains `lucrocaseiro://`, site link is secondary, signature is Lucro Caseiro. The help invitation points to the existing Support area and monitored email.
- These internal lifecycle sweeps are authorized across newly created accounts; each enqueue/acknowledgement/retry is scoped to the user and claim token. They expose no public endpoint or user-controlled recipient.

- `pnpm --filter @lucro-caseiro/api email:test -- <recipient> --confirm` sends one probe.
- `pnpm --filter @lucro-caseiro/api email:grant-professional-trials` is dry-run by default; `-- --confirm-8-users` is the one-time mutation/send gate and `-- --verify-8-users` is read-only verification.
- The sender posts text and HTML alternatives to the Resend Emails API.

## Authorization & RLS

There is no HTTP route. The `app_email` schema and its RLS-enabled tables revoke access from PUBLIC, anon and authenticated. Only the privileged backend database connection manages jobs. There are no security-definer functions or signup triggers.

## Contracts (Zod/DTO)

The probe validates its recipient with Zod. The provider adapter requires recipient, subject, text, HTML and idempotency key, and validates the returned message id.

## Errors

Missing configuration fails before sending. Non-success provider responses include the HTTP status and safe provider message; malformed success payloads are rejected.

## Events / Side effects

A confirmed probe sends exactly one external email. Subscription transitions send activation, renewal, failed-payment or cancellation messages through the same adapter. The enabled welcome worker sends the approved step-by-step template to eligible future signups and records provider acceptance (which is distinct from inbox delivery).

## Performance

The current flow performs one synchronous HTTPS request. Queueing and batching are outside this probe's scope.

## Security

`RESEND_API_KEY` is backend-only. Commands and diagnostics must report only whether it exists, never its value.

## Test matrix

- Successful request carries authorization, multipart alternatives and idempotency.
- Provider errors remain actionable without exposing credentials.
- Missing credentials fail closed.
- The documented pnpm command accepts its forwarded `--` separator and still requires `--confirm`.
- The HTML contains the canonical rose and warm-neutral colors, the reference two-column composition, final gift copy, CTA, five public PNG assets and a plain-text alternative.
- Lifecycle templates cover all four event kinds, use a neutral greeting and link back to the native app.

## Examples

`pnpm --filter @lucro-caseiro/api email:test -- pessoa@example.com --confirm`

## Change log / Decisions

- 2026-08-06: chose the existing Resend account, native `fetch` over a new dependency, the already verified `lucrocaseiro.com.br` domain in São Paulo, and a dedicated sending key for the API.
- 2026-08-23: stopped granting 1 month of Professional on signup. Campaign email remains only for existing unsent grants.
- 2026-09-09: added durable opt-in welcome automation for future confirmed signups, using the approved step-by-step design, business-specific instructions, native-app CTA and email support. Provider idempotency reference: https://resend.com/docs/dashboard/emails/idempotency-keys.
