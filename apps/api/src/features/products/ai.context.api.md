# ai.context.api.md — Products

---

## Purpose

Gerenciar o catalogo de produtos do negocio caseiro, incluindo nome, descricao, categoria, preco de venda, foto, vinculo com receita e controle de estoque com alertas de nivel baixo.

## Non-goals

- Nao faz precificacao automatica (isso e feito na feature Pricing)
- Nao gerencia pedidos de producao
- Nao faz catalogo publico ou vitrine para clientes
- Nao controla lotes ou validade

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateProductDto, UpdateProductDto, PaginationDto, Product), `@lucro-caseiro/database/schema` (products)
- **Dependentes**: Sales (referencia productId nos itens), Pricing (referencia productId), Labels (referencia productId), Packaging (vinculo produto-embalagem)
- **Composição (injetado)**: `IRecipeCostProvider` (satisfeito por `RecipesUseCases.getById`) — usado para derivar `costPrice` da receita.
- **Cross-feature**: Sales usa `IProductsRepo` diretamente para checar/decrementar estoque

## Code pointers

- `apps/api/src/features/products/products.routes.ts` — rotas Express
- `apps/api/src/features/products/products.usecases.ts` — logica de negocio
- `apps/api/src/features/products/products.domain.ts` — validacoes e funcoes puras
- `apps/api/src/features/products/products.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/products/products.types.ts` — interfaces e tipos
- `apps/api/src/features/products/products.domain.test.ts` — testes de dominio
- `apps/api/src/features/products/products.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `products`

| Coluna              | Tipo      | Constraints                               |
| ------------------- | --------- | ----------------------------------------- |
| id                  | uuid      | PK                                        |
| userId              | uuid      | FK users, NOT NULL                        |
| name                | varchar   | NOT NULL                                  |
| description         | text      | nullable                                  |
| category            | varchar   | NOT NULL                                  |
| photoUrl            | varchar   | nullable                                  |
| salePrice           | decimal   | NOT NULL                                  |
| saleUnit            | text      | NOT NULL, default 'unit' ('unit' \| 'kg') |
| costPrice           | decimal   | nullable                                  |
| recipeId            | uuid      | nullable, FK recipes                      |
| stockQuantity       | integer   | nullable                                  |
| stockAlertThreshold | integer   | nullable                                  |
| isActive            | boolean   | default true                              |
| createdAt           | timestamp | default now()                             |

## Invariants

- Nome do produto e obrigatorio (trim > 0 caracteres)
- Nome do produto deve ter no maximo 200 caracteres
- Preco de venda deve ser maior que zero
- `saleUnit` define a unidade de venda: `'unit'` (por unidade, default) ou `'kg'` (por quilo).
  Quando `'kg'`, `salePrice` representa o preco por quilo (R$/kg).
- Produtos vendidos por peso (`saleUnit = 'kg'`) nao usam controle de estoque por unidade
  (Sales pula validacao/baixa de estoque para eles).
- Quantidade em estoque nao pode ser negativa (quando presente)
- Alerta de estoque nao pode ser negativo (quando presente)
- Delete e soft delete (isActive = false), nao fisico
- Listagem por padrao retorna apenas produtos ativos (isActive = true)
- Toda query escopada por `userId`

## Operations

```yaml
feature: products
app: api
mobile_counterpart: products
api:
  base: /api/v1/products
  endpoints:
    - method: POST
      path: /
      dto: CreateProductDto
      response: Product (201)
    - method: GET
      path: /
      query: page, limit, category, search
      dto: PaginationDto
      response: { items: Product[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Product
    - method: PATCH
      path: /:id
      dto: UpdateProductDto
      response: Product
    - method: DELETE
      path: /:id
      response: 204 (soft delete)
db:
  tables:
    - products
  indexes:
    - (userId, id)
    - (userId, isActive, createdAt DESC)
    - (userId, category)
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - salePrice > 0
  - saleUnit in ('unit', 'kg') (default 'unit'; quando 'kg', salePrice = preco por kg)
  - stockQuantity >= 0 (quando presente)
  - stockAlertThreshold >= 0 (quando presente)
  - delete e soft delete (isActive = false)
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateProductDto**: `{ name, description?, category, photoUrl?, salePrice, saleUnit?, recipeId?, stockQuantity?, stockAlertThreshold? }`
- **UpdateProductDto**: `Partial<CreateProductDto>`
- **Product**: `{ id, userId, name, description, category, photoUrl, salePrice, saleUnit, costPrice, recipeId, stockQuantity, stockAlertThreshold, isActive, createdAt }`
- **SaleUnit**: `"unit" | "kg"` (default `"unit"`)

## Errors

| Status | Quando                                   | Mensagem                   |
| ------ | ---------------------------------------- | -------------------------- |
| 400    | Nome vazio, preco <= 0, estoque negativo | Array de strings com erros |
| 404    | Produto nao encontrado                   | "Produto nao encontrado"   |

## Events / Side effects

- `decrementStock(userId, productId, quantity)` — chamado por Sales ao criar venda com produtos que tem controle de estoque
- Delete faz soft delete (set isActive = false), nao remove registro
- **Custo real via receita**: ao criar/atualizar um produto com `recipeId`, o `costPrice` é
  preenchido automaticamente com o `costPerUnit` da receita (custo dos insumos), via
  `IRecipeCostProvider` injetado (satisfeito por `RecipesUseCases.getById`). Sem receita,
  mantém o `costPrice` informado.

## Performance

- Listagem filtra por `isActive = true` por padrao
- Busca por nome via `ILIKE`
- Filtro por categoria via `eq`
- `countByUser` conta apenas ativos

## Security

- Isolamento por `userId`
- Valores monetarios armazenados como string (decimal)

## Test matrix

### Domain (products.domain.test.ts)

- validateProductData: preco zero/negativo, nome vazio/> 200, estoque negativo, alerta negativo, acumulo
- isLowStock: null, abaixo, igual, acima
- calculateStockStatus: null -> untracked, 0 -> out, <= threshold -> low, > threshold -> ok, sem threshold -> ok

### UseCases (products.usecases.test.ts)

- create: dados validos, ValidationError, repassa saleUnit 'kg' para o repo (venda por peso)
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError

## Examples

```
POST /api/v1/products
{ "name": "Brigadeiro", "category": "doces", "salePrice": 3.50, "stockQuantity": 100, "stockAlertThreshold": 10 }
=> 201 { "id": "...", "name": "Brigadeiro", "salePrice": 3.5, "saleUnit": "unit", "isActive": true, ... }

POST /api/v1/products  (venda por peso)
{ "name": "Bolo de pote", "category": "bolos", "salePrice": 80.00, "saleUnit": "kg" }
=> 201 { "id": "...", "name": "Bolo de pote", "salePrice": 80, "saleUnit": "kg", ... }  // R$80/kg

GET /api/v1/products?category=doces&search=brig
=> 200 { "items": [...], "total": 3, "page": 1, "totalPages": 1 }
```

## Change log / Decisions

- Criacao inicial com CRUD + soft delete + estoque
- `decrementStock` implementado no repo para uso por Sales
- Domain expoe `isLowStock` e `calculateStockStatus` para UI/notificacoes
- 2026-05-30: **venda por peso** — coluna `sale_unit` ('unit' | 'kg', default 'unit', migration `006_sell_by_weight.sql`).
  Quando 'kg', `salePrice` = preco por quilo. Produtos por peso nao usam estoque por unidade
  (Sales pula baixa de estoque). Threaded em CreateProductData/UpdateProductDto/Product e no repo.
