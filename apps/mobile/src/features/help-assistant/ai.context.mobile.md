# Help assistant — mobile context

## Purpose

Offer immediate answers to free-text questions about using the app, plus a reviewable handoff to the existing support team: WhatsApp for paying accounts, email for everyone.

## Non-goals

- Generate unrestricted answers, financial advice or information outside the app documentation.
- Read or change account, financial or customer records.
- Send support emails automatically, store conversations or add a paid AI dependency.

## Components

- `HelpAssistant` is shown at the top of the existing `/support` screen for all plans.
- `help-assistant.domain.ts` contains reviewed answers and intent matching. Pricing adapts to service/beauty businesses; unsupported questions offer human support.
- Subscription questions show all three plans with prices and free limits from the shared contracts, plus navigation to `/plans`. This intent precedes product pricing and feature guides; incident and cancellation guidance keep priority.
- Users type up to 400 characters or select a suggested question. Keep at most four question/answer pairs in component memory. No analytics or persistence of question text.
- `onNavigate` accepts only a fixed set of app routes. `onContactSupport` passes the latest question (or unfinished draft) to the support screen. Paying accounts (`hasWhatsAppSupport`: active paid plan, not on trial) go to `openSupportWhatsApp`, which opens the WhatsApp app straight in the support chat (+55 48 99212-4950, `whatsapp://send?phone=`; falls back to `wa.me`) with a prefilled message containing the question and the app platform/version. Free and trial accounts go to the mailto composer. The user reviews and sends the draft.

## Boundaries & Ownership

This feature owns the local question-to-instruction conversation. `shared/utils/support-contact.ts` owns the support WhatsApp number, email address and message composition; the support screen owns navigation. No backend, credentials or private profile data is sent to another service.

## Code pointers

- `help-assistant.domain.ts`: reviewed answers, suggestions and route allowlist.
- `help-assistant.tsx`: question input, bounded conversation, answer actions and handoff.
- `app/support.tsx`: screen integration. Paying accounts see WhatsApp as the primary button and email as the secondary one, with both shown as selectable text. Free and trial accounts see only email, plus the line "Quem assina também fala com a gente pelo WhatsApp."
- `shared/utils/support-contact.ts`: support number, email, prefilled messages and open-with-fallback.

## Hooks

Uses component-local `useState` and the existing `useTheme` hook. The parent supplies the business profile and navigation callbacks.

## Contracts

`answerHelpQuestion(question, profile)` returns `HelpAnswer` with a guide, handoff or unknown kind, text, steps and optional allowlisted action. No network DTO or public endpoint is added.

## Error Handling

Unknown questions ask for a clearer task or offer human help. Incident questions offer human contact directly (the button reads "Falar com a equipe"). If WhatsApp or the email app does not open, an alert shows the number and the address for manual contact.

## Performance

Local matching is bounded to 400 characters and a fixed instruction set. At most four pairs are rendered. No timers, external model calls or persistence are used.

## API Integration

None. Automatic answers are local, deterministic and available offline. Screen navigation may require the app's normal connection; contacting support requires WhatsApp (or an email client) and connectivity.

## Invariants

- Calls itself an automatic app-help assistant, not a human or unrestricted generative AI.
- Replies are reviewed product instructions, never interpolated instructions from question text.
- Account incidents, errors and billing disputes lead to human support.
- No invented account balances, subscription changes, prices or recovery promises.
- Assistance and human contact use the same entry and contact card in every plan. Settings labels the entry “Suporte”. Every plan can contact the team by email; WhatsApp is a paid-plan channel.
- The conversation disappears on leaving the screen; it is not shared until the user opens and sends the WhatsApp (or email) draft.

## Test matrix

Domain tests cover common phrasing, unknown questions, service routing, failure handoff and account-data boundaries. Component tests cover free-text conversation, screen navigation, reviewable handoff and blank input. `support-contact.test.ts` covers the prefilled message, both URLs and who gets WhatsApp.

Plan regressions cover the reported question with and without accents, subscription pricing versus product pricing, comparison by tier name, and navigation to the plan comparison. Cancellation and support must remain reachable.

## Examples

“Como sei quanto cobrar?” opens pricing instructions; service profiles open Services. “Minha tela travou” prepares a handoff to the team. “Qual foi meu lucro?” explains that the bot cannot see the user's data and offers Financeiro.

## Change log / Decisions

- 2026-09-09: Added automatic instruction-based chat and email handoff, as requested by the owner.
- 2026-11-14: WhatsApp support (+55 48 99212-4950, "Respondemos em até 1 dia útil.") for paying accounts only (owner decision); free and trial keep email. The WhatsApp button opens the support chat directly. Reason: the only channel was a mailto link, which opens nothing on many Android phones without an email app; a paying customer reported not finding a way to contact us.

- 2026-09-10: Revisão de cortes no PWA/mobile. Perguntas sugeridas permitem duas linhas nos botões em telas estreitas. Validação visual em 320, 390, 500 e 1440px com dados locais simulados.

## Desktop (web >= 1024px) — 2026-09-24

`HelpAssistant` aceita `desktop` (passado por `app/support.tsx`; prop em vez de hook para os testes
não dependerem de `react-native`): cartão branco, perguntas sugeridas na largura do texto em linha
que quebra, e "Falar com a equipe" / "Perguntar" à direita, ao lado do aviso de 14px. Em
`support-desktop.tsx`, "Fale com a gente" fica numa lateral fixa e as perguntas frequentes em grade
de 2 colunas abaixo do assistente. Mesmas respostas, ações e rótulos; o celular não mudou.
