# ai.context.api.md — Products

---

## Purpose

Gerenciar o catalogo de produtos do negocio caseiro, incluindo nome, descricao, categoria, preco de venda, foto, vinculo com receita e controle de estoque com alertas de nivel baixo. Suporta **produtos compostos (kit/caixinha)**: um produto montado a partir de outros produtos (cada um com quantidade), com custo rolado automaticamente.

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
| code                | text      | nullable (SKU/código de barras)           |
| salePrice           | decimal   | NOT NULL                                  |
| saleUnit            | text      | NOT NULL, default 'unit' ('unit' \| 'kg') |
| costPrice           | decimal   | nullable                                  |
| recipeId            | uuid      | nullable, FK recipes                      |
| stockQuantity       | integer   | nullable                                  |
| stockAlertThreshold | integer   | nullable                                  |
| isComposite         | boolean   | NOT NULL, default false                   |
| isActive            | boolean   | default true                              |
| createdAt           | timestamp | default now()                             |

### Tabela: `product_components` (junção do kit)

| Coluna             | Tipo          | Constraints                                     |
| ------------------ | ------------- | ----------------------------------------------- |
| id                 | uuid          | PK                                              |
| productId          | uuid          | FK products (o kit), onDelete cascade, NOT NULL |
| componentProductId | uuid          | FK products (produto-filho), NOT NULL           |
| quantity           | numeric(10,3) | NOT NULL                                        |

- Index: `(productId)`.
- Estrategia de persistencia: **replace** (igual `recipe_ingredients`) — em create/update do kit, apaga e regrava as linhas quando `components` vem definido.

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

### Produto composto (kit/caixinha)

- `isComposite = true` marca o produto como kit.
- Um kit precisa de **>= 1 componente**; cada componente tem `quantity > 0`.
- Os componentes devem ser **produtos do proprio usuario** e **NAO compostos** (sem
  aninhamento no MVP -> evita recursao). Validado nos usecases via `findComponentCandidates`.
- Um produto **nao pode ser componente dele mesmo** (`componentProductId !== productId`).
- **Custo do kit (rollup)**: `costPrice = soma(custo_do_componente x quantidade)`,
  computado **na leitura** no repo (`toProduct` chama `calculateCompositeCost`). Componentes
  sem custo conhecido contam como 0. O `cost_price` armazenado da linha do kit nao e usado
  (fica null/ignorado para compostos).
- Um kit conta como um produto normal no create (mesmo fluxo `create`); nao ha limite
  freemium dedicado a produtos.

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
    - product_components
  indexes:
    - (userId, id)
    - (userId, isActive, createdAt DESC)
    - (userId, category)
    - (userId, code)
    - product_components(productId)
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - salePrice > 0
  - saleUnit in ('unit', 'kg') (default 'unit'; quando 'kg', salePrice = preco por kg)
  - stockQuantity >= 0 (quando presente)
  - stockAlertThreshold >= 0 (quando presente)
  - delete e soft delete (isActive = false)
  - isComposite => components.length >= 1, cada quantity > 0
  - componente NAO pode ser composto (sem aninhamento), deve ser do mesmo usuario
  - componentProductId != productId (sem auto-referencia)
  - custo do kit = soma(custo_componente x quantidade), computado na leitura
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateProductDto**: `{ name, description?, category, photoUrl?, code?, salePrice, saleUnit?, recipeId?, stockQuantity?, stockAlertThreshold?, isComposite?, components? }`
  - `refine`: quando `isComposite`, `components` precisa ter >= 1 item.
