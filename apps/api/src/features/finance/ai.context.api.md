# ai.context.api.md — Finance

---

## Purpose

Gerenciar lancamentos financeiros (entradas e saidas) do negocio caseiro, com resumo mensal de receita, despesas e lucro. Oferece exportacao de relatorios em PDF e Excel.

## Non-goals

- Nao faz integracao bancaria ou leitura de extratos
- Nao gerencia contas a receber/pagar com vencimentos
- Nao faz conciliacao automatica
- Nao calcula impostos

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateFinanceEntryDto, UpdateFinanceEntryDto, PaginationDto, FinanceEntry, FinanceSummary), `@lucro-caseiro/database/schema` (financeEntries), `pdfkit`, `exceljs`
- **Dependentes**: Sales pode criar lancamentos via `createFromSale`
- **Nao importa**: nenhuma outra feature interna

## Code pointers

- `apps/api/src/features/finance/finance.routes.ts` — rotas Express
- `apps/api/src/features/finance/finance.usecases.ts` — logica de negocio
- `apps/api/src/features/finance/finance.domain.ts` — validacoes e funcoes puras
- `apps/api/src/features/finance/finance.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/finance/finance.types.ts` — interfaces e tipos
- `apps/api/src/features/finance/finance.export.ts` — geracao de PDF e Excel
- `apps/api/src/features/finance/finance.domain.test.ts` — testes de dominio
- `apps/api/src/features/finance/finance.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `finance_entries`

| Coluna      | Tipo      | Constraints                                                                                   |
| ----------- | --------- | --------------------------------------------------------------------------------------------- |
| id          | uuid      | PK                                                                                            |
| userId      | uuid      | FK users, NOT NULL                                                                            |
| type        | enum      | "income" \| "expense", NOT NULL                                                               |
| category    | enum      | "sale" \| "material" \| "packaging" \| "transport" \| "fee" \| "utility" \| "other", NOT NULL |
| amount      | decimal   | NOT NULL                                                                                      |
| description | varchar   | NOT NULL                                                                                      |
| date        | varchar   | NOT NULL (formato YYYY-MM-DD)                                                                 |
| saleId      | uuid      | nullable, FK sales                                                                            |
| createdAt   | timestamp | default now()                                                                                 |

## Invariants

- Valor (amount) deve ser maior que zero
- Descricao e obrigatoria (trim > 0 caracteres)
- Descricao deve ter no maximo 500 caracteres
- Data deve ser valida no formato YYYY-MM-DD
- Toda query e escopada por `userId`
- Lucro = receita - despesas (funcao pura `calculateProfit`)

## Operations

```yaml
feature: finance
app: api
mobile_counterpart: finance
api:
  base: /api/v1/finance
  endpoints:
    - method: POST
      path: /
      dto: CreateFinanceEntryDto
      response: FinanceEntry (201)
    - method: GET
      path: /
      query: page, limit, type, category, startDate, endDate
      dto: PaginationDto
      response: { items: FinanceEntry[], total, page, totalPages }
    - method: GET
      path: /summary
      query: month, year
      response: FinanceSummary
    - method: GET
      path: /export/pdf
      query: month (YYYY-MM)
      response: application/pdf (binary)
    - method: GET
      path: /export/xlsx
      query: month (YYYY-MM)
      response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (binary)
    - method: GET
      path: /:id
      response: FinanceEntry
    - method: PATCH
      path: /:id
      dto: UpdateFinanceEntryDto
      response: FinanceEntry
    - method: DELETE
      path: /:id
      response: 204
db:
  tables:
    - financeEntries
  indexes:
    - (userId, id)
    - (userId, date DESC)
    - (userId, type)
invariants:
  - amount > 0
  - description.trim().length > 0
  - description.length <= 500
  - date formato YYYY-MM-DD valido
  - profit = totalIncome - totalExpenses
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT via `getUserId(req)`
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateFinanceEntryDto**: `{ type: "income"|"expense", category, amount, description, date, saleId? }`
- **UpdateFinanceEntryDto**: `Partial<CreateFinanceEntryDto>`
- **FinanceEntry**: `{ id, userId, type, category, amount, description, date, saleId, createdAt }`
- **FinanceSummary**: `{ totalIncome, totalExpenses, profit, period }`

## Errors

| Status | Quando                                                       | Mensagem                    |
| ------ | ------------------------------------------------------------ | --------------------------- |
| 400    | Dados invalidos (valor <= 0, descricao vazia, data invalida) | Array de strings com erros  |
| 404    | Lancamento nao encontrado                                    | "Lancamento nao encontrado" |

## Events / Side effects

- `createFromSale`: funcao publica que Sales pode chamar para criar lancamento de entrada vinculado a uma venda
- Exportacao PDF/Excel gera buffer em memoria (nao persiste arquivo)

## Performance

- Listagem com filtros combinados (type, category, startDate, endDate) + paginacao
- Summary usa `SUM` agregado com filtro por range de datas
- Income e expense calculados em queries paralelas (`Promise.all`)
- Exportacao limita a 10000 registros por relatorio

## Security

- Dados financeiros sao prioridade de seguranca (conforme CLAUDE.md)
- Exportacao de PDF/Excel deve ser restrita a usuario autenticado
- Isolamento por `userId`

## Test matrix

### Domain (finance.domain.test.ts)

- calculateProfit: positivo, negativo, zero
- validateFinanceEntry: amount zero/negativo, descricao vazia/> 500, data invalida/vazia, acumulo
- formatCurrency: inteiro, decimal, zero, grande
- groupByCategory: multiplas categorias, vazio, categoria unica

### UseCases (finance.usecases.test.ts)

- create: dados validos, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError
- getMonthlySummary: retorno correto, range de datas correto
- createFromSale: cria lancamento income vinculado a sale

## Examples

```
POST /api/v1/finance
{ "type": "expense", "category": "material", "amount": 50, "description": "Compra de farinha", "date": "2026-03-15" }
=> 201 { "id": "...", "type": "expense", ... }

GET /api/v1/finance/summary?month=3&year=2026
=> 200 { "totalIncome": 1000, "totalExpenses": 600, "profit": 400, "period": "2026-03" }

GET /api/v1/finance/export/pdf?month=2026-03
=> 200 (PDF binary)
```

## Change log / Decisions

- Criacao inicial com CRUD + summary mensal
- Adicionado exportacao PDF e Excel
- `createFromSale` permite Sales criar lancamentos automaticos
