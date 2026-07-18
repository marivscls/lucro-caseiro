# ai.context.api.md — Recipes (+ Ingredients)

---

## Purpose

Gerenciar receitas e ingredientes do negocio. Receitas contem lista de ingredientes com quantidades, rendimento, instrucoes e calculos automaticos de custo total e custo por unidade. Ingredientes sao cadastrados separadamente com preco, quantidade por embalagem e unidade. Suporta escalonamento de receitas (multiplicador).

## Non-goals

- Nao gera lista de compras automatica (isso vive em `materials`)
- Conversao de unidades e LIMITADA (LIGHT, #14): so converte quando o insumo declara
  `contentPerUnit`/`contentUnit` (ex.: 1 lata = 350 ml) e a linha usa essa unidade de conteudo.
  NAO ha tabela global de conversao (kg↔g, L↔ml arbitrarios seguem fora de escopo).
- Nao calcula informacao nutricional
- Nao da baixa de estoque por si (a baixa de insumos na venda fica em `sales`, fase 3 do PRD)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateRecipeDto, UpdateRecipeDto, CreateIngredientDto, UpdateIngredientDto, PaginationDto, Recipe, RecipeIngredient, Ingredient), `@lucro-caseiro/database/schema` (recipes, recipeIngredients, ingredients)
- **Dependentes**: Products (referencia recipeId), Labels (pode usar ingredientes da receita), Subscription (conta receitas para limites freemium)
- **Sub-feature**: Ingredients vive no mesmo diretorio e tem suas proprias routes/usecases/repo

## Code pointers

### Recipes

- `apps/api/src/features/recipes/recipes.routes.ts` — rotas Express
- `apps/api/src/features/recipes/recipes.usecases.ts` — logica de negocio
- `apps/api/src/features/recipes/recipes.domain.ts` — validacoes e calculos puros
- `apps/api/src/features/recipes/recipes.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/recipes/recipes.types.ts` — interfaces e tipos
- `apps/api/src/features/recipes/recipes.domain.test.ts` — testes de dominio
- `apps/api/src/features/recipes/recipes.usecases.test.ts` — testes de usecases

### Ingredients

