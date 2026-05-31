-- Rendimento (yield) da receita passa a aceitar decimais (ex.: 1,5 kg, 0,5 fatia).
-- Antes: yield_quantity era integer e nao permitia armazenar "1,5 kg".
-- Depois: numeric(10,3) — mesma escala usada em recipe_ingredients.quantity.

ALTER TABLE recipes
  ALTER COLUMN yield_quantity TYPE numeric(10, 3) USING yield_quantity::numeric;
