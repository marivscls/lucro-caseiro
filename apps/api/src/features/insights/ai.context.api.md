# ai.context.api.md — Insights (Gráficos / Análises)

---

## Purpose

Expor **agregações de leitura** para o painel de insights do app: produtos mais
vendidos, melhores clientes e faturamento mês a mês — tudo numa janela configurável
(default 6 meses), escopado por `userId`.

## Non-goals

- Não grava nada (somente leitura/agregação).
- Não substitui o `finance/summary` (entradas vs saídas do mês) nem o `sales/summary/today`.
- Não faz forecast/projeção nem comparações ano-a-ano (futuro).
- Não exporta arquivo (o export PDF/Excel continua em `finance`).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (Insights, TopProduct, TopClient, MonthlyRevenue),
  `@lucro-caseiro/database/schema` (sales, saleItems, products, clients).
- **Composição**: nenhuma injeção cross-feature — lê direto as tabelas via repo próprio.
- **Dependentes**: nenhum (consumido pelo mobile, feature `insights`).

## Code pointers

- `apps/api/src/features/insights/insights.routes.ts` — rota Express (GET /)
- `apps/api/src/features/insights/insights.usecases.ts` — janela + merge de buckets + totais
- `apps/api/src/features/insights/insights.domain.ts` — clampMonths, monthKeys, startOfRange (puro)
- `apps/api/src/features/insights/insights.repo.pg.ts` — 3 agregações (group by) via Drizzle
- `apps/api/src/features/insights/insights.types.ts` — interface IInsightsRepo
- `apps/api/src/features/insights/insights.domain.test.ts` / `insights.usecases.test.ts`

## Data Model

Não possui tabela própria. Lê de:

- `sales` (`userId`, `clientId`, `status`, `total`, `soldAt`)
- `sale_items` (`saleId`, `productId`, `quantity`, `subtotal`)
- `products` (`id`, `name`)
- `clients` (`id`, `name`)

Vendas com `status = 'cancelled'` são sempre excluídas das agregações.

## Invariants

- Janela `months` normalizada para o intervalo [1, 12] (default 6) via `clampMonths`.
- `monthlyRevenue` sempre retorna exatamente `months` buckets, em ordem cronológica
  crescente, preenchendo com zero os meses sem vendas.
- `totalRevenue`/`totalSales` são a soma dos buckets (consistentes com o gráfico).
- `topProducts`/`topClients` limitados a 5, ordenados desc (qtd e gasto, respectivamente).
- Toda query escopada por `userId`.

## Operations

```yaml
feature: insights
app: api
mobile_counterpart: insights
api:
  base: /api/v1/insights
  endpoints:
    - method: GET
      path: /
      query: months? # 1..12, default 6
      response: Insights
db:
  tables: [sales, sale_items, products, clients]
  indexes: [(userId, soldAt) em sales]
```

## Authorization & RLS

- Rota protegida por `authMiddleware`; `userId` via `getUserId(req)`. Isolamento por
  `userId` em nível de aplicação (mesma estratégia das demais tabelas).

## Contracts (Zod/DTO)

- **Insights**: `{ months, totalRevenue, totalSales, topProducts[], topClients[], monthlyRevenue[] }`
- **TopProduct**: `{ productId, name, quantity, revenue }`
- **TopClient**: `{ clientId, name, totalSpent, salesCount }`
- **MonthlyRevenue**: `{ month (YYYY-MM), revenue, salesCount }`

## Errors

| Status | Quando                      | Mensagem                    |
| ------ | --------------------------- | --------------------------- |
| 401    | sem token / sessão inválida | "Você precisa estar logado" |

`months` inválido (não numérico) cai no default 6, sem erro.

## Events / Side effects

- Nenhum. Operação puramente de leitura.

## Performance

- 3 queries agregadas em paralelo (`Promise.all`), cada uma com `group by` e filtro por
  `userId` + janela de data. Usa o índice `(userId, soldAt)` de `sales`.
- Limite fixo de 5 em produtos/clientes; janela máxima de 12 meses.

## Security

- Dados financeiros/clientes são prioridade (CLAUDE.md). Toda agregação é escopada por
  `userId`; nenhuma query global. Somente leitura.

## Test matrix

### Domain (insights.domain.test.ts)

- clampMonths: default, limites [1,12], truncamento de fração
- monthKeys: N chaves crescentes, virada de ano
- startOfRange: primeiro dia do mês inicial, janela de 1 mês

### UseCases (insights.usecases.test.ts)

- clamp da janela (99 → 12); default 6
- preenchimento de meses zerados + ordem cronológica
- merge da receita por mês + soma dos totais
- pass-through de topProducts/topClients

## Examples

```
GET /api/v1/insights?months=6
=> 200 {
  "months": 6,
  "totalRevenue": 1850.0,
  "totalSales": 23,
  "topProducts": [{ "productId": "...", "name": "Bolo de pote", "quantity": 40, "revenue": 600 }],
  "topClients": [{ "clientId": "...", "name": "Maria", "totalSpent": 420, "salesCount": 7 }],
  "monthlyRevenue": [{ "month": "2025-12", "revenue": 300, "salesCount": 4 }, ...]
}
```

## Change log / Decisions

- Criação inicial: agregações de leitura para o painel de insights do mobile.
- Janela default de 6 meses, máx. 12; top 5 fixo em produtos e clientes.
- Sem tabela própria: lê `sales`/`sale_items`/`products`/`clients` direto no repo.
- `monthlyRevenue` preenche meses vazios na camada de usecase (domínio puro `monthKeys`)
  para o gráfico ser contínuo, em vez de depender do banco retornar cada mês da janela.
- 2026-06-16: **janela é Premium (free = mês atual)** — `createInsightsRouter(useCases, isPremium?)`; quando o usuário não é Premium, a rota força `months = 1` (ignora `?months=`), entregando só o mês corrente. Enforcement no backend (o app já mostra só os cards do mês + teaser de Premium para gráficos/rankings). Premium escolhe 3/6/12.
