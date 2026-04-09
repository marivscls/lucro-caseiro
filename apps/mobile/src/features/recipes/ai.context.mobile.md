# ai.context.mobile.md — Recipes (Mobile Feature)

---

## Purpose

Gerenciar receitas do negocio caseiro: criar, listar, visualizar detalhes, editar, excluir e escalar receitas. Calcula custo total e custo por unidade com base nos ingredientes. Permite filtrar por categoria e ajustar escala da receita (0.5x a 5x).

## Non-goals

- Nao precifica o produto final (feature `pricing`).
- Nao gerencia o catalogo de ingredientes avulsos (apenas cadastro rapido inline).
- Nao gera rotulos (feature `labels`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Recipe`, `CreateRecipe`, `UpdateRecipe`, `Ingredient`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/utils/api-client`.
- **Dependentes:** nenhum direto no momento.

## Code pointers

| Arquivo                                                              | Descricao                                                                                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/recipes/api.ts`                            | Funcoes HTTP (fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe, scaleRecipe, fetchIngredients, createIngredient) |
| `apps/mobile/src/features/recipes/hooks.ts`                          | React Query hooks                                                                                                                   |
| `apps/mobile/src/features/recipes/components/create-recipe-form.tsx` | Formulario de criacao com ingredientes dinamicos                                                                                    |
| `apps/mobile/src/features/recipes/components/edit-recipe-form.tsx`   | Formulario de edicao                                                                                                                |
| `apps/mobile/src/features/recipes/components/recipe-card.tsx`        | Card de receita na listagem                                                                                                         |
| `apps/mobile/src/features/recipes/components/recipe-detail.tsx`      | Detalhe com tabela de ingredientes e escala                                                                                         |
| `apps/mobile/src/features/recipes/components/recipe-list.tsx`        | Lista com filtro por categoria                                                                                                      |
| `apps/mobile/src/app/recipes.tsx`                                    | Screen (rota `/recipes`) com modais de CRUD                                                                                         |

## Components

### `RecipeCard`

- **Props:** `{ recipe: Recipe; onPress?: () => void }`
- Exibe nome, categoria (Badge), custo por unidade e rendimento.

### `RecipeList`

- **Props:** `{ onRecipePress?: (id: string) => void; onAddPress?: () => void }`
- FlatList com filtro por categoria via chips (Todas, Doces, Salgados, Bolos, Bebidas, Outros).
- Header com titulo e descricao.
- EmptyState quando sem dados.

### `RecipeDetail`

- **Props:** `{ recipeId: string; onDuplicate?: () => void; onEdit?: () => void; onDeleted?: () => void }`
- Exibe nome, categoria, modo de preparo (Card), custo total e custo por unidade.
- Seletor de escala (0.5x, 1x, 1.5x, 2x, 3x, 5x) via chips.
- Tabela de ingredientes com nome, quantidade, unidade e custo.
- Botoes de editar e excluir (com confirmacao Alert).
- Usa `useScaleRecipe` para receita escalada.

### `CreateRecipeForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), categoria (obrigatorio), modo de preparo, rendimento (quantidade + unidade), ingredientes dinamicos (nome, quantidade, unidade).
- Adicionar/remover ingredientes.
- Checa limite freemium via `useLimitCheck("recipes")`.

### `EditRecipeForm`

- **Props:** `{ recipe: Recipe; onSuccess?: () => void }`
- Mesma estrutura do create, pre-preenchido. Usa `ingredientId` em vez de nome.

## Hooks

