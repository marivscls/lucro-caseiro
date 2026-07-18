# ai.context.api.md — Pricing

---

## Purpose

Calcular e armazenar precificacao de produtos do negocio, somando custos de ingredientes, embalagem, mao de obra e rateio de custos fixos, aplicando margem de lucro para sugerir preco de venda. Mantem historico de calculos por produto.

## Non-goals

- Nao atualiza automaticamente o preco de venda do produto
- Nao faz integracao com fornecedores para precos dinamicos
- Nao permite editar ou deletar calculos ja feitos (somente leitura apos criacao)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreatePricingDto, PaginationDto, Pricing e cálculos puros compartilhados), `@lucro-caseiro/database/schema` (pricingCalculations)
- **Dependentes**: nenhum diretamente
- **Cross-feature**: referencia `productId` de Products (opcional)

## Code pointers

- `apps/api/src/features/pricing/pricing.routes.ts` — rotas Express
- `apps/api/src/features/pricing/pricing.usecases.ts` — logica de negocio
- `apps/api/src/features/pricing/pricing.domain.ts` — calculos e validacoes puras
- `apps/api/src/features/pricing/pricing.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/pricing/pricing.types.ts` — interfaces e tipos
- `apps/api/src/features/pricing/pricing.domain.test.ts` — testes de dominio
- `apps/api/src/features/pricing/pricing.usecases.test.ts` — testes de usecases
- `packages/contracts/src/pricing-calculator.ts` — fonte única dos cálculos usados pela API, mobile e site

## Data Model

### Tabela: `pricing_calculations`

| Coluna         | Tipo      | Constraints                    |
| -------------- | --------- | ------------------------------ |
| id             | uuid      | PK                             |
| userId         | uuid      | FK users, NOT NULL             |
| productId      | uuid      | nullable, FK products          |
| ingredientCost | decimal   | NOT NULL                       |
| packagingCost  | decimal   | NOT NULL                       |
| laborCost      | decimal   | NOT NULL                       |
| fixedCostShare | decimal   | NOT NULL                       |
| totalCost      | decimal   | NOT NULL (calculado)           |
| marginPercent  | decimal   | NOT NULL                       |
| suggestedPrice | decimal   | NOT NULL (calculado)           |
| feesPercent    | decimal   | NOT NULL default 0             |
| feesAmount     | decimal   | NOT NULL default 0 (calculado) |
| finalPrice     | decimal   | NOT NULL default 0 (calculado) |
| createdAt      | timestamp | default now()                  |

> `feesPercent` = soma das taxas % sobre a venda (iFood, cartão...). `finalPrice` e
> `feesAmount` são derivados via **gross-up** (ver Invariants). Colunas adicionadas na
> migration `004_pricing_percentage_fees.sql` (existentes: `final_price = suggested_price`).

## Invariants

- Nenhum custo pode ser negativo (ingredientCost, packagingCost, laborCost, fixedCostShare >= 0)
- Margem de lucro nao pode ser negativa
- Margem de lucro nao pode exceder 1000%
- totalCost = ingredientCost + packagingCost + laborCost + fixedCostShare
- suggestedPrice = totalCost \* (1 + marginPercent / 100)
- feesPercent >= 0 e < 100 (taxas % sobre o preço de venda)
- finalPrice = suggestedPrice / (1 - feesPercent / 100) — **gross-up**: a taxa incide
  sobre a venda, não sobre o custo; preserva a margem (vendedor recebe `suggestedPrice`)
- feesAmount = finalPrice - suggestedPrice
- Toda query escopada por `userId`

## Operations

