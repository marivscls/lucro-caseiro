# ai.context.api.md — Referrals (Indicação premiada)

## Purpose

Dar a cada conta um código de convite e premiar as duas contas quando a
indicada registra a 3ª venda: 30 dias do Essencial para cada uma.

## Non-goals

- Não paga dinheiro nem desconto em assinatura da loja.
- Não premia por avaliação na Play (proibido pelo Google).
- Não rastreia instalação; o código é digitado no app (ou vem do link).

## Boundaries & Ownership

- **Depende de**: contracts (`ClaimReferralDto`, `ReferralSummaryDto`,
  `REFERRAL_*`, `resolveActivePlan`), schema `users` e `sales`.
- **Composição**: `SalesUseCases` recebe `onSaleCreated` → `checkReward`.
- **Dependentes**: mobile `referrals`.

## Code pointers

- `referrals.routes.ts`, `referrals.usecases.ts`, `referrals.domain.ts`,
  `referrals.repo.pg.ts`, `referrals.types.ts`.

## Data Model

- `users.referral_code` (UNIQUE), `users.referred_by` (FK users, set null,
  CHECK diferente de si mesma), `users.referred_at`, `users.referral_rewarded_at`.
- Migration `20260928220100_referrals.sql`.

## Invariants

- Código criado na primeira consulta; letras sem 0/O/1/I/L.
- Código só pode ser informado nos 14 primeiros dias da conta, uma vez.
- Não vale código próprio nem convite em círculo.
- Prêmio pago uma vez só (`referral_rewarded_at` marcado na mesma transação).
- Quem paga assinatura não tem o plano alterado; grátis/teste ganham +30 dias
  somados ao que tinham, gravados como teste (`plan_is_trial = true`).

## Operations

```yaml
feature: referrals
app: api
mobile_counterpart: referrals
api:
  base: /api/v1/referrals
  endpoints:
    - method: GET
      path: /
      response: ReferralSummary
    - method: POST
      path: /claim
      body: ClaimReferral
      response: ReferralSummary
db:
  tables: [users, sales]
```

## Authorization & RLS

- `authMiddleware`; a conta só lê e altera os próprios dados. `users` é API-only.

## Contracts (Zod/DTO)

- `ClaimReferralDto`, `ReferralSummaryDto`.

## Errors

- Código inválido, prazo encerrado, código próprio ou repetido → 400 com texto em português.

## Events / Side effects

- `checkReward` roda depois de cada venda (best-effort, nunca bloqueia a venda).

## Performance

- Uma contagem de vendas por venda registrada só enquanto a indicação não foi paga.

## Security

- Atualizações condicionais (`WHERE referred_by IS NULL`, `referral_rewarded_at IS NULL`) evitam corrida.

## Test matrix

- `referrals.domain.test.ts`: código, recusas, prêmio por situação de plano.
- `referrals.usecases.test.ts`: resumo, claim com prêmio imediato, antes da 3ª venda, código inválido.

## Examples

- `POST /api/v1/referrals/claim` `{ "code": "CELIA7K2" }`

## Change log / Decisions

- 2026-09-28: criado (aposta 2). Prêmio na 3ª venda para premiar uso real, não cadastro vazio.
