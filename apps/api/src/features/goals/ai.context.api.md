# ai.context.api.md — Goals (Meta de Pró-labore)

---

## Purpose

Permitir que o usuário defina uma **meta mensal de pró-labore** (quanto quer tirar pra si)
e calcular, para o mês corrente, o **faturamento necessário**, **quanto falta faturar** e
**quantas vendas faltam** para atingir a meta.

## Non-goals

- Não faz projeção multi-mês nem histórico de metas (futuro / Premium v2).
- Não calcula impostos nem pró-labore contábil (INSS etc.).
- Não substitui a feature `finance` (que continua sendo a fonte de receita/despesa).
- Não define metas por produto específico (v1 usa ticket médio do negócio).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (UpsertProlaboreGoalDto, ProlaboreGoal, ProlaboreProgress, ProlaboreStatus), `@lucro-caseiro/database/schema` (businessGoals).
- **Composição (injetado no composition root, sem importar arquivos internos)**: `FinanceUseCases.getMonthlySummary`, `SalesUseCases.countThisMonth`, `ProductsUseCases.averageActivePrice` — via interfaces `IMonthlyFinanceProvider`, `IMonthlySalesCounter`, `IAvgProductPriceProvider`.
- **Dependentes**: nenhum (consumido apenas pelo mobile).

## Code pointers

- `apps/api/src/features/goals/goals.routes.ts` — rotas Express
- `apps/api/src/features/goals/goals.usecases.ts` — lógica + composição dos providers
- `apps/api/src/features/goals/goals.domain.ts` — cálculo puro (`calculateProlaboreProgress`, `validateGoal`, `emptyProgress`)
- `apps/api/src/features/goals/goals.repo.pg.ts` — persistência Drizzle (upsert por userId)
- `apps/api/src/features/goals/goals.types.ts` — interfaces (IGoalsRepo + providers)
- `apps/api/src/features/goals/goals.domain.test.ts` — testes de domínio
- `apps/api/src/features/goals/goals.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `business_goals` (uma linha por usuário)

| Coluna                | Tipo      | Constraints                    |
| --------------------- | --------- | ------------------------------ |
| id                    | uuid      | PK                             |
| userId                | uuid      | FK users, NOT NULL, **UNIQUE** |
| monthlyProlaboreGoal  | decimal   | NOT NULL                       |
| estimatedMonthlyCosts | decimal   | nullable                       |
| avgTicketOverride     | decimal   | nullable                       |
| updatedAt             | timestamp | default now()                  |

- Schema aplicado via `drizzle-kit push` (convenção do repo; não há migration SQL manual por tabela).
- Índice único `(userId)` habilita o `upsert` (`onConflictDoUpdate`).

## Invariants

- `monthlyProlaboreGoal` > 0
- `estimatedMonthlyCosts` >= 0 (quando presente)
- `avgTicketOverride` > 0 (quando presente)
- Uma linha por usuário (upsert por `userId`)
- Toda query escopada por `userId`
- `requiredRevenue = monthlyProlaboreGoal + max(totalExpenses, estimatedMonthlyCosts ?? 0)`
- `salesNeeded = ceil(requiredRevenue / avgTicket)` (null se não há ticket médio)

## Operations

```yaml
feature: goals
app: api
mobile_counterpart: goals
api:
  base: /api/v1/goals
  endpoints:
    - method: GET
      path: /prolabore
      response: ProlaboreStatus # { config: ProlaboreGoal | null, progress: ProlaboreProgress }
    - method: PUT
      path: /prolabore
      dto: UpsertProlaboreGoalDto
      response: ProlaboreGoal
    - method: DELETE
      path: /prolabore
      response: 204
db:
  tables: [businessGoals]
  indexes:
    - (userId) unique
invariants:
  - monthlyProlaboreGoal > 0
  - estimatedMonthlyCosts >= 0
  - avgTicketOverride > 0
  - requiredRevenue = goal + max(expenses, estimatedCosts)
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`; `userId` via `getUserId(req)`.
- Isolamento por `userId` em nível de aplicação (mesma estratégia das demais tabelas do projeto).

## Contracts (Zod/DTO)

- **UpsertProlaboreGoalDto**: `{ monthlyProlaboreGoal: number>0, estimatedMonthlyCosts?: number>=0, avgTicketOverride?: number>0 }`
- **ProlaboreGoal**: `{ id, userId, monthlyProlaboreGoal, estimatedMonthlyCosts, avgTicketOverride, updatedAt }`
- **ProlaboreProgress**: `{ requiredRevenue, currentRevenue, remainingRevenue, progressPct, salesNeeded, salesRemaining, avgTicket, reached, period }`
- **ProlaboreStatus**: `{ config: ProlaboreGoal | null, progress: ProlaboreProgress }`

## Errors

| Status | Quando                             | Mensagem                   |
| ------ | ---------------------------------- | -------------------------- |
| 400    | meta <= 0, custos < 0, ticket <= 0 | Array de strings com erros |

## Security

- Dados financeiros são prioridade de segurança (conforme CLAUDE.md).
- Todas as rotas exigem autenticação; isolamento por `userId` em toda query.
- Não expõe dados de outras features além do agregado necessário para o cálculo.

## Events / Side effects

- Nenhum. Leitura compõe dados de finance/sales/products do mês corrente.

## Performance

- `getProlaboreStatus` busca finance summary + contagem de vendas + preço médio em paralelo (`Promise.all`).
- Curto-circuito: se não há meta configurada, retorna progresso zerado sem consultar os providers.

## Determinação do ticket médio

1. `avgTicketOverride` (manual) se definido; senão
2. `totalIncome / nº de vendas do mês` se houver vendas; senão
3. preço médio dos produtos ativos (`averageActivePrice`); senão `null` (sem estimativa de vendas).

## Test matrix

### Domain (goals.domain.test.ts)

- validateGoal: válido, meta <= 0, custos negativos, ticket <= 0
- calculateProlaboreProgress: meta não batida, despesas reais > estimativa, meta batida (cap 100 + reached), sem ticket (sales null), arredondamento ceil
- emptyProgress: zerado com período

### UseCases (goals.usecases.test.ts)

- upsert: válido, ValidationError
- getProlaboreStatus: sem meta (progresso zerado), ticket via vendas do mês, override manual, fallback para preço médio sem vendas

## Examples

```
PUT /api/v1/goals/prolabore
{ "monthlyProlaboreGoal": 2000, "estimatedMonthlyCosts": 500 }
=> 200 { "id": "...", "monthlyProlaboreGoal": 2000, ... }

GET /api/v1/goals/prolabore
=> 200 {
  "config": { "monthlyProlaboreGoal": 2000, ... },
  "progress": { "requiredRevenue": 2500, "currentRevenue": 1000, "remainingRevenue": 1500,
                "progressPct": 40, "salesNeeded": 100, "salesRemaining": 60,
                "avgTicket": 25, "reached": false, "period": "2026-05" }
}
```

## Change log / Decisions

- Criação inicial: meta de pró-labore com progresso do mês corrente.
- `goals` não acopla finance/sales/products: usa interfaces injetadas no composition root (boundary do CLAUDE.md).
- `estimatedMonthlyCosts` resolve a subestimação de despesas no início do mês.
- Freemium: básico grátis (definir meta + progresso); histórico/projeção ficam para v2.
