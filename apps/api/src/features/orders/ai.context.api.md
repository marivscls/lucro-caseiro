# ai.context.api.md — Orders (Agenda / Encomendas)

---

## Purpose

Gerenciar **encomendas/compromissos com data de entrega** (a agenda do negócio): criar,
listar por período/status, acompanhar status de produção e marcar como entregue —
opcionalmente registrando a receita no financeiro.

## Non-goals

- Não é calendário completo (sem grade mensal/horária).
- Não vincula produtos/itens na v1 (só `title` + `amount`).
- Não dá baixa de estoque/insumos (futuro).
- Não substitui `sales` (encomenda = pipeline; venda = realizado).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateOrderDto, UpdateOrderDto, DeliverOrderDto, Order, OrderStatus), `@lucro-caseiro/database/schema` (orders, clients).
- **Composição (injetado, sem importar internals)**: `FinanceUseCases.create` via interface `IIncomeRegistrar` — usado para lançar a receita ao entregar.
- **Dependentes**: nenhum (consumido pelo mobile).

## Code pointers

- `apps/api/src/features/orders/orders.routes.ts` — rotas Express
- `apps/api/src/features/orders/orders.usecases.ts` — lógica (deliver compõe receita)
- `apps/api/src/features/orders/orders.domain.ts` — validação, isTerminal, todayISO
- `apps/api/src/features/orders/orders.repo.pg.ts` — persistência (join clientName)
- `apps/api/src/features/orders/orders.types.ts` — interfaces (IOrdersRepo, IIncomeRegistrar)
- `apps/api/src/features/orders/orders.domain.test.ts` / `orders.usecases.test.ts`

## Data Model

### Tabela: `orders`

| Coluna       | Tipo      | Constraints                                                      |
| ------------ | --------- | ---------------------------------------------------------------- |
| id           | uuid      | PK                                                               |
| userId       | uuid      | FK users, NOT NULL                                               |
| clientId     | uuid      | nullable, FK clients (set null)                                  |
| title        | text      | NOT NULL                                                         |
| deliveryDate | date      | NOT NULL                                                         |
| deliveryTime | text      | nullable (HH:MM)                                                 |
| status       | enum      | pending\|in_production\|ready\|done\|cancelled (default pending) |
| amount       | decimal   | nullable                                                         |
| notes        | text      | nullable                                                         |
| saleId       | uuid      | nullable, FK sales (reservado p/ futura conversão; v1 fica null) |
| createdAt    | timestamp | default now()                                                    |

- Índices: `(userId, deliveryDate)`, `(userId, status)`. Schema aplicado via `drizzle-kit push`.

## Invariants

- `title` obrigatório; `deliveryDate` formato YYYY-MM-DD.
- `amount` >= 0 quando presente; `deliveryTime` no formato HH:MM quando presente.
- `done`/`cancelled` são terminais (helper `isTerminal`).
- `deliver` é idempotente: encomenda já `done` não registra receita de novo.
- Toda query escopada por `userId`.
- `summary` agrega via `COUNT`/`SUM` agrupado por `status` (user-scoped); `cancelled` fora dos totais; `amount` nulo = 0.

## Operations

```yaml
feature: orders
app: api
mobile_counterpart: orders
api:
  base: /api/v1/orders
  endpoints:
    - method: GET
      path: /
      query: status?, from?, to?
      response: { items: Order[] }
    - method: GET
      path: /summary
      query: status?, startDate?, endDate?   # filtra por deliveryDate
      response: OrdersSummary
      note: rota declarada ANTES de /:id (evita conflito de match)
    - method: POST
      path: /
      dto: CreateOrderDto
      response: Order (201)
    - method: GET
      path: /:id
      response: Order
    - method: PATCH
      path: /:id
      dto: UpdateOrderDto
      response: Order
    - method: POST
      path: /:id/deliver
      dto: DeliverOrderDto   # { registerIncome, paymentMethod? }
      response: Order
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [orders]
  indexes: [(userId, deliveryDate), (userId, status)]
```

## Authorization & RLS

- Rotas protegidas por `authMiddleware`; `userId` via `getUserId(req)`. Isolamento por `userId` em nível de aplicação (mesma estratégia das demais tabelas).

## Contracts (Zod/DTO)

- **CreateOrderDto**: `{ title, deliveryDate, deliveryTime?, clientId?, amount?, notes?, status? }`
- **UpdateOrderDto**: `Partial<CreateOrderDto>`
- **DeliverOrderDto**: `{ registerIncome: boolean, paymentMethod? }`
- **Order**: `{ id, userId, clientId, clientName, title, deliveryDate, deliveryTime, status, amount, notes, saleId, createdAt }`
- **OrderStatus**: `"pending"|"in_production"|"ready"|"done"|"cancelled"`
- **OrdersSummary**: `{ totalOrders, totalAmount, pending: { count, amount }, delivered: { count, amount } }`
  - `pending` = ativas (`pending`+`in_production`+`ready`); `delivered` = `done`.
  - `cancelled` é ignorado (não entra em totais nem buckets — não é receita).
  - `amount` nulo conta como 0; soma SQL convertida com `Number(...)`.

## Errors

| Status | Quando                                                | Mensagem                   |
| ------ | ----------------------------------------------------- | -------------------------- |
| 400    | título vazio, data inválida, valor < 0, hora inválida | Array de strings           |
| 404    | encomenda não encontrada                              | "Encomenda nao encontrada" |

## Security

- Dados de clientes/encomendas são prioridade (CLAUDE.md). Isolamento por `userId`.

## Events / Side effects

- `deliver` com `registerIncome` cria um lançamento `income`/`sale` no financeiro (via `IIncomeRegistrar`).

## Performance

- `findAll` ordena por `deliveryDate, deliveryTime` com join de `clients` para o nome.

## Test matrix

### Domain (orders.domain.test.ts)

- validateOrder: válido, título/data obrigatórios, data/hora inválida, valor negativo, modo parcial
- isTerminal: done/cancelled vs ativos
- todayISO: formatação

- buildOrdersSummary: vazio (zeros), buckets pending/delivered, ignora cancelled

### UseCases (orders.usecases.test.ts)

- create válido / ValidationError; getById NotFound; deliver (sem receita / com receita / idempotente); remove NotFound
- getSummary: shaping das linhas agregadas; encaminha filtros (status/startDate) ao repo

## Examples

```
POST /api/v1/orders
{ "title": "Bolo de chocolate 2kg", "deliveryDate": "2026-05-30", "amount": 120 }
=> 201 { "id": "...", "status": "pending", ... }

POST /api/v1/orders/:id/deliver
{ "registerIncome": true }
=> 200 { "status": "done", ... }  (+ lançamento de receita no financeiro)
```

## Change log / Decisions

- Criação inicial: encomendas com data + status + entrega.
- v1 sem itens de produto (só title+amount). Conversão a venda real fica p/ v2.
- `deliver` registra **receita no financeiro** (não cria uma `sale`, pois encomenda não tem itens na v1).
- `orders` não acopla finance: usa `IIncomeRegistrar` injetada (boundary do CLAUDE.md).
- 2026-05-30: endpoint `GET /summary` (P2 #13) — total dos pedidos + buckets a receber/recebido. Agregação `COUNT`/`SUM` agrupada por status no repo (`summarize`), shaping puro em `buildOrdersSummary` (domain). `cancelled` fora dos totais; `amount` nulo = 0; filtros opcionais por `status`/`startDate`/`endDate` (deliveryDate). Rota antes de `/:id`. `OrdersSummary` adicionado em `@lucro-caseiro/contracts`.