| Hook                             | Tipo          | Descricao                                                                                                  |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `useRecipes(opts?)`              | `useQuery`    | Lista paginada. Query key: `["recipes", opts]`                                                             |
| `useRecipe(id)`                  | `useQuery`    | Detalhe. Query key: `["recipes", id]`                                                                      |
| `useScaleRecipe(id, multiplier)` | `useQuery`    | Receita escalada. Habilitado apenas se multiplier !== 1. Query key: `["recipes", id, "scale", multiplier]` |
| `useCreateRecipe()`              | `useMutation` | Cria receita. Invalida `["recipes"]`.                                                                      |
| `useUpdateRecipe()`              | `useMutation` | Atualiza receita. Invalida `["recipes"]`.                                                                  |
| `useDeleteRecipe()`              | `useMutation` | Remove receita. Invalida `["recipes"]`.                                                                    |
| `useIngredients(opts?)`          | `useQuery`    | Lista de ingredientes. Query key: `["ingredients", opts]`                                                  |
| `useCreateIngredient()`          | `useMutation` | Cria ingrediente. Invalida `["ingredients"]`.                                                              |

## API Integration

| Endpoint                    | Verbo  | Funcao             | Parametros                                                   |
| --------------------------- | ------ | ------------------ | ------------------------------------------------------------ |
| `/api/v1/recipes`           | GET    | `fetchRecipes`     | `?page=N&category=cat`                                       |
| `/api/v1/recipes/:id`       | GET    | `fetchRecipe`      | path param `id`                                              |
| `/api/v1/recipes`           | POST   | `createRecipe`     | body: `CreateRecipe`                                         |
| `/api/v1/recipes/:id`       | PATCH  | `updateRecipe`     | body: `UpdateRecipe`                                         |
| `/api/v1/recipes/:id`       | DELETE | `deleteRecipe`     | -                                                            |
| `/api/v1/recipes/:id/scale` | GET    | `scaleRecipe`      | `?multiplier=N`                                              |
| `/api/v1/ingredients`       | GET    | `fetchIngredients` | `?page=N&search=term`                                        |
| `/api/v1/ingredients`       | POST   | `createIngredient` | body: `{ name, price, quantityPerPackage, unit, supplier? }` |

## Contracts

- `Recipe` — receita (id, name, category, instructions, yieldQuantity, yieldUnit, costPerUnit, ingredients[]).
- `CreateRecipe` — payload (name, category, instructions?, yieldQuantity, yieldUnit, ingredients[]).
- `UpdateRecipe` — payload de edicao.
- `Ingredient` — ingrediente (id, name, price, quantityPerPackage, unit, supplier).

## Error Handling

- **Erro de listagem:** EmptyState com "Nao foi possivel carregar suas receitas."
- **Erro de criacao/edicao:** `Alert.alert("Erro", "Nao foi possivel cadastrar/atualizar a receita. Tente novamente.")`.
- **Erro de exclusao:** `Alert.alert("Erro", "Nao foi possivel excluir a receita.")`.
- **Validacao local:** nome e categoria obrigatorios, rendimento > 0, unidade obrigatoria, pelo menos 1 ingrediente valido.
- **Limite freemium:** `useLimitCheck("recipes")` no create.

## Performance

- FlatList para listagem.
- Escala de receita via query separada (evita recalcular no front).
- Filtro por categoria via query param no backend.

## Test matrix

- [ ] `useRecipes` filtra por categoria
- [ ] `useScaleRecipe` so habilita se multiplier !== 1
- [ ] `CreateRecipeForm` valida ingrediente minimo
- [ ] `CreateRecipeForm` checa limite freemium
- [ ] `RecipeDetail` calcula custo total e por unidade
- [ ] Exclusao com confirmacao funciona
- [ ] Adicionar/remover ingredientes dinamicamente

## Examples

- Acessado via Home (quick access "Receitas") ou rota `/recipes`.
- Fluxo: lista -> tap receita -> modal detalhe (com escala) -> editar (modal) -> salvar.
- Criacao via FAB ou EmptyState.

## Change log / Decisions

- Escala de receita delegada ao backend (GET /recipes/:id/scale?multiplier=N).
- Ingredientes no create usam nome como `ingredientId` (simplificacao para MVP).
- Limite freemium: 5 receitas no Free.
