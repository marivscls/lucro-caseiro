# Notifications — API context

## Purpose

Register Expo push tokens for authenticated devices and send transactional alerts for public service booking requests.

## Non-goals

- Schedule local reminders or marketing campaigns.
- Track Expo delivery receipts after the initial push ticket.
- Expose device tokens through the public Supabase Data API.

## Boundaries & Ownership

- The notifications feature owns token registration, token removal and Expo delivery.
- Catalog owns creation of public booking requests and invokes notifications only after persistence.
- The mobile app owns permission prompts, obtaining the Expo token and handling notification taps.

## Code pointers

- `notifications.routes.ts`: authenticated HTTP endpoints.
- `notifications.usecases.ts`: token lifecycle and transactional message composition.
- `notifications.repo.pg.ts`: Postgres persistence.
- `expo-push.ts`: Expo Push Service adapter and batching.
- `packages/database/src/migrations/048_push_notification_tokens.sql`: production schema.

## Data Model

`push_notification_tokens` is keyed by Expo token and stores `user_id`, `brand_id`, platform and timestamps. The user foreign key cascades on deletion; `(user_id, brand_id)` is indexed for delivery lookup. RLS is enabled with no public policies because access is backend-only.

## Invariants

- A token belongs to one user and brand at a time.
- Platform is either `android` or `ios`.
- Removing a token requires both the authenticated user id and token.
- A failed push never rolls back a persisted booking request.

## Operations

- `POST /api/v1/notifications/push-token` upserts the current device token.
- `DELETE /api/v1/notifications/push-token` removes the current user's token.
- `notifyServiceBooking` loads tokens for the owner and brand, sends in Expo batches and removes tokens reported as `DeviceNotRegistered`.

## Authorization & RLS

Both token endpoints require `authMiddleware`; user identity comes from the verified bearer token. Clients cannot select another user. The table has RLS enabled and no Data API policies; the API accesses it through the backend Postgres connection.

## Contracts (Zod/DTO)

Registration accepts a strict object containing a valid Expo token and `platform: "android" | "ios"`. Removal accepts a strict object containing the token. Successful requests return HTTP 204.

## Errors

- Authentication and Zod errors use the shared API error middleware.
- Non-2xx Expo responses throw from the provider.
- Catalog catches delivery failures, logs a warning and still returns the created booking.

## Events / Side effects

Registration writes a token row. Booking notification sends an external request to Expo and may delete invalid token rows. No domain event or queue is emitted.

## Performance

The lookup uses the `(user_id, brand_id)` index. Expo messages are split into batches of at most 100 tokens.

## Security

Push tokens are treated as private device identifiers: they are never returned by an endpoint, registration is authenticated, removal is ownership-scoped and RLS blocks direct Data API access.

## Test matrix

- Use case: registration delegates user, brand and platform correctly.
- Use case: booking delivery removes invalid tokens and skips Expo when no token exists.
- Provider: successful Expo request and `DeviceNotRegistered` response.
- Catalog: push runs after persistence and failure remains best-effort.

## Examples

`POST /api/v1/notifications/push-token` with `{ "token": "ExponentPushToken[device]", "platform": "android" }` registers the authenticated device for the active brand.

## Change log / Decisions

- 2026-08-04: added remote push for new public service booking requests.
- 2026-08-04: kept delivery synchronous and best-effort; a queue and receipt tracking are outside the current scope.
