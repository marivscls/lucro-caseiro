# PRD: Meta de Pró-labore — Lucro Caseiro

> Status: **Planejado** (spec). Implementação pendente.
> Origem: avaliações na App Store pedindo "uma linha da quantidade de produtos que
> necessito vender para chegar ao Pró-labore" (veigahcarlos) e foco em metas de negócio.

## Introdução

Hoje o app calcula o **resultado realizado** do mês (receita − despesas = lucro), mas
não ajuda o usuário a planejar **quanto precisa vender** para tirar um salário (pró-labore).
Esta feature transforma o financeiro de "espelho do passado" em "bússola do mês": o
usuário define quanto quer ganhar e o app mostra, em tempo real, **quanto falta faturar**
e **quantas vendas/produtos faltam** para chegar lá.

## Goals

- Permitir definir uma **meta mensal de pró-labore** (quanto a pessoa quer tirar pra si).
- Calcular o **faturamento necessário** no mês = meta + custos/despesas do mês.
- Estimar **quantas vendas faltam** com base no ticket médio.
- Mostrar **progresso do mês** (barra + "faltam R$ X / ~N vendas").
- Dar **visibilidade**: card na Home, não escondido em submenu.

## Non-goals

- Não faz projeção multi-mês / tendências (candidato a Premium numa v2).
- Não calcula impostos nem pró-labore "oficial" (INSS/contábil).
- Não substitui a feature `finance` (continua sendo a fonte de receita/despesa).
- Não define metas por produto específico (v1 usa ticket médio do negócio).

## Modelo de cálculo (domínio puro)

Variáveis do mês corrente:

- `G` = meta de pró-labore (definida pelo usuário)
- `E` = despesas do mês — `totalExpenses` de `finance.getMonthlySummary`,
  ou `estimatedMonthlyCosts` se o usuário preferir um valor fixo estimado
- `R_now` = faturamento atual do mês — `totalIncome` de `finance.getMonthlySummary`
- `salesCount` = nº de vendas do mês — `sales.countThisMonth`
- `T` = ticket médio = `avgTicketOverride` (manual) **ou** `R_now / salesCount`
  (se `salesCount == 0`, usa preço médio dos produtos ativos; se não der, fica `null`)

Saídas (`calculateProlaboreProgress`):

```
requiredRevenue   = G + E
remainingRevenue  = max(0, requiredRevenue - R_now)
progressPct       = requiredRevenue > 0 ? min(100, R_now / requiredRevenue * 100) : 0
salesNeeded       = T ? ceil(requiredRevenue / T) : null
salesRemaining    = T ? ceil(remainingRevenue / T) : null
reached           = R_now >= requiredRevenue
```

**Nuance documentada:** no começo do mês `E` (despesas acumuladas) é baixo, o que
subestima `requiredRevenue`. Por isso oferecemos `estimatedMonthlyCosts` (custos fixos
estimados) — quando preenchido, usamos `E = max(totalExpenses, estimatedMonthlyCosts)`.

## Data Model

### Nova tabela: `business_goals` (uma linha por usuário)

| Coluna                | Tipo      | Constraints                    |
| --------------------- | --------- | ------------------------------ |
| id                    | uuid      | PK                             |
| userId                | uuid      | FK users, NOT NULL, **UNIQUE** |
| monthlyProlaboreGoal  | decimal   | NOT NULL, > 0                  |
| estimatedMonthlyCosts | decimal   | nullable, >= 0                 |
| avgTicketOverride     | decimal   | nullable, > 0                  |
| updatedAt             | timestamp | default now()                  |

- Índice: `(userId)` único. Toda query escopada por `userId` (regra do CLAUDE.md).
- Migration versionada em `packages/database` + RLS policy por `userId`.

## Operações (API — nova feature `goals`)

```yaml
feature: goals
app: api
mobile_counterpart: goals
api:
  base: /api/v1/goals
  endpoints:
    - method: GET
      path: /prolabore
      query: month?, year? # default = mês corrente
      response: { config: ProlaboreGoal | null, progress: ProlaboreProgress }
    - method: PUT
      path: /prolabore
      dto: UpsertProlaboreGoalDto
      response: ProlaboreGoal
    - method: DELETE
      path: /prolabore
      response: 204
db:
  tables: [business_goals]
  indexes: [(userId) unique]
invariants:
  - monthlyProlaboreGoal > 0
  - estimatedMonthlyCosts >= 0 (quando presente)
  - avgTicketOverride > 0 (quando presente)
  - uma linha por usuário (upsert)
```

### Dependências entre features (respeitando boundaries)

O `goals.usecases` **não** importa arquivos internos de `finance`/`sales`. Em vez disso,
define interfaces e recebe as implementações por injeção no composition root:

