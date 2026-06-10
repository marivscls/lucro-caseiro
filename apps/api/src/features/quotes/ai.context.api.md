# ai.context.api.md — Quotes (Orçamentos)

---

## Purpose

Orçamentos/propostas enviadas ao cliente **antes** de virar encomenda ou venda — fluxo
típico de papelaria personalizada, bolos de festa e eventos: orçar → negociar →
aprovar → converter em encomenda (agenda). Itens livres (descrição + qtd + preço),
sem vínculo com produtos cadastrados.

## Non-goals

- Não registra venda nem mexe em estoque (a conversão gera **encomenda**; a venda
  acontece no fluxo de entrega da encomenda).
- Não conta no limite freemium de vendas (orçamento não é venda).
- Não calcula custos/margem (feature `pricing`).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (Quote, CreateQuote, UpdateQuote,
  ConvertQuote, QuoteStatus), `@lucro-caseiro/database/schema` (quotes, clients).
- **Composição**: recebe `IOrderCreator` injetado (wired no main com `ordersUseCases`)
  para a conversão orçamento → encomenda. Nunca importa arquivos internos de orders.
- **Dependentes**: mobile feature `quotes`.

## Code pointers

- `quotes.routes.ts` — CRUD + PATCH /:id/status + POST /:id/convert
- `quotes.usecases.ts` — total calculado no servidor, regras de status/conversão
- `quotes.domain.ts` — `computeQuoteTotal` (centavos exatos), `validateQuote`,
  `quoteItemsSummary` (puros)
- `quotes.repo.pg.ts` — persistência; resolve clientName do vínculo quando não salvo
- `quotes.types.ts` — `IQuotesRepo`, `IOrderCreator`

## Data Model

- `quotes` (migration 016): user_id→users (cascade), client_id→clients (set null),
  client_name (livre p/ não cadastrado), title, **items jsonb**
  `[{description, quantity, unitPrice}]`, total numeric (server-side), status
  (pending/accepted/rejected), valid_until, notes, order_id→orders (set null),
  created_at/updated_at.
- Índices: (user_id, status) e (user_id, created_at desc).

## Invariants

- `total` é SEMPRE calculado no servidor a partir dos itens (centavos exatos via
  arredondamento por item) — nunca aceito do cliente.
- Orçamento `accepted` não pode ser editado (edite a encomenda gerada).
- Conversão é única: `orderId` preenchido bloqueia nova conversão.
- Sinal na conversão ≤ total do orçamento.
- Toda query escopada por `userId`.

## Operations

```yaml
feature: quotes
app: api
mobile_counterpart: quotes
api:
  base: /api/v1/quotes
  endpoints:
    - method: GET
      path: /
      query: page, limit, status?
      response: { items: Quote[], ...pagination }
    - method: POST
      path: /
      body: CreateQuote
      response: Quote (201)
    - method: GET
      path: /:id
      response: Quote
    - method: PUT
      path: /:id
      body: UpdateQuote
      response: Quote
    - method: PATCH
      path: /:id/status
      body: { status }
      response: Quote
    - method: POST
      path: /:id/convert
      body: ConvertQuote (deliveryDate, deliveryTime?, deposit?)
      response: Quote (accepted, orderId preenchido)
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [quotes, clients, orders]
  indexes: [(user_id, status), (user_id, created_at)]
invariants:
  - total server-side
  - accepted nao edita; conversao unica
```

## Authorization & RLS

- Todas as rotas com `authMiddleware` + `getUserId(req)`; isolamento por userId em
  nível de aplicação (mesma estratégia das demais features).

## Contracts (Zod/DTO)

- `CreateQuoteDto` — title, clientId?/clientName?, items[1..50], validUntil?, notes?
- `ConvertQuoteDto` — deliveryDate, deliveryTime?, deposit?
- `QuoteDto` — inclui total, status, orderId, clientName resolvido.

## Errors

- 400 `ValidationError` — título/itens inválidos, edição de aprovado, conversão dupla,
  sinal > total.
- 404 `NotFoundError` — orçamento inexistente.

## Events / Side effects

- `convertToOrder` cria uma encomenda via `IOrderCreator` (notes = resumo dos itens).

## Performance

- Lista paginada (máx 50/página); clientName resolvido por lookup quando vinculado.

## Security

- Itens jsonb validados por Zod (descrição ≤200, qtd ≤99999, preço ≤MAX_MONEY).

## Test matrix

- Domínio: total (centavos exatos, vazio), validação (título/itens/validade), resumo.
- Usecases: total no create/update, bloqueio de edição de aprovado, conversão (cria
  order com amount/deposit/notes, marca accepted+orderId), conversão dupla, sinal>total,
  404, remoção.

## Examples

- `POST /api/v1/quotes` `{ "title": "Kit Safari", "items": [{"description": "Convite", "quantity": 30, "unitPrice": 2 }] }` → total 60.
- `POST /api/v1/quotes/:id/convert` `{ "deliveryDate": "2026-07-10", "deposit": 30 }`.

## Change log / Decisions

- 2026-06-10: criação. Conversão gera **encomenda** (não venda) porque o fluxo real é
  produzir antes de entregar; a venda nasce na entrega da encomenda. Orçamentos não
  contam no limite freemium de vendas.
