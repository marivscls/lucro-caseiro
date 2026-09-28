# ai.context.mobile.md — Referrals (Indique e ganhe)

---

## Purpose

Mostrar o código de convite da pessoa, mandar o convite pronto no WhatsApp, deixar quem
chegou agora digitar o código de quem indicou e acompanhar o prêmio: 1 mês do Essencial para
as duas contas quando a conta indicada registra 3 vendas.

## Non-goals

- Não decide prêmio nem regras: a API (`features/referrals`) valida o código, a janela de 14
  dias e concede o plano.
- Não lê o código do link de instalação (a pessoa digita o código na tela).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`ReferralSummary`), `@lucro-caseiro/brands`,
  `@lucro-caseiro/ui`, `expo-clipboard`, `shared/utils/whatsapp`.
- **Dependentes:** `app/referrals.tsx`; entrada em Mais > Conta e ajuda.

## Code pointers

| Arquivo             | Descricao                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `api.ts`            | GET resumo, POST claim                                                       |
| `hooks.ts`          | `useReferralSummary`, `useClaimReferral`                                     |
| `domain.ts`         | `inviteUrl`, `inviteMessage`, `claimProgress`, `invitedSummary`, `cleanCode` |
| `app/referrals.tsx` | Tela                                                                         |

## Components

- Tela única: cartão vinho com o código (copiar / convidar no WhatsApp), progresso de quem
  foi convidada, campo "Recebeu um convite?" (só quando `canClaim`) e "Como funciona".

## Hooks

| Hook                   | Tipo          | Descricao                                          |
| ---------------------- | ------------- | -------------------------------------------------- |
| `useReferralSummary()` | `useQuery`    | Key `["referrals"]`.                               |
| `useClaimReferral()`   | `useMutation` | Grava o resumo novo e invalida `["subscription"]`. |

## API Integration

| Endpoint                  | Verbo | Funcao                 | Parametros      |
| ------------------------- | ----- | ---------------------- | --------------- |
| `/api/v1/referrals`       | GET   | `fetchReferralSummary` | -               |
| `/api/v1/referrals/claim` | POST  | `claimReferral`        | body `{ code }` |

## Contracts

- `ReferralSummary { code, invitedCount, rewardedCount, referredByName, rewarded, canClaim,
salesCount, rewardDays, requiredSales }`.

## Error Handling

- Código curto: erro no campo. Recusas da API (próprio código, fora do prazo, já usado) vêm
  em português e aparecem em `alertError`.

## Performance

- Uma query; o claim já devolve o resumo atualizado (sem novo GET).

## Test matrix

- [x] `domain.test.ts`: link com UTM e código, link da loja para outras marcas, mensagem,
      progresso (faltam 2 / falta 1 / sem progresso), resumo, limpeza do código.
- [x] `shared/mock/growth-routes.test.ts`: resumo no formato do contrato.

## Examples

- Mais > Indique e ganhe > Convidar no WhatsApp.
- Conta nova > Indique e ganhe > digitar "ANAB7K" > Usar código.

## Change log / Decisions

- 2026-09-28: criação. Link do convite leva UTM `indicacao` para medir o canal; o código é
  digitado depois do cadastro para não alongar o onboarding.
- 2026-09-28: textos da tela, do convite e dos erros ficaram neutros (sem "amiga", "vocês duas"), porque quem vende pode ser homem ou mulher.
