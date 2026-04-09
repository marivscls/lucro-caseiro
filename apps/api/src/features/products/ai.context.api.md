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

| Coluna              | Tipo      | Constraints          |
| ------------------- | --------- | -------------------- |
| id                  | uuid      | PK                   |
| userId              | uuid      | FK users, NOT NULL   |
| name                | varchar   | NOT NULL             |
| description         | text      | nullable             |
| category            | varchar   | NOT NULL             |
| photoUrl            | varchar   | nullable             |
| salePrice           | decimal   | NOT NULL             |
| costPrice           | decimal   | nullable             |
| recipeId            | uuid      | nullable, FK recipes |
| stockQuantity       | integer   | nullable             |
| stockAlertThreshold | integer   | nullable             |
| isActive            | boolean   | default true         |
| createdAt           | timestamp | default now()        |

## Invariants

- Nome do produto e obrigatorio (trim > 0 caracteres)
- Nome do produto deve ter no maximo 200 caracteres
- Preco de venda deve ser maior que zero
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
  - stockQuantity >= 0 (quando presente)
  - stockAlertThreshold >= 0 (quando presente)
  - delete e soft delete (isActive = false)
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateProductDto**: `{ name, description?, category, photoUrl?, salePrice, recipeId?, stockQuantity?, stockAlertThreshold? }`
- **UpdateProductDto**: `Partial<CreateProductDto>`
- **Product**: `{ id, userId, name, description, category, photoUrl, salePrice, costPrice, recipeId, stockQuantity, stockAlertThreshold, isActive, createdAt }`

## Errors

| Status | Quando                                   | Mensagem                   |
| ------ | ---------------------------------------- | -------------------------- |
| 400    | Nome vazio, preco <= 0, estoque negativo | Array de strings com erros |
| 404    | Produto nao encontrado                   | "Produto nao encontrado"   |

## Events / Side effects

- `decrementStock(userId, productId, quantity)` — chamado por Sales ao criar venda com produtos que tem controle de estoque
- Delete faz soft delete (set isActive = false), nao remove registro

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

- create: dados validos, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError

## Examples

```
POST /api/v1/products
{ "name": "Brigadeiro", "category": "doces", "salePrice": 3.50, "stockQuantity": 100, "stockAlertThreshold": 10 }
=> 201 { "id": "...", "name": "Brigadeiro", "salePrice": 3.5, "isActive": true, ... }

GET /api/v1/products?category=doces&search=brig
=> 200 { "items": [...], "total": 3, "page": 1, "totalPages": 1 }
```

## Change log / Decisions

- Criacao inicial com CRUD + soft delete + estoque
- `decrementStock` implementado no repo para uso por Sales
- Domain expoe `isLowStock` e `calculateStockStatus` para UI/notificacoes
