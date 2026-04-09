# ai.context.api.md — Sales

---

## Purpose

Gerenciar vendas do negocio caseiro, incluindo registro de itens vendidos, forma de pagamento, vinculo com cliente, status da venda (pendente/pago/cancelado), controle de estoque ao vender e resumo diario. Total da venda e auto-calculado a partir dos itens.

## Non-goals

- Nao emite nota fiscal ou recibo formal
- Nao faz cobranca automatica (Pix, boleto, etc.)
- Nao gerencia entregas ou logistica
- Nao cria lancamento financeiro automaticamente (precisa ser chamado explicitamente via Finance.createFromSale)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateSaleDto, UpdateSaleDto, UpdateSaleStatusDto, PaginationDto, Sale, SaleStatus), `@lucro-caseiro/database/schema` (sales, saleItems, products, clients), `IProductsRepo` de Products (para estoque)
- **Dependentes**: Finance (pode receber lancamento via createFromSale), Subscription (conta vendas/mes para limites freemium)
- **Cross-feature**: usa `IProductsRepo` diretamente para validar estoque e decrementar

## Code pointers

- `apps/api/src/features/sales/sales.routes.ts` — rotas Express
- `apps/api/src/features/sales/sales.usecases.ts` — logica de negocio
- `apps/api/src/features/sales/sales.domain.ts` — calculos e validacoes puras
- `apps/api/src/features/sales/sales.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/sales/sales.types.ts` — interfaces e tipos
- `apps/api/src/features/sales/sales.domain.test.ts` — testes de dominio
- `apps/api/src/features/sales/sales.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `sales`

| Coluna        | Tipo      | Constraints                                         |
| ------------- | --------- | --------------------------------------------------- |
| id            | uuid      | PK                                                  |
| userId        | uuid      | FK users, NOT NULL                                  |
| clientId      | uuid      | nullable, FK clients                                |
| status        | enum      | "pending" \| "paid" \| "cancelled", default "paid"  |
| paymentMethod | enum      | "pix" \| "cash" \| "card" \| "credit" \| "transfer" |
| total         | decimal   | NOT NULL                                            |
| notes         | text      | nullable                                            |
| soldAt        | timestamp | default now()                                       |
| createdAt     | timestamp | default now()                                       |

### Tabela: `sale_items`

| Coluna    | Tipo    | Constraints           |
| --------- | ------- | --------------------- |
| id        | uuid    | PK                    |
| saleId    | uuid    | FK sales, NOT NULL    |
| productId | uuid    | FK products, NOT NULL |
| quantity  | integer | NOT NULL              |
| unitPrice | decimal | NOT NULL              |
| subtotal  | decimal | NOT NULL              |

## Invariants

- Venda deve ter pelo menos um item
- Cada item deve ter quantidade > 0 e preco unitario > 0
- Total = soma de (quantity \* unitPrice) de cada item
- Venda cancelada nao pode ser editada
- Venda ja cancelada nao pode ser cancelada novamente
- Se produto tem stockQuantity, deve ter estoque suficiente ao criar venda
- Toda query escopada por `userId`

## Operations

```yaml
feature: sales
app: api
mobile_counterpart: sales
api:
  base: /api/v1/sales
  endpoints:
    - method: POST
      path: /
      dto: CreateSaleDto
      response: Sale (201)
    - method: GET
      path: /
      query: page, limit, status, clientId, paymentMethod, dateFrom, dateTo
      dto: PaginationDto
      response: { items: Sale[], total, page, totalPages }
    - method: GET
      path: /summary/today
      response: DaySummary
    - method: GET
      path: /:id
      response: Sale
    - method: PATCH
      path: /:id
      dto: UpdateSaleDto
      response: Sale
    - method: PATCH
      path: /:id/status
      dto: UpdateSaleStatusDto
      response: Sale
db:
  tables:
    - sales
    - saleItems
  indexes:
    - sales(userId, id)
    - sales(userId, status)
    - sales(userId, soldAt DESC)
    - sales(userId, clientId)
    - saleItems(saleId)