- **UpdateProductDto**: `Partial<CreateProductDto>` (com o mesmo refine de composto)
- **ProductComponentInputDto**: `{ componentProductId: uuid, quantity: number > 0 }` (entrada)
- **ProductComponentDto**: `{ componentProductId: uuid, name, costPrice: number|null, quantity }` (saida/display)
- **Product**: `{ id, userId, name, description, category, photoUrl, code, salePrice, saleUnit, costPrice, recipeId, stockQuantity, stockAlertThreshold, isComposite, components?, isActive, createdAt }`
  - `components` presente apenas quando `isComposite = true`.
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
- Busca por nome **ou código** via `ILIKE` (OR entre `name` e `code`)
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
- calculateCompositeCost: vazio -> 0, soma custo x qty, costPrice null conta como 0
- validateCompositeComponents: vazio rejeitado, qty <= 0 rejeitado, auto-referencia rejeitada, sem productId (create) ok

### UseCases (products.usecases.test.ts)

- create: dados validos, ValidationError, repassa saleUnit 'kg' para o repo (venda por peso)
- create composto: cria com componentes (costPrice undefined, vem do rollup), rejeita sem componentes,
  rejeita componente composto (sem aninhamento), rejeita componente de outro usuario (nao encontrado)
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

POST /api/v1/products  (produto composto / kit / caixinha)
{
  "name": "Caixinha de doces", "category": "kits", "salePrice": 50.00,
  "isComposite": true,
  "components": [
    { "componentProductId": "<id-brigadeiro>", "quantity": 6 },
    { "componentProductId": "<id-beijinho>", "quantity": 4 }
  ]
}
=> 201 {
  "id": "...", "name": "Caixinha de doces", "isComposite": true,
  "costPrice": 12.50,   // rollup: soma(custo_componente x qty)
  "components": [
    { "componentProductId": "...", "name": "Brigadeiro", "costPrice": 1.25, "quantity": 6 },
    { "componentProductId": "...", "name": "Beijinho", "costPrice": 1.25, "quantity": 4 }
  ], ...
}
```

## Change log / Decisions

- Criacao inicial com CRUD + soft delete + estoque
- `decrementStock` implementado no repo para uso por Sales
- Domain expoe `isLowStock` e `calculateStockStatus` para UI/notificacoes
- 2026-05-30: **venda por peso** — coluna `sale_unit` ('unit' | 'kg', default 'unit', migration `006_sell_by_weight.sql`).
  Quando 'kg', `salePrice` = preco por quilo. Produtos por peso nao usam estoque por unidade
  (Sales pula baixa de estoque). Threaded em CreateProductData/UpdateProductDto/Product e no repo.
- 2026-05-30: **produto composto / kit / caixinha** — nova tabela `product_components` +
  coluna `products.is_composite` (migration `007_composite_products.sql`). Um kit e montado a
  partir de outros produtos (cada um com quantidade). Custo do kit = soma(custo_componente x qty),
  **computado na leitura** no repo (igual ao `costPerUnit` das receitas), nao armazenado.
  Persistencia dos componentes via **replace strategy** (espelha `recipe_ingredients`).
  Validacoes: >= 1 componente, qty > 0, sem auto-referencia (dominio); componente do mesmo
  usuario e nao-composto, **sem aninhamento no MVP** (usecases via `findComponentCandidates`).
  Decisao: kit nao tem estoque proprio por unidade no MVP.
- 2026-06-16: **código do produto (SKU/código de barras)** — coluna `products.code` (text, nullable,
  migration `019_product_code.sql`) + índice `(user_id, code)`. Threaded em CreateProductData/
  UpdateProductDto/Product e no repo. A **busca** (`?search=`) passou a casar por **nome OU código**
  (`ILIKE` em ambos), habilitando o scanner de câmera do mobile (escaneia → filtra a lista por código).
- 2026-06-16: **limite freemium de produtos (20 no free)** — `POST /products` agora passa pelo
  `freemiumGuard("products")`; `ResourceCounts.products` conta produtos **ativos** (`is_active = true`);
  `FreemiumConfig.maxProducts = 20`; `FreemiumLimits` ganhou `maxProducts`/`currentProducts`.
  (O catálogo público continua limitado a 5 itens no free — coisa separada do cadastro.)
