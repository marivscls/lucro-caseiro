# PRD — Fechar o ciclo do estoque (unificar Ingredientes em Insumos)

> Status: em implementação. Decisão tomada com a usuária: **unificar** "Ingredientes"
> (catálogo de custo das receitas, sem estoque) em **Insumos** (`materials`, com estoque,
> alerta e custo por unidade). Passa a existir **um único cadastro de matéria-prima**.

## Problema

Hoje há dois cadastros desconectados:

- **Ingredientes** (`ingredients`): usados nas receitas só para calcular custo. Têm
  `price` (preço do pacote) + `quantityPerPackage` + `unit`. **Sem estoque.**
- **Insumos** (`materials`): têm `stockQuantity`, `stockAlertThreshold`, `costPerUnit`,
  `unit`. **Sem vínculo** com receitas/produtos/vendas.

Consequência: o "ciclo" está quebrado — vender baixa só o estoque do **produto final**;
receita não consome matéria-prima; insumo nunca baixa sozinho; precificação usa custos
digitados na mão.

## Objetivo

Um só conceito de matéria-prima (**Insumo**), e o ciclo fechado:

1. Receita é composta de **insumos** (quantidade + unidade), e seu custo vem do
   `costPerUnit` real do insumo.
2. Produto com receita tem o **custo real** preenchido a partir da receita.
3. Precificação puxa esse custo real (fim do "digitar à mão" do custo de ingredientes).
4. Ao **vender** um produto com receita, o estoque dos insumos da receita **baixa
   automaticamente** (quantidade da receita × quantidade vendida).

## Modelo de dados (alvo)

- `materials` permanece como o catálogo único (já tem unit, costPerUnit, stockQuantity,
  stockAlertThreshold, notes).
- `recipe_ingredients` passa a referenciar **`material_id`** (em vez de `ingredient_id`).
  Mantemos o nome da tabela para reduzir churn.
- Tabela `ingredients` é **aposentada** após a migração (deixada órfã; remoção física fica
  para um chore posterior, sem pressa — nada lê dela depois da migração).
- Custo da linha de receita = `quantity × material.costPerUnit` (insumo já tem custo por
  unidade; some o passo `price / quantityPerPackage` dos ingredientes).

### Migração (SQL manual no Supabase — migrations não rodam sozinhas)

1. `ALTER TABLE materials ADD COLUMN legacy_ingredient_id uuid;`
2. Inserir um insumo para cada ingrediente existente:
   `cost_per_unit = price / NULLIF(quantity_per_package,0)`, `stock_quantity = 0`,
   guardando `legacy_ingredient_id`.
3. `ALTER TABLE recipe_ingredients ADD COLUMN material_id uuid;`
4. Backfill: `recipe_ingredients.material_id = materials.id WHERE legacy_ingredient_id = ingredient_id`.
5. (Depois, opcional) `DROP COLUMN ingredient_id`, `DROP TABLE ingredients`, `DROP COLUMN legacy_ingredient_id`.

O SQL completo é entregue à usuária junto do deploy da fase 1.

## Contratos (mudanças)

- `RecipeIngredientDto`: `ingredientId` → **`materialId`**.
- `Recipe.ingredients[]` enriquecido: `ingredientName`→**`materialName`**,
  `ingredientPrice`→**`materialCostPerUnit`**, mantém `cost`.
- (Nome do campo `ingredients` no Recipe é mantido por enquanto para limitar churn.)

## Fases de implementação

- **Fase 1 — Receita consome insumos (custo real)**
  - Schema `recipe_ingredients.material_id`; contracts (`materialId`/`materialName`/
    `materialCostPerUnit`); recipes repo (join em `materials`), domain (custo via
    `costPerUnit`), types. Atualizar testes. SQL de migração entregue.
- **Fase 2 — Produto puxa custo da receita + precificação real**
  - Ao criar/editar produto com `recipeId`, preencher `costPrice` com o `costPerUnit` da
    receita. Precificação: permitir puxar `ingredientCost` do custo real da receita do
    produto (em vez de digitar).
- **Fase 3 — Baixa automática de insumos na venda**
  - Em `sales.usecases.createSale`: para cada item com produto que tem `recipeId`,
    consumir os insumos da receita (quantidade da receita × quantidade vendida) via
    `materials.adjustStock(-delta)`. Boundary: injetar provider de receita/insumo nas
    sales usecases (sem importar internals).
- **Fase 4 — Mobile: Insumos no lugar de Ingredientes**
  - Form de receita seleciona **insumos** (não mais ingredientes); telas/menções de
    "Ingredientes" passam a apontar para **Insumos**. Exibir custo real e alerta de
    estoque ao montar a receita.

## Não-objetivos (v1)

- Conversão de unidades (kg↔g) automática: assume-se que a unidade do insumo e da linha da
  receita são compatíveis (mesma base). Conversão fica para depois.
- Reposição automática / ordens de compra.
- "Produzir lote" (entrada de produto a partir de receita) — fora de escopo; o foco é a
  baixa no momento da venda.
- Remoção física da tabela `ingredients` (chore posterior).

## Riscos

- App já em produção (recipes/pricing). Mitigação: migração aditiva (não dropa nada na
  fase 1), código tolerante a linha sem insumo (custo 0), e SQL entregue para rodar logo
  após o deploy.
- Janela entre deploy e execução do SQL: receitas podem aparecer sem itens até o backfill.
  Aceitável para app de usuária única; instruir a rodar o SQL na sequência.
