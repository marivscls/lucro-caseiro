# ai.context.mobile.md — Recipes (Mobile Feature)

---

## Purpose

Gerenciar receitas do negocio: criar, listar, visualizar detalhes, editar, excluir e escalar receitas. Calcula custo total e custo por unidade com base nos ingredientes. Permite filtrar por categoria e ajustar escala da receita (0.5x a 5x).

## Non-goals

- Nao precifica o produto final (feature `pricing`).
- Nao gerencia o catalogo de ingredientes avulsos (apenas cadastro rapido inline).
- Nao gera rotulos (feature `labels`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Recipe`, `CreateRecipe`, `UpdateRecipe`, `Ingredient`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/utils/api-client`.
- **Dependentes:** nenhum direto no momento.

## Code pointers

| Arquivo                                                                   | Descricao                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/recipes/api.ts`                                 | Funcoes HTTP (fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe, scaleRecipe, fetchIngredients, createIngredient) |
| `apps/mobile/src/features/recipes/hooks.ts`                               | React Query hooks                                                                                                                   |
| `apps/mobile/src/features/recipes/recipe-pdf.ts`                          | `buildRecipeHtml(recipe)` + `exportRecipePdf(recipe)` — gera PDF da receita e abre share/print (expo-print + expo-sharing)          |
| `apps/mobile/src/features/recipes/yield-units.ts`                         | `YIELD_UNIT_PRESETS` — atalhos de unidade de rendimento (unidades, fatias, porções, kg, g)                                          |
| `apps/mobile/src/features/recipes/components/create-recipe-form.tsx`      | Formulario de criacao com ingredientes dinamicos                                                                                    |
| `apps/mobile/src/features/recipes/components/recipe-materials-editor.tsx` | Editor de linhas de insumo: seleciona insumo, unidade (#14) e quantidade; preview de custo                                          |
| `apps/mobile/src/features/recipes/components/edit-recipe-form.tsx`        | Formulario de edicao                                                                                                                |
| `apps/mobile/src/features/recipes/components/recipe-card.tsx`             | Card de receita na listagem                                                                                                         |
| `apps/mobile/src/features/recipes/components/recipe-detail.tsx`           | Detalhe com tabela de ingredientes e escala                                                                                         |
| `apps/mobile/src/features/recipes/components/recipe-list.tsx`             | Lista com filtro por categoria                                                                                                      |
| `apps/mobile/src/app/recipes.tsx`                                         | Screen (rota `/recipes`) com modais de CRUD                                                                                         |

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
- Botoes de editar, **imprimir/compartilhar (PDF)**, duplicar e excluir (com confirmacao Alert).
- Usa `useScaleRecipe` para receita escalada.
- **Imprimir / Compartilhar**: chama `exportRecipePdf` com a receita na escala atual
  (`displayRecipe` + totais recalculados). Erro -> `Alert.alert("Erro", ...)`.

### `CreateRecipeForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), categoria (obrigatorio), modo de preparo, rendimento (quantidade + unidade), ingredientes dinamicos (nome, quantidade, unidade).
- Rendimento aceita decimais (`keyboardType="decimal-pad"`, parse vírgula->ponto).
- Unidade de rendimento tem chips de atalho (`YIELD_UNIT_PRESETS`: unidades · fatias · porções · kg · g) + input livre.
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
- **#9 Rendimento decimal**: forms aceitam decimais (decimal-pad + vírgula->ponto) e chips
  de atalho de unidade (`yield-units.ts`). Backend armazena `numeric(10,3)`.
- **#11 Imprimir / Compartilhar (PDF)**: `recipe-pdf.ts` reusa a mesma abordagem de `labels`
  (`expo-print` + `expo-sharing`) — `printToFileAsync` + `shareAsync`, fallback `printAsync`.
  Botao no `RecipeDetail`. Client-side, sem mudanca de API.
- **#14 Conversao unidade↔peso/volume (LIGHT)**: em `recipe-materials-editor.tsx`, quando o insumo
  selecionado tem `contentPerUnit`/`contentUnit` (ex.: 1 lata = 350 ml), a linha mostra chips para
  escolher a unidade entre a do insumo e a de conteudo (armazenada no campo `unit` da linha). O
  preview de custo usa `effectiveCostPerUnit` local (`costPerUnit / contentPerUnit` quando a
  unidade da linha casa com a de conteudo). Sem conteudo no insumo, comportamento inalterado.
- 2026-06-15: **redesign da tela de Receitas**. Lista (`recipe-list.tsx`): top bar (em `recipes.tsx`) com voltar + "Estatísticas" (vai p/ `/insights`) + FAB pílula "Nova receita". **Empty state** rico: ilustração `assets/recipes-empty.png`, título serifado, botão "Cadastrar receita", card de 3 features (Calcule custos / Acompanhe lucros / Economize tempo) e "Saiba como funciona". `CreateRecipeForm` reescrito no estilo de campos com **ícone em círculo à esquerda** (header × + "Nova receita" serif + Fechar + subtítulo), categoria como **dropdown** (presets + digitar), modo de preparo com contador 0/1000, rendimento+unidade em 2 colunas com sub-labels, chips de unidade de rendimento com ícone, e botão "Salvar receita" com ícone de salvar. `RecipeMaterialsEditor`: header com cesta + subtítulo, chips de insumo com **`IngredientAvatar`** (emoji/cor agora, PNG quando publicado), trash no lugar de "Remover", "Adicionar insumo" tracejado rosa, e callback opcional `onTotalCost` (expõe o custo total ao pai). Obs.: alguns ícones do mockup (cupcake, cloche, copo-medida, fatia, balança, espátula) não existem no Ionicons — usados os mais próximos.
- 2026-07-11: `recipe-pdf.ts` ganhou rodapé "Feito com Lucro Caseiro" linkando pra
  ficha da Play Store (UTM `pdf`), mesmo padrão do catálogo público e do recibo.
- 2026-06-15: campos do form de receita extraídos para `recipe-form-fields.tsx` (FieldRow ícone-em-círculo, TextBox c/ contador opcional, CategoryField dropdown, InstructionsField 0/1000, YieldUnitChips, RecipeCostCard) — usados por create **e** edit (consistentes). **`EditRecipeForm`** reescrito no mesmo estilo + **card de custo** (custo total/por unidade via `onTotalCost`; por unidade = total/rendimento), nome com contador 0/80, "Salvar alterações" e "Excluir receita". **`RecipeDetail`**: header mostra o nome (em `recipes.tsx`), topo com cupcake + categoria, escala selecionada em rosa, **`IngredientAvatar`** na tabela de insumos. **Bug corrigido**: rendimento não duplica mais o "s" (presets já são plurais) em `recipe-detail`, `recipe-card` e na exibição — "Rende: 30 unidades" em vez de "unidadess"/"30 2s". Headers dos modais unificados em `RecipeModalHeader` (create = ×, detail/edit = voltar; edit com badge cupcake).
