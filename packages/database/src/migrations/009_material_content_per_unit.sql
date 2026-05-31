-- #14 Conversão unidade↔peso/volume (LIGHT).
-- Um insumo pode declarar opcionalmente quanto "conteúdo" cabe em 1 unidade
-- (ex.: 1 lata = 350 ml). Permite usar o insumo na receita pela unidade própria
-- (lata) OU pela unidade de conteúdo (ml), com conversão automática de custo.
-- Ambas as colunas são NULLABLE: sem elas, o comportamento é inalterado.

ALTER TABLE materials
  ADD COLUMN content_per_unit numeric(12, 3),
  ADD COLUMN content_unit text;