```yaml
feature: pricing
app: api
mobile_counterpart: pricing
api:
  base: /api/v1/pricing
  endpoints:
    - method: POST
      path: /calculate
      dto: CreatePricingDto
      response: Pricing (201)
    - method: GET
      path: /
      query: page, limit, productId
      dto: PaginationDto
      response: { items: Pricing[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Pricing
    - method: GET
      path: /product/:productId/history
      response: Pricing[]
db:
  tables:
    - pricingCalculations
  indexes:
    - (userId, id)
    - (userId, productId)
    - (userId, createdAt DESC)
invariants:
  - ingredientCost >= 0
  - packagingCost >= 0
  - laborCost >= 0
  - fixedCostShare >= 0
  - marginPercent >= 0 && marginPercent <= 1000
  - feesPercent >= 0 && feesPercent < 100
  - totalCost = sum of all costs
  - suggestedPrice = totalCost * (1 + marginPercent/100)
  - finalPrice = suggestedPrice / (1 - feesPercent/100)
  - feesAmount = finalPrice - suggestedPrice
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreatePricingDto**: `{ productId?, ingredientCost, packagingCost, laborCost, fixedCostShare, marginPercent, feesPercent? (0–95) }`
- **Pricing**: `{ id, userId, productId, ingredientCost, packagingCost, laborCost, fixedCostShare, totalCost, marginPercent, suggestedPrice, feesPercent, feesAmount, finalPrice, createdAt }`

## Errors

| Status | Quando                                       | Mensagem                                 |
| ------ | -------------------------------------------- | ---------------------------------------- |
| 400    | Custos negativos, margem negativa ou > 1000% | Array de strings com erros               |
| 400    | Taxas em % negativas ou >= 100%              | Array de strings com erros               |
| 404    | Calculo nao encontrado                       | "Calculo de precificacao nao encontrado" |

## Events / Side effects

- Nenhum

## Performance

- Historico por produto usa indice (userId, productId) ordenado por createdAt DESC
- Listagem paginada

## Security

- Isolamento por `userId`
- Valores monetarios armazenados como string (decimal) para evitar floating point

## Test matrix

### Domain (pricing.domain.test.ts)

- calculateTotalCost: soma correta, zeros, decimais
- calculateSuggestedPrice: margem aplicada, margem zero, margem alta, custo zero
- calculatePriceWithFees: taxa zero (sem mudança), gross-up correto (18% → 24,39), líquido preservado, taxa negativa tratada como zero
- calculateProfitPerUnit: positivo, zero, ambos zero
- validatePricingData: dados validos, custos zero aceitos, cada custo negativo rejeitado, margem negativa, margem > 1000, feesPercent negativo, feesPercent >= 100, feesPercent valido, acumulo

### UseCases (pricing.usecases.test.ts)

- calculate: calculo correto, margem zero, custos zero, ValidationError, com productId
- getById: encontrado, NotFoundError
- list: paginacao
- getHistory: com resultados, vazio

## Examples

```
POST /api/v1/pricing/calculate
{ "ingredientCost": 10, "packagingCost": 5, "laborCost": 3, "fixedCostShare": 2, "marginPercent": 50 }
=> 201 { "totalCost": 20, "suggestedPrice": 30, "feesPercent": 0, "feesAmount": 0, "finalPrice": 30, ... }

POST /api/v1/pricing/calculate  (com taxas iFood 15% + cartão 3% = 18%)
{ "ingredientCost": 10, "packagingCost": 5, "laborCost": 3, "fixedCostShare": 2, "marginPercent": 50, "feesPercent": 18 }
=> 201 { "suggestedPrice": 30, "feesPercent": 18, "feesAmount": 6.59, "finalPrice": 36.59, ... }

GET /api/v1/pricing/product/prod-1/history
=> 200 [{ "totalCost": 20, "suggestedPrice": 30, "createdAt": "..." }, ...]
```

## Change log / Decisions

- 2026-07-16: `calculateTotalCost`, `calculateSuggestedPrice`, `calculateProfitPerUnit` e
  gross-up de taxas passaram a consumir a fonte única em `@lucro-caseiro/contracts`, também usada
  pela calculadora pública e pelo mobile; validação e persistência continuam no domínio da API.
- Criacao inicial com calculo + historico
- Pricing e append-only (sem update/delete) para manter historico
- Funcao `calculateProfitPerUnit` disponivel no dominio mas nao exposta via API
- **Taxas/despesas em % (iFood, cartão)**: `feesPercent` opcional no calculo. Aplicado via
  **gross-up** (`finalPrice = suggestedPrice / (1 - feesPercent/100)`) para que a taxa
  incida sobre a venda e a margem do vendedor seja preservada. Somar `preço × taxa%` ao
  custo estaria errado (subestima). Colunas `fees_percent/fees_amount/final_price` na
  migration `004`. Inspirado em reviews do concorrente (ver `tasks/prd-melhorias-concorrente.md`).
