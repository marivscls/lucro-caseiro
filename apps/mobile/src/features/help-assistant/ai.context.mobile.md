# Help assistant — mobile context

## Purpose

Offer immediate answers to free-text questions about using the app, plus a reviewable email handoff to the existing support team.

## Non-goals

- Generate unrestricted answers, financial advice or information outside the app documentation.
- Read or change account, financial or customer records.
- Send support emails automatically, store conversations or add a paid AI dependency.

## Components

- `HelpAssistant` is shown at the top of the existing `/support` screen for all plans.
- `help-assistant.domain.ts` contains reviewed answers and intent matching. Pricing adapts to service/beauty businesses; unsupported questions offer human support.
- Subscription questions show all three plans with prices and free limits from the shared contracts, plus navigation to `/plans`. This intent precedes product pricing and feature guides; incident and cancellation guidance keep priority.
- Users type up to 400 characters or select a suggested question. Keep at most four question/answer pairs in component memory. No analytics or persistence of question text.
- `onNavigate` accepts only a fixed set of app routes. `onContactSupport` passes the latest question (or unfinished draft) to the support screen's mailto composer. The user reviews and sends it in their email application.

## Boundaries & Ownership

This feature owns the local question-to-instruction conversation. The existing support screen owns email composition and navigation. No backend, credentials or private profile data is sent to another service.

## Code pointers

- `help-assistant.domain.ts`: reviewed answers, suggestions and route allowlist.
- `help-assistant.tsx`: question input, bounded conversation, answer actions and handoff.
- `app/support.tsx`: screen integration and existing email channel.

## Hooks

Uses component-local `useState` and the existing `useTheme` hook. The parent supplies the business profile and navigation callbacks.

## Contracts

`answerHelpQuestion(question, profile)` returns `HelpAnswer` with a guide, handoff or unknown kind, text, steps and optional allowlisted action. No network DTO or public endpoint is added.

## Error Handling

Unknown questions ask for a clearer task or offer human help. Incident questions offer email directly. The support screen catches mailto failures and shows the support address for manual contact.

## Performance

Local matching is bounded to 400 characters and a fixed instruction set. At most four pairs are rendered. No timers, external model calls or persistence are used.

## API Integration

None. Automatic answers are local, deterministic and available offline. Screen navigation may require the app's normal connection; emailing requires an email client and connectivity.

## Invariants

- Calls itself an automatic app-help assistant, not a human or unrestricted generative AI.
- Replies are reviewed product instructions, never interpolated instructions from question text.
- Account incidents, errors and billing disputes lead to human support.
- No invented account balances, subscription changes, prices or recovery promises.
- Assistance and human contact use the same entry and contact card in every plan. Settings labels the entry “Suporte”; neither this entry nor the support screen gates contact or advertises a priority upgrade.
- The conversation disappears on leaving the screen; it is not shared until the user opens and sends the email draft.

## Test matrix

Domain tests cover common phrasing, unknown questions, service routing, failure handoff and account-data boundaries. Component tests cover free-text conversation, screen navigation, reviewable email handoff and blank input.

Plan regressions cover the reported question with and without accents, subscription pricing versus product pricing, comparison by tier name, and navigation to the plan comparison. Cancellation and support must remain reachable.

## Examples

“Como sei quanto cobrar?” opens pricing instructions; service profiles open Services. “Minha tela travou” prepares an email handoff. “Qual foi meu lucro?” explains that the bot cannot see the user's data and offers Financeiro.

## Change log / Decisions

- 2026-09-09: Added automatic instruction-based chat and email handoff, as requested by the owner.
