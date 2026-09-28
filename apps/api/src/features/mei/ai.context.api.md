# ai.context.api.md — MEI (Cantinho do MEI)

## Purpose

Mostrar quanto do teto anual do MEI já foi usado, projetar o ano e montar o
Relatório Mensal das Receitas Brutas a partir das entradas do Financeiro.

## Non-goals

- Não emite DAS, nota fiscal nem declaração anual.
- Não dá conselho tributário; só organiza os números do app.

## Boundaries & Ownership

- **Depende de**: contracts (`MEI_*`, `MeiSummaryDto`, `meiStatus`), `users.mei_activity`.
- **Composição**: `FinanceUseCases.getMonthlySummary` via `IMonthlyIncomeProvider`.
- **Dependentes**: mobile `mei`.

## Code pointers

- `mei.routes.ts`, `mei.usecases.ts`, `mei.domain.ts`, `mei.repo.pg.ts`, `mei.types.ts`.

## Data Model

- `users.mei_activity` (`commerce|industry|services`, CHECK). Migration
  `20260928220200_mei_settings.sql`. Receita vem de `finance_entries` (entradas).

## Invariants

- Receita do mês = entradas do Financeiro (regime de caixa; fiado entra quando é pago).
- Ano atual soma de janeiro até o mês de hoje (fuso de Brasília); ano fechado soma 12 meses.
- Status: `near` a partir de 80% do teto, `over` acima do teto.
- Teto em um lugar só: `MEI_ANNUAL_REVENUE_LIMIT` (R$ 81.000 em 2026).

## Operations

```yaml
feature: mei
app: api
mobile_counterpart: mei
api:
  base: /api/v1/mei
  endpoints:
    - method: GET
      path: /summary
      query: year?, month?
      response: MeiSummary
    - method: PUT
      path: /settings
      body: UpdateMeiSettings
      response: { activity }
db:
  tables: [users, finance_entries]
```

## Authorization & RLS

- `authMiddleware`; tudo escopado por `userId`.

## Contracts (Zod/DTO)

- `UpdateMeiSettingsDto`, `MeiSummaryDto`, `MeiActivity`.

## Errors

- Mês que ainda não começou → 400.

## Events / Side effects

- Nenhum (a consulta do mês atual pode materializar gastos recorrentes, regra do Financeiro).

## Performance

- Até 12 resumos mensais em paralelo.

## Security

- Somente leitura, fora a atividade do próprio usuário.

## Test matrix

- `mei.domain.test.ts`: soma, projeção, avisos, fuso.
- `mei.usecases.test.ts`: meses somados, ano fechado, mês futuro, atividade.

## Examples

- `GET /api/v1/mei/summary?year=2026&month=9`

## Change log / Decisions

- 2026-09-28: criado (aposta 4). Grátis em qualquer plano.
