-- Código/SKU/código de barras do produto (opcional).
-- Permite buscar/escanear um produto pelo código. Nullable: sem ele, o produto
-- continua sendo encontrado pelo nome.

ALTER TABLE products ADD COLUMN code text;

-- Índice composto por usuário (toda query é user-scoped) para busca por código.
CREATE INDEX IF NOT EXISTS idx_products_user_code ON products (user_id, code);
