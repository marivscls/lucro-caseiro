# ai.context.api.md — Purchases (Compras / Contas a pagar)

---

## Purpose

Registrar compras de fornecedores como **contas a pagar** e **saídas do caixa**. Uma compra `pending` é uma conta a pagar (ainda NÃO é saída no caixa); ao marcar `paid`, a feature cria um lançamento de despesa em `finance` e guarda o id (`financeEntryId`) para idempotência. Espelha o fluxo de fiado das vendas (pending → pago vira lançamento).

## Non-goals

- Não registra itens de linha (material + qtd + preço) nem dá baixa/entrada de estoque (evolução futura).
- Não gerencia o cadastro de fornecedores (feature `suppliers`).
- Não calcula precificação (feature `pricing`).
- Sem limite freemium (não gating nesta fase).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreatePurchaseDto, Purchase, PaginationDto), `@lucro-caseiro/database/schema` (purchases, suppliers via FK, finance_entries via FK), `Finance` via porta `IFinancePoster` (injetada — `FinanceUseCases.createFromPurchase`).
- **Dependentes**: nenhum.
- **Cross-feature**: usa `IFinancePoster` (implementado por `FinanceUseCases`) para postar a despesa ao pagar.

## Code pointers

- `apps/api/src/features/purchases/purchases.routes.ts` — rotas Express
- `apps/api/src/features/purchases/purchases.usecases.ts` — lógica (create, pay idempotente, list, remove)
- `apps/api/src/features/purchases/purchases.domain.ts` — validação + `todayIso`
- `apps/api/src/features/purchases/purchases.repo.pg.ts` — persistência Drizzle/Postgres
- `apps/api/src/features/purchases/purchases.types.ts` — interfaces (inclui `IFinancePoster`)
- `apps/api/src/features/purchases/purchases.domain.test.ts` / `purchases.usecases.test.ts`

## Data Model

### Tabela: `purchases`

| Coluna         | Tipo      | Constraints                                     |
| -------------- | --------- | ----------------------------------------------- |
| id             | uuid      | PK                                              |
| userId         | uuid      | FK users, NOT NULL                              |
| supplierId     | uuid      | nullable, FK suppliers ON DELETE SET NULL       |
| description    | text      | NOT NULL                                        |
| amount         | decimal   | NOT NULL (10,2)                                 |
| category       | enum      | expense_category, NOT NULL default 'material'   |
| paymentStatus  | text      | "pending" \| "paid", NOT NULL default pending   |
| purchasedAt    | date      | NOT NULL                                        |
| dueDate        | date      | nullable (vencimento da conta a pagar)          |
| paidAt         | date      | nullable                                        |
| financeEntryId | uuid      | nullable, FK finance_entries ON DELETE SET NULL |
| createdAt      | timestamp | default now()                                   |

## Invariants

- `description` obrigatória (trim > 0), máx 500.
- `amount` > 0.
- `purchasedAt` é uma data válida (YYYY-MM-DD); `dueDate` válida quando presente.
- `pending` NÃO gera lançamento em finance; `paid` gera exatamente UM (idempotente via `financeEntryId`).
- A saída no caixa (lançamento de despesa) usa a data do pagamento (`paidAt`), não a da compra.
- Toda query escopada por `userId`.

## Operations

```yaml
feature: purchases
app: api
mobile_counterpart: purchases
api:
  base: /api/v1/purchases
  endpoints:
    - method: POST
      path: /
      dto: CreatePurchaseDto
      response: Purchase (201)   # se paymentStatus=paid, já posta a despesa
    - method: GET
      path: /
      query: page, limit, status?   # status = pending | paid
      response: { items: Purchase[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Purchase
    - method: POST
      path: /:id/pay
      response: Purchase   # marca paga + cria a saída no caixa (idempotente)
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [purchases]
  indexes:
    - (userId)
    - (userId, paymentStatus)
    - (supplierId)
invariants:
  - amount > 0
  - description.trim().length > 0
  - paid => exactly one finance expense (idempotent via financeEntryId)
  - todas as queries escopadas por userId
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`; `userId` via `getUserId(req)`. Isolamento por `userId`.

## Contracts (Zod/DTO)

- **CreatePurchaseDto**: `{ supplierId?, description, amount, category?, paymentStatus?, purchasedAt, dueDate? }`
- **Purchase**: `{ id, userId, supplierId, description, amount, category, paymentStatus, purchasedAt, dueDate, paidAt, financeEntryId, createdAt }`
- **PurchasePaymentStatus**: `"pending" | "paid"`

## Errors

| Status | Quando                                     | Mensagem                |
| ------ | ------------------------------------------ | ----------------------- |
| 400    | Descrição vazia, valor <= 0, data inválida | Array de strings        |
| 404    | Compra não encontrada (getById/pay/remove) | "Compra não encontrada" |

## Events / Side effects

- `pay` (e `create` com `paymentStatus=paid`) cria um lançamento de despesa em `finance`
  (`FinanceUseCases.createFromPurchase`: type `expense`, categoria da compra) e guarda o id.

## Performance

- Listagem paginada, ordenada por `purchasedAt DESC, createdAt DESC`, filtro opcional por `status`.

## Security

- Isolamento por `userId`. Valores monetários como decimal (string na borda).

## Test matrix

### Domain (purchases.domain.test.ts)

- validatePurchaseData: válido, descrição vazia, amount <= 0, data inválida, dueDate inválida, dueDate null
- todayIso: formata YYYY-MM-DD

### UseCases (purchases.usecases.test.ts)

- create pending (não posta no caixa); create paid (posta 1x, seta financeEntryId)
- create inválido → ValidationError
- pay: posta + marca paga; idempotente quando já paga (não posta de novo); NotFound
- getById/list/remove + NotFound

## Examples

```
POST /api/v1/purchases
{ "supplierId": "sup-1", "description": "Farinha 25kg", "amount": 120, "purchasedAt": "2026-06-25" }
=> 201 { "id": "...", "paymentStatus": "pending", "financeEntryId": null, ... }   # conta a pagar

POST /api/v1/purchases/pur-1/pay
=> 200 { "paymentStatus": "paid", "paidAt": "2026-06-26", "financeEntryId": "fin-1", ... }   # saiu do caixa
```

## Change log / Decisions

- Criação inicial (Fase 3 de Fornecedores, migration `022_purchases.sql`): compras como contas a
  pagar + saídas do caixa. `pending` não toca o caixa; `paid` cria a despesa em finance (idempotente
  via `financeEntryId`). Sem itens de linha / baixa de estoque (evolução futura). Reusa o enum
  `expense_category`. Injeta `IFinancePoster` (FinanceUseCases) para postar a despesa.