invariants:
  - items.length >= 1
  - item.quantity > 0
  - item.unitPrice > 0
  - total = sum(item.quantity * item.unitPrice)
  - cancelled sale cannot be edited
  - cancelled sale cannot be cancelled again
  - stock validation when product has stockQuantity
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateSaleDto**: `{ clientId?, paymentMethod, items: SaleItemData[], notes?, soldAt? }`
- **SaleItemData**: `{ productId, quantity, unitPrice }`
- **UpdateSaleDto**: `{ clientId?, paymentMethod?, items?: SaleItemData[], notes? }`
- **UpdateSaleStatusDto**: `{ status: SaleStatus }`
- **Sale**: `{ id, userId, clientId, clientName, status, paymentMethod, total, notes, items: SaleItem[], soldAt, createdAt }`
- **SaleItem**: `{ id, productId, productName, quantity, unitPrice, subtotal }`
- **DaySummary**: `{ totalSales, totalAmount, averageTicket }`
- **SaleStatus**: `"pending" | "paid" | "cancelled"`

## Errors

| Status | Quando                              | Mensagem                                                            |
| ------ | ----------------------------------- | ------------------------------------------------------------------- |
| 400    | Itens vazios, quantidade/preco <= 0 | Array de strings (ex: "Item 1: quantidade deve ser maior que zero") |
| 400    | Estoque insuficiente                | "Estoque insuficiente para {productName}"                           |
| 400    | Editar venda cancelada              | "Nao e possivel editar uma venda cancelada"                         |
| 400    | Cancelar venda ja cancelada         | "Venda ja esta cancelada"                                           |
| 404    | Venda nao encontrada                | "Venda nao encontrada"                                              |

## Events / Side effects

- Ao criar venda: decrementa estoque dos produtos que tem `stockQuantity !== null`
- Itens da venda sao deletados e reinseridos ao atualizar (replace strategy)
- findById e findAll fazem JOIN com products e clients para enriquecer com nomes

## Performance

- Listagem faz JOIN com clients para clientName
- Itens carregados em batch para findAll (evita N+1 individual — usa `IN` clause)
- Filtros combinados: status, clientId, paymentMethod, dateFrom/dateTo
- DaySummary usa agregacao `COUNT` + `SUM` com filtro por range de dia
- `countByUserInMonth` usa range de datas para limites freemium

## Security

- Isolamento por `userId`
- Dados de vendas sao prioridade de seguranca
- Valores monetarios armazenados como string (decimal)

## Test matrix

### Domain (sales.domain.test.ts)

- calculateSaleTotal: item unico, multiplos, vazio
- validateSaleItems: valido, itens vazios, quantidade zero/negativa, preco zero/negativo, acumulo entre itens, acumulo no mesmo item
- canCancelSale: pending ok, paid ok, cancelled nao
- buildDaySummary: com vendas, sem vendas

### UseCases (sales.usecases.test.ts)

- createSale: valido com calculo auto, itens vazios, quantidade invalida, preco invalido, decrementa estoque, nao decrementa sem stockQuantity, estoque insuficiente
- getById: encontrado, NotFoundError
- list: paginacao
- updateStatus: sucesso, NotFoundError, cancelar ja cancelado
- updateSale: novos itens com recalculo, venda cancelada, NotFoundError
- getDaySummary: retorno correto
- countThisMonth: retorno correto

## Examples

```
POST /api/v1/sales
{ "paymentMethod": "pix", "items": [{ "productId": "prod-1", "quantity": 3, "unitPrice": 10 }] }
=> 201 { "id": "...", "total": 30, "status": "paid", ... }

GET /api/v1/sales?status=paid&dateFrom=2026-03-01&dateTo=2026-03-31
=> 200 { "items": [...], "total": 15, "page": 1, "totalPages": 1 }

GET /api/v1/sales/summary/today
=> 200 { "totalSales": 3, "totalAmount": 90, "averageTicket": 30 }

PATCH /api/v1/sales/sale-1/status
{ "status": "cancelled" }
=> 200 { "id": "sale-1", "status": "cancelled", ... }
```

## Change log / Decisions

- Criacao inicial com CRUD + status + estoque
- Total auto-calculado a partir dos itens (nunca informado pelo cliente)
- Itens da venda sao replace (delete + insert) ao atualizar
- SalesUseCases recebe `IProductsRepo` opcional para controle de estoque
- `soldAt` pode ser informado na criacao (para vendas retroativas), default = now()
