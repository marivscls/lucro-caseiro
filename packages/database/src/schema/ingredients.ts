import { decimal, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const ingredients = pgTable(
  "ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    quantityPerPackage: decimal("quantity_per_package", {
      precision: 10,
      scale: 3,
    }).notNull(),
    unit: text("unit").notNull(),
    supplier: text("supplier"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_ingredients_user").on(table.userId)],
);
