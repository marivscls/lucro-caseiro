import { decimal, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

// Insumos / matéria-prima — catálogo + estoque (separado dos produtos acabados).
export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unit: text("unit").notNull(),
    stockQuantity: decimal("stock_quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    stockAlertThreshold: decimal("stock_alert_threshold", { precision: 12, scale: 3 }),
    costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
    // #14: conteúdo por unidade (ex.: 1 lata = 350 ml). Ambos nullable/opcionais.
    contentPerUnit: decimal("content_per_unit", { precision: 12, scale: 3 }),
    contentUnit: text("content_unit"),
    notes: text("notes"),
    // Ícone (emoji) escolhido pelo usuário; nullable -> avatar automático pelo nome.
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_materials_user").on(table.userId),
    index("idx_materials_user_name").on(table.userId, table.name),
  ],
);