```ts
interface IMonthlyRevenueProvider {
  getMonthlySummary(userId, month, year): Promise<{ totalIncome; totalExpenses }>;
}
interface ISalesCounter {
  countThisMonth(userId): Promise<number>;
}
interface IAvgProductPriceProvider {
  averageActivePrice(userId): Promise<number | null>;
}
```

`FinanceUseCases`, `SalesUseCases` e `ProductsUseCases` já expõem métodos compatíveis
(`getMonthlySummary`, `countThisMonth`; falta `averageActivePrice` em products — adicionar).

## Contracts (Zod/DTO) — em `packages/contracts`

- **UpsertProlaboreGoalDto**: `{ monthlyProlaboreGoal: number>0, estimatedMonthlyCosts?: number>=0, avgTicketOverride?: number>0 }`
- **ProlaboreGoal**: `{ id, userId, monthlyProlaboreGoal, estimatedMonthlyCosts, avgTicketOverride, updatedAt }`
- **ProlaboreProgress**: `{ requiredRevenue, currentRevenue, remainingRevenue, progressPct, salesNeeded, salesRemaining, avgTicket, reached, period }`

## Mobile — nova feature `goals`

Arquivos: `api.ts`, `hooks.ts`, `types.ts`, `domain.ts` (espelha o cálculo p/ formatação),
`components/prolabore-card.tsx`, `components/prolabore-goal-form.tsx`, `ai.context.mobile.md`.

### Telas / pontos de entrada

1. **Card na Home** (`/tabs/index`) — principal vetor de descoberta. Mostra barra de
   progresso, "Faltam R$ X" e "~N vendas para sua meta". Se não houver meta: CTA
   "Defina sua meta de pró-labore".
2. **Formulário de meta** — define `monthlyProlaboreGoal` e opcionais. Acessível pelo
   card e por Configurações.
3. (Opcional) seção dentro de `/finance`.

### UX (princípios do CLAUDE.md)

- Linguagem simples: "Quanto você quer ganhar por mês?" em vez de "pró-labore".
- Resultado em destaque: "Faltam **8 vendas** para sua meta deste mês 💪".
- Fonte ≥ 16px, contraste AA, no máx. 3 toques (Home → card → definir meta).

## Freemium — DECIDIDO

**Básico grátis** (decisão do produto):

| Free                                                        | Premium (v2)                                       |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Definir meta + ver progresso do mês + quantas vendas faltam | Histórico de metas, projeção multi-mês, exportação |

Racional: a feature nasceu de uma review de churn (1 estrela). Deixar o cálculo de
progresso grátis maximiza retenção; o gancho de upgrade fica para a v2 (histórico/projeção).
**Implicação para a v1:** nenhum gate de paywall no cálculo de progresso nem no formulário
de meta — não chamar `usePaywall` nessas telas.

## Test matrix

### Domain (`goals.domain.test.ts`)

- `calculateProlaboreProgress`: meta batida, meta não batida, requiredRevenue=0,
  ticket nulo (0 vendas e sem produtos), `estimatedMonthlyCosts` > despesas reais,
  arredondamento de `salesNeeded`/`salesRemaining` (ceil).

### UseCases (`goals.usecases.test.ts`)

- `upsert`: cria quando não existe, atualiza quando existe (1 linha por user).
- `getProlabore`: compõe finance + sales + products via mocks das interfaces.
- Validações: meta <= 0, custos < 0, ticket <= 0.

### Mobile

- `prolabore-card` renderiza estados: sem meta (CTA), em progresso, meta batida.
- `domain` (formatação) espelha os números do back.

## Passos de implementação (ordem sugerida)

1. `packages/contracts`: DTOs + tipos (`UpsertProlaboreGoalDto`, `ProlaboreGoal`, `ProlaboreProgress`).
2. `packages/database`: schema `business_goals` + migration + RLS.
3. API feature `goals`: domain (puro + testes) → repo.pg → usecases (com interfaces injetadas) → routes → wire no composition root. Adicionar `averageActivePrice` em products.
4. **Criar `ai.context.api.md`** da feature `goals` (template padrão).
5. Mobile feature `goals`: api/hooks/types/domain + componentes.
6. Card na Home + formulário de meta + entrada em Configurações.
7. **Criar `ai.context.mobile.md`** da feature `goals`.
8. `pnpm context:lint` + `pnpm prepush` (lint, typecheck, test, sherif, knip, context:lint).
9. Commits: micro commits por camada (`feat(goals): ...`).

## Change log / Decisions

- v1 usa **ticket médio do negócio** (não meta por produto) para simplicidade.
- `goals` não acopla a `finance`/`sales`: usa interfaces injetadas (boundary do CLAUDE.md).
- `estimatedMonthlyCosts` resolve a subestimação de despesas no início do mês.
- Freemium: decisão pendente (ver seção Freemium).