- `apps/api/src/features/recipes/ingredients.routes.ts` — rotas Express
- `apps/api/src/features/recipes/ingredients.usecases.ts` — logica de negocio
- `apps/api/src/features/recipes/ingredients.domain.ts` — validacoes e calculos puros
- `apps/api/src/features/recipes/ingredients.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/recipes/ingredients.types.ts` — interfaces e tipos
- `apps/api/src/features/recipes/ingredients.domain.test.ts` — testes de dominio
- `apps/api/src/features/recipes/ingredients.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `recipes`

| Coluna        | Tipo          | Constraints        |
| ------------- | ------------- | ------------------ |
| id            | uuid          | PK                 |
| userId        | uuid          | FK users, NOT NULL |
| name          | varchar       | NOT NULL           |
| category      | varchar       | NOT NULL           |
| instructions  | text          | nullable           |
| yieldQuantity | numeric(10,3) | NOT NULL           |
| yieldUnit     | varchar       | NOT NULL           |
| photoUrl      | varchar       | nullable           |
| totalCost     | decimal       | default "0"        |
| costPerUnit   | decimal       | default "0"        |
| createdAt     | timestamp     | default now()      |

### Tabela: `recipe_ingredients` (associacao)

| Coluna     | Tipo    | Constraints                                |
| ---------- | ------- | ------------------------------------------ |
| recipeId   | uuid    | FK recipes, NOT NULL                       |
| materialId | uuid    | aponta para `materials` (insumo), NOT NULL |
| quantity   | decimal | NOT NULL                                   |
| unit       | varchar | NOT NULL                                   |

> Unificacao (PRD ciclo de estoque): a linha de receita aponta para **insumos**
> (`materials`), nao mais para `ingredients`. A coluna antiga `ingredient_id` foi
> mantida como legado e deixa de ser usada apos a migracao.

### Tabela: `ingredients`

| Coluna             | Tipo      | Constraints        |
| ------------------ | --------- | ------------------ |
| id                 | uuid      | PK                 |
| userId             | uuid      | FK users, NOT NULL |
| name               | varchar   | NOT NULL           |
| price              | decimal   | NOT NULL           |
| quantityPerPackage | decimal   | NOT NULL           |
| unit               | varchar   | NOT NULL           |
| supplier           | varchar   | nullable           |
| updatedAt          | timestamp | default now()      |

## Invariants

### Recipes

- Nome da receita e obrigatorio (trim > 0)
- Nome da receita deve ter no maximo 200 caracteres
- Categoria e obrigatoria
- Rendimento (yieldQuantity) deve ser maior que zero (aceita decimais, ex.: 1,5 kg)
- Unidade de rendimento e obrigatoria
- Receita deve ter pelo menos um insumo
- totalCost = soma de (effectiveCostPerUnit(material, linha.unit) \* quantity) para cada insumo
- costPerUnit = totalCost / yieldQuantity
- **#14 effectiveCostPerUnit (LIGHT)**: se `material.contentPerUnit > 0` e
  `material.contentUnit` (trim, case-insensitive) == `linha.unit`, custo da linha usa
  `material.costPerUnit / material.contentPerUnit` (custo por unidade de conteudo). Caso
  contrario usa `material.costPerUnit` (inalterado/compativel). Divisao por zero protegida.

### Ingredients

- Nome do ingrediente e obrigatorio (trim > 0)
- Nome do ingrediente deve ter no maximo 200 caracteres
- Preco deve ser maior que zero
- Quantidade por embalagem deve ser maior que zero
- Unidade e obrigatoria (trim > 0)
- Unidade deve ter no maximo 20 caracteres

## Operations

```yaml
feature: recipes
app: api
mobile_counterpart: recipes
api:
  base: /api/v1/recipes
  endpoints:
    - method: POST
      path: /
      dto: CreateRecipeDto
      response: Recipe (201)
    - method: GET
      path: /
      query: page, limit, category, search
      dto: PaginationDto
      response: { items: Recipe[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Recipe
    - method: POST
      path: /:id/duplicate
      response: Recipe (201) — cópia independente, nome "X (cópia)"; respeita limite freemium (createGuard)
    - method: GET
      path: /:id/scale
      query: multiplier (number > 0)
      response: { ingredients: RecipeIngredient[], yieldQuantity: number }
    - method: PATCH
      path: /:id
      dto: UpdateRecipeDto
      response: Recipe
    - method: DELETE
      path: /:id
      response: 204

  ingredients_base: /api/v1/ingredients
  ingredients_endpoints:
    - method: POST
      path: /
      dto: CreateIngredientDto
      response: Ingredient (201)
    - method: GET
      path: /
      query: page, limit, search
      dto: PaginationDto
      response: { items: Ingredient[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Ingredient
    - method: PATCH
      path: /:id
      dto: UpdateIngredientDto
      response: Ingredient
    - method: DELETE
      path: /:id
      response: 204
db:
  tables:
    - recipes
    - recipeIngredients
    - ingredients
  indexes:
    - recipes(userId, id)
    - recipes(userId, category)
    - recipes(userId, createdAt DESC)
    - ingredients(userId, id)
    - ingredients(userId, updatedAt DESC)
    - recipeIngredients(recipeId)
invariants:
  - recipe.name.trim().length > 0
  - recipe.name.length <= 200
  - recipe.category.trim().length > 0
  - recipe.yieldQuantity > 0
  - recipe.yieldUnit.trim().length > 0
  - recipe.ingredients.length >= 1
  - ingredient.name.trim().length > 0
  - ingredient.price > 0
  - ingredient.quantityPerPackage > 0
  - ingredient.unit.trim().length > 0
  - ingredient.unit.length <= 20
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateRecipeDto**: `{ name, category, instructions?, yieldQuantity, yieldUnit, photoUrl?, ingredients: RecipeIngredient[] }`
- **UpdateRecipeDto**: `Partial<CreateRecipeDto>`
- **RecipeIngredient**: `{ materialId, quantity, unit }`
- **Recipe**: `{ id, userId, name, category, instructions, yieldQuantity, yieldUnit, photoUrl, totalCost, costPerUnit, ingredients: RecipeIngredientFull[], createdAt }`
- **RecipeIngredientFull**: `{ materialId, quantity, unit, materialName, materialCostPerUnit, cost }` — `materialCostPerUnit` reflete o custo por unidade DA LINHA (já convertido por #14 quando aplicável; `cost = materialCostPerUnit * quantity`)
- **CreateIngredientDto**: `{ name, price, quantityPerPackage, unit, supplier? }`
- **UpdateIngredientDto**: `Partial<CreateIngredientDto>`
- **Ingredient**: `{ id, userId, name, price, quantityPerPackage, unit, supplier, updatedAt }`

## Errors

| Status | Quando                                                                  | Mensagem                     |
| ------ | ----------------------------------------------------------------------- | ---------------------------- |
| 400    | Validacao de receita (nome, categoria, rendimento, ingredientes vazios) | Array de strings             |
| 400    | Validacao de ingrediente (nome, preco, qtd, unidade)                    | Array de strings             |
| 404    | Receita nao encontrada                                                  | "Receita nao encontrada"     |
| 404    | Ingrediente nao encontrado                                              | "Ingrediente nao encontrado" |

## Events / Side effects

- Ao criar/atualizar receita, `recipeIngredients` sao deletados e reinseridos (replace strategy)
- `updateCosts` no repo permite atualizar totalCost e costPerUnit (usado internamente)
- Custo total e por unidade sao recalculados em tempo de leitura (no `toRecipe`)

## Performance

- findAll de receitas faz N+1 para buscar ingredientes de cada receita (potencial otimizacao)
- Ingredientes ordenados por `updatedAt DESC`
- Busca por nome via `ILIKE`
- Filtro por categoria via `eq`

## Security

- Isolamento por `userId`
- Valores monetarios armazenados como string (decimal)

## Test matrix

### Recipes Domain (recipes.domain.test.ts)

- validateRecipeData: nome vazio/> 200, categoria vazia, rendimento zero/negativo, unidade vazia, ingredientes vazios, acumulo, rendimento decimal (1,5 kg)
- calculateRecipeCost: unico, multiplos, vazio
- calculateCostPerUnit: calculo correto, rendimento zero, rendimento negativo, rendimento decimal
- effectiveCostPerUnit (#14): converte lata→ml; case-insensitive/trim; fallback unidade propria;
  fallback sem conteudo; guard divisao por zero
- scaleRecipe: multiplier inteiro, fracionario, preserva props, vazio

### Recipes UseCases (recipes.usecases.test.ts)

- create: valido, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao
- update: valido, NotFoundError, ValidationError
- remove: existente, NotFoundError
- duplicate: cria copia "(copia)" com ingredientes, NotFoundError
- scale: multiplicador inteiro, fracionario, rendimento decimal (1,5 kg -> 3 kg), NotFoundError

### Ingredients Domain (ingredients.domain.test.ts)

- validateIngredientData: nome vazio/> 200, preco zero/negativo, qtd zero/negativa, unidade vazia/> 20, acumulo
- calculatePricePerUnit: calculo correto, qtd 1, decimais

### Ingredients UseCases (ingredients.usecases.test.ts)

- create: valido, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao
- update: valido, NotFoundError, ValidationError
- remove: existente, NotFoundError

## Examples

```
POST /api/v1/recipes
{ "name": "Brigadeiro", "category": "doces", "yieldQuantity": 30, "yieldUnit": "unidades",
  "ingredients": [{ "materialId": "mat-1", "quantity": 395, "unit": "g" }] }
=> 201 { "id": "...", "totalCost": 7.5, "costPerUnit": 0.25, ... }

GET /api/v1/recipes/recipe-1/scale?multiplier=2
=> 200 { "ingredients": [{ "quantity": 790, ... }], "yieldQuantity": 60 }

POST /api/v1/recipes/recipe-1/duplicate
=> 201 { "id": "novo-id", "name": "Brigadeiro (cópia)", "ingredients": [ ... iguais ... ] }

POST /api/v1/ingredients
{ "name": "Leite Condensado", "price": 7.50, "quantityPerPackage": 395, "unit": "g" }
=> 201 { "id": "...", "name": "Leite Condensado", "price": 7.5, ... }
```

## Change log / Decisions

- Receitas e ingredientes vivem na mesma feature (diretorio recipes)
- Ingredientes de receita sao deletados e reinseridos a cada update (replace strategy)
- Custo total e por unidade calculados em tempo de leitura (nao persistidos de forma definitiva)
- Scale retorna dados calculados sem persistir
- **Duplicar receita** (`POST /:id/duplicate`): reusa `repo.create` com os dados da
  original (nome + " (cópia)"), copiando todas as linhas de `recipe_ingredients`. Passa
  pelo mesmo `createGuard` da criação → respeita o limite freemium de receitas.
- **Unificacao (PRD ciclo de estoque)**: a linha de receita passou a referenciar `materials`
  (insumo) em vez de `ingredients`. Custo da linha = `material.costPerUnit * quantity`. A
  feature standalone Ingredients (`ingredients.*`) fica em desuso/aposentadoria; sera
  removida em chore posterior apos a migracao de dados.
- **#9 Rendimento decimal** (migration `008_recipe_yield_decimal.sql`): `recipes.yield_quantity`
  passou de `integer` para `numeric(10,3)` para aceitar decimais (ex.: 1,5 kg). Schema Drizzle
  agora usa `decimal(10,3)`, portanto a coluna volta como **string**: o repo (`toRecipe`) faz
  `Number(row.yieldQuantity)` e o insert/update usa `String(data.yieldQuantity)`. Contrato
  `CreateRecipeDto.yieldQuantity` e `RecipeDto.yieldQuantity` deixaram de ser `.int()`
  (agora `z.number().positive()`). `calculateCostPerUnit` e `scaleRecipe` ja eram puros em
  number e seguem corretos com decimais.
- **#14 Conversao unidade↔peso/volume (LIGHT)**: helper puro `effectiveCostPerUnit(material, lineUnit)`
  em `recipes.domain.ts`. O repo (`toRecipe`) passou a selecionar `materials.contentPerUnit` +
  `materials.contentUnit` e calcula `lineCost = effectiveCostPerUnit(material, line.unit) * quantity`.
  Backward compatible: linhas cuja unidade nao casa com `contentUnit` (ou insumos sem conteudo)
  mantem `costPerUnit * quantity`. `RecipeIngredientFull.materialCostPerUnit` passou a refletir o
  custo por unidade da linha (ja convertido) para manter `cost == materialCostPerUnit * quantity`.
  Sem tabela global de conversao — conversao arbitraria de unidades segue fora de escopo.
