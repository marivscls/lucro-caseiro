import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    photoUrl: text("photo_url"),
    // Fotos adicionais (galeria), além da principal `photoUrl`. Máx 2 (total 3);
    // exclusivo do plano Premium (gate na rota).
    extraPhotos: text("extra_photos")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    // Código/SKU/código de barras (opcional) para buscar/escanear o produto.
    code: text("code"),
    salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
    // Unidade de venda: "unit" (por unidade) ou "kg" (por quilo). Quando "kg",
    // salePrice representa o preco por quilo (R$/kg).
    saleUnit: text("sale_unit").notNull().default("unit"),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    recipeId: uuid("recipe_id"),
    stockQuantity: integer("stock_quantity"),
    stockAlertThreshold: integer("stock_alert_threshold"),
    // Produto composto (kit/caixinha): quando true, o custo e os componentes
    // vem da tabela product_components. Ver schema/product-components.ts.
    isComposite: boolean("is_composite").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_user").on(table.userId),
    index("idx_products_user_name").on(table.userId, table.name),
    index("idx_products_user_code").on(table.userId, table.code),
  ],
);
