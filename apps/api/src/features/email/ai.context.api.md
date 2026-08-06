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
- `resend-email.test.ts`: provider-boundary tests.
- `apps/api/src/config.ts`: backend-only email environment variables.

## Data Model

No database table is used. Resend returns a provider message id for operational verification.

## Invariants

- The API key never reaches a client bundle or log.
- Every send has an idempotency key.
- The test command requires an explicit recipient and `--confirm`.
- Transactional sending uses the already verified `lucrocaseiro.com.br` domain.
- Existing `supabase-smtp` and `Onboarding` keys are not reused or changed; the API gets its own domain-restricted sending key.
- Branded HTML uses the canonical `@lucro-caseiro/brands` palette and loads dedicated illustrations from public HTTPS assets on `lucrocaseiro.com.br`; images must not be email attachments because Gmail exposes them as downloadable files.
- The primary CTA uses the existing production native scheme `lucrocaseiro://`; it must not point to the PWA URL.

## Operations

- `pnpm --filter @lucro-caseiro/api email:test -- <recipient> --confirm` sends one probe.
- The sender posts text and HTML alternatives to the Resend Emails API.

## Authorization & RLS

There is no HTTP route and no RLS surface. Only an operator with backend environment access can run the probe.

## Contracts (Zod/DTO)

The probe validates its recipient with Zod. The provider adapter requires recipient, subject, text, HTML and idempotency key, and validates the returned message id.

## Errors

Missing configuration fails before sending. Non-success provider responses include the HTTP status and safe provider message; malformed success payloads are rejected.

## Events / Side effects

A confirmed probe sends exactly one external email. Resend deduplicates the same recipient's probe for the same UTC day.

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

## Examples

`pnpm --filter @lucro-caseiro/api email:test -- pessoa@example.com --confirm`

## Change log / Decisions

- 2026-08-06: chose the existing Resend account, native `fetch` over a new dependency, the already verified `lucrocaseiro.com.br` domain in São Paulo, and a dedicated sending key for the API.
