-- Produto composto / kit / caixinha.
-- Um produto pode ser montado a partir de OUTROS produtos (cada um com uma quantidade).
-- O custo do kit e calculado automaticamente: soma de (custo do componente x quantidade).
-- MVP: componentes nao podem ser compostos (sem aninhamento), evitando recursao.

-- 1) products.is_composite: marca o produto como kit.
ALTER TABLE products
  ADD COLUMN is_composite BOOLEAN NOT NULL DEFAULT false;

-- 2) product_components: junção kit -> produtos que o compõem.
CREATE TABLE product_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(10, 3) NOT NULL
);

CREATE INDEX idx_product_components_product ON product_components(product_id);
