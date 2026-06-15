-- Ícone (emoji) escolhido pelo usuário para o insumo.
-- Nullable: sem ele, o avatar continua sendo resolvido automaticamente pelo nome.

ALTER TABLE materials ADD COLUMN icon text;
