# ai.context.mobile.md - Subscription

---

## Purpose

Mobile ownership for profile, freemium limits, paywall display, Stripe Checkout launching, and Google Play restore fallback.

## Non-goals

- Does not activate Premium directly; backend webhooks/provider validation own plan changes.
- Does not collect card details in-app.
- Does not store payment credentials.
- Does not create Stripe Products or Prices.

## Boundaries & Ownership

- **Depends on:**
  - `shared/utils/api-client` for backend calls.
  - `shared/hooks/use-auth` for JWT.
  - `expo-web-browser` for Stripe Checkout.
  - `react-native-iap` for Google Play restore/store fallback.
- **Dependents:**
  - Global modal in `app/_layout.tsx`.
  - Plans/settings screens.
  - Freemium limit guards.

## Code pointers

| File                          | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `api.ts`                      | Profile, limits, sync, and Stripe checkout calls  |
| `hooks.ts`                    | React Query hooks for profile/limits/profile edit |
| `use-stripe.ts`               | Opens Stripe Checkout in browser                  |
| `use-subscription.ts`         | Google Play Billing subscribe/restore fallback    |
| `components/paywall.tsx`      | Plan selection and CTA UI                         |
| `components/limit-banner.tsx` | Freemium usage banner                             |
| `shared/hooks/use-paywall.ts` | Global paywall visibility state                   |

## Components

- `Paywall`: shows Premium benefits, monthly/annual selection, subscribe CTA, restore action, and close action.
- `LimitBanner`: shows free-plan usage and prompts upgrade near/at limits.
- Plans screen: displays current plan, usage, comparison table, and opens the paywall.
- Settings screen: displays current plan and restore action.

## Hooks

- `useProfile()` - profile query.
- `useLimits()` - freemium limits query.
- `useUpdateProfile()` - profile update mutation.
- `useStripeCheckout()` - creates and opens Stripe Checkout URL.
- `useSubscription()` - Google Play Billing subscribe/restore fallback.
- `usePaywall` - global paywall state.
- `useLimitCheck(resource)` - limit guard helper.

## API Integration

| Endpoint                           | Method | Function               | Notes                                |
| ---------------------------------- | ------ | ---------------------- | ------------------------------------ |
| `/api/v1/subscription/profile`     | GET    | `fetchProfile`         | current profile                      |
| `/api/v1/subscription/profile`     | PATCH  | `updateProfile`        | body: `UpdateProfile`                |
| `/api/v1/subscription/limits`      | GET    | `fetchLimits`          | freemium usage                       |
| `/api/v1/subscription/sync-plan`   | POST   | `syncPlan`             | Android purchase validation fallback |
| `/api/v1/payments/stripe/checkout` | POST   | `createStripeCheckout` | Stripe subscription Checkout Session |

## Contracts

- Stripe checkout body: `{ plan: "monthly" | "annual" }`.
- Stripe checkout response: `{ url: string }`.
- Android sync body:
  - `platform: "android"`
  - `productId: "lucrocaseiro_premium_monthly" | "lucrocaseiro_premium_annual"`
  - `purchaseToken: string`
- Profile update uses `UpdateProfile` from contracts.

## Error Handling

- Missing auth token shows a login-required alert before checkout/restore.
- Stripe checkout failures show a generic retry alert.
- Google Play unavailable plans show a "Plano indisponivel" alert.
- Restore with no purchase shows a "Nenhuma assinatura encontrada" alert.
- Query invalidation refreshes plan state after returning from checkout.

## Performance

- Profile and limits use React Query caching.
- Checkout creates a URL only when the user taps subscribe.
- Browser checkout does not block app startup.
- Restore fetches available purchases on demand.

## Test matrix

- Paywall opens from limits/plans.
- Stripe checkout sends selected plan and opens returned URL.
- Subscription query invalidates after browser closes.
- Google Play restore handles no purchase, valid purchase, and provider errors.
- Free/Premium plan UI switches based on profile.

## Examples

```ts
await createStripeCheckout(token, "monthly");
```

```tsx
<Paywall onSubscribe={(period) => void payWithStripe(period)} />
```

## Change log / Decisions

- Stripe Checkout is the primary paywall checkout path.
- Legacy non-Stripe checkout was removed from the mobile flow.
- Google Play Billing code remains for restore/store fallback.
- Prices are display-only in mobile and must match Stripe Dashboard.
