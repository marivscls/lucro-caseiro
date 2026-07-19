# ai.context.api.md — Purchases (Compras / Contas a pagar)

---

## Purpose

Registrar compras de fornecedores como **contas a pagar** e **saídas do caixa**. Uma compra `pending` é uma conta a pagar (ainda NÃO é saída no caixa); ao marcar `paid`, a feature cria um lançamento de despesa em `finance` e guarda o id (`financeEntryId`) para idempotência. Espelha o fluxo de fiado das vendas (pending → pago vira lançamento).

## Non-goals

- Não implementa pedido de compra, recebimento parcial ou múltiplos depósitos.
- Não gerencia o cadastro de fornecedores (feature `suppliers`).
- Não calcula precificação (feature `pricing`).
- Sem limite freemium de contagem (não gating de volume nesta fase) — mas a feature em si é
  exclusiva do plano Profissional (ver Authorization & RLS).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreatePurchaseDto, UpdatePurchaseDto, Purchase, PaginationDto), `@lucro-caseiro/database/schema` (purchases, suppliers via FK, finance_entries via FK), `Finance` via porta `IFinancePoster` (injetada — criação/atualização do lançamento da compra).
- **Dependentes**: nenhum.
- **Cross-feature**: usa `IFinancePoster` para postar a despesa e `IProductsRepo` para receber/reverter estoque de produtos e variações.

## Code pointers

- `apps/api/src/features/purchases/purchases.routes.ts` — rotas Express
- `apps/api/src/features/purchases/purchases.usecases.ts` — lógica (create, update, pay idempotente, list, remove)
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

### Tabela: `purchase_items`

Guarda `purchaseId`, `productId`, snapshots de nome/variação, `quantity`,
`unitCost` e `subtotal`. Foi adicionada pela migration `039_purchase_items.sql`.

## Invariants

- `description` obrigatória (trim > 0), máx 500.
- `amount` > 0 quando não há itens; com itens, o total é derivado de `quantity * unitCost`.
- Receber itens incrementa estoque do produto/variação e atualiza o último custo direto.
- Excluir compra com itens reverte o estoque; a operação é negada se isso o deixaria negativo.
- Editar itens ajusta apenas a diferença de estoque por produto/variação; reduções que deixariam
  estoque negativo são recusadas.
- `purchasedAt` é uma data válida (YYYY-MM-DD); `dueDate` válida quando presente.
- `pending` NÃO gera lançamento em finance; `paid` gera exatamente UM (idempotente via `financeEntryId`).
- Editar uma compra `paid` atualiza o lançamento financeiro vinculado; sem vínculo, a edição é recusada.
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
    - method: PATCH
      path: /:id
      dto: UpdatePurchaseDto
      response: Purchase
    - method: POST
      path: /:id/pay
      response: Purchase   # marca paga + cria a saída no caixa (idempotente)
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [purchases, purchase_items]
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
- `POST /` e `PATCH /:id` passam por `requireFeature(subscriptionRepo, "purchases")` (`apps/api/src/shared/middleware/require-feature.ts`)
  — registrar/editar compra de fornecedor é feature `purchases`, exclusiva do plano Profissional
  (`PLAN_FEATURES.professional`). Free/Essencial recebem `LimitExceededError` (403 / `LIMIT_EXCEEDED`),
  o mesmo fluxo que o mobile trata abrindo o paywall. Demais rotas (list/get/pay/delete) seguem sem
  gate — dados já existentes continuam acessíveis mesmo se o plano cair.

## Contracts (Zod/DTO)

- **CreatePurchaseDto**: `{ supplierId?, description, amount?, items?, category?, paymentStatus?, purchasedAt, dueDate? }`
- **UpdatePurchaseDto**: versão parcial dos campos editáveis; não altera o status de pagamento.
- **Purchase**: inclui os campos anteriores e `items[]` com produto, variação, quantidade, custo e subtotal.
- **PurchasePaymentStatus**: `"pending" | "paid"`

## Errors

| Status | Quando                                     | Mensagem                |
| ------ | ------------------------------------------ | ----------------------- |
| 400    | Descrição vazia, valor <= 0, data inválida | Array de strings        |
| 404    | Compra não encontrada (getById/pay/remove) | "Compra não encontrada" |

## Events / Side effects

- `pay` (e `create` com `paymentStatus=paid`) cria um lançamento de despesa em `finance`
  (`FinanceUseCases.createFromPurchase`: type `expense`, categoria da compra) e guarda o id.
- `update` sincroniza compras pagas via `FinanceUseCases.updateFromPurchase` e reconcilia deltas
  de estoque quando `items` muda.

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
- update: campos editáveis, sincronização do caixa, delta de estoque e bloqueio de estoque insuficiente
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
- 2026-07-11: **gate de feature (Profissional)** — `POST /` passou a exigir `requireFeature(subscriptionRepo,
"purchases")` (antes não tinha nenhum gate no backend, só no mobile). Mobile (`purchases.tsx`) já
  tinha o mesmo gap; ganhou tela de apresentação (badge "Recurso Profissional" + benefícios + CTA
  `showPaywall("purchases")`) igual ao padrão de `recurring-expenses.tsx`.
- 2026-07-19: **recebimento de mercadoria da Papelaria** — compras aceitam itens de produto/variação,
  calculam o total, repõem estoque e atualizam o custo. O payload com itens exige a capacidade
  de marca `comprasComEstoque`; compras antigas e despesas sem itens continuam compatíveis.
- 2026-07-19: **edição consistente** — `PATCH /:id` atualiza dados da compra em transação,
  sincroniza o lançamento financeiro de compras pagas e aplica somente o delta de estoque por
  produto/variação, com compensação em caso de falha.
