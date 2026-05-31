import { decimal, index, pgTable, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

// Junção de produto composto (kit/caixinha): liga um produto "kit" aos produtos
// que o compõem, cada um com sua quantidade. O custo do kit é a soma de
// (custo do componente x quantidade). MVP: componentes nao podem ser compostos
// (sem aninhamento), evitando recursao.
export const productComponents = pgTable(
  "product_components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    componentProductId: uuid("component_product_id")
      .notNull()
      .references(() => products.id),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  },
  (table) => [index("idx_product_components_product").on(table.productId)],
);
