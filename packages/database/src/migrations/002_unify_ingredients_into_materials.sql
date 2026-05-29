-- Migração 002 — Unificar Ingredientes em Insumos (materials) e fechar o ciclo do estoque.
--
-- Contexto: as receitas passam a consumir INSUMOS (tabela `materials`) em vez de
-- INGREDIENTES (tabela `ingredients`). Esta migração:
--   1. cria um insumo para cada ingrediente existente (custo por unidade = preço/qtd por embalagem);
--   2. adiciona `material_id` em `recipe_ingredients` e faz o backfill a partir do mapeamento;
--   3. afrouxa o NOT NULL da coluna legada `ingredient_id` para permitir novos inserts só com material.
--
-- É idempotente (pode rodar mais de uma vez sem duplicar). Rode no SQL Editor do Supabase.
-- Execute logo após o deploy da API com a Fase 1 do ciclo de estoque.

BEGIN;

-- 1. coluna de rastreio da origem (qual ingrediente originou cada insumo)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS legacy_ingredient_id uuid;

-- 2. cria um insumo para cada ingrediente que ainda não foi migrado
INSERT INTO materials (user_id, name, unit, stock_quantity, cost_per_unit, legacy_ingredient_id)
SELECT
  i.user_id,
  i.name,
  i.unit,
  0,
  CASE
    WHEN i.quantity_per_package IS NOT NULL AND i.quantity_per_package <> 0
      THEN ROUND(i.price / i.quantity_per_package, 2)
    ELSE i.price
  END,
  i.id
FROM ingredients i
WHERE NOT EXISTS (
  SELECT 1 FROM materials m WHERE m.legacy_ingredient_id = i.id
);

-- 3. adiciona material_id em recipe_ingredients
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS material_id uuid;

-- 4. backfill: aponta cada linha de receita para o insumo correspondente
UPDATE recipe_ingredients ri
SET material_id = m.id
FROM materials m
WHERE m.legacy_ingredient_id = ri.ingredient_id
  AND ri.material_id IS NULL;

-- 5. permite novos inserts só com material_id (a coluna legada vira opcional)
ALTER TABLE recipe_ingredients ALTER COLUMN ingredient_id DROP NOT NULL;

COMMIT;

-- ------------------------------------------------------------------------------------
-- LIMPEZA (opcional, rodar SÓ depois de confirmar que tudo funciona — irreversível):
--   ALTER TABLE recipe_ingredients DROP COLUMN ingredient_id;
--   ALTER TABLE materials DROP COLUMN legacy_ingredient_id;
--   DROP TABLE ingredients;
-- ------------------------------------------------------------------------------------
