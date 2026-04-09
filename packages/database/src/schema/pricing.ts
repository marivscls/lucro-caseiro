import { decimal, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";
import { users } from "./users";

export const pricingCalculations = pgTable("pricing_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  ingredientCost: decimal("ingredient_cost", { precision: 10, scale: 2 }).notNull(),
  packagingCost: decimal("packaging_cost", { precision: 10, scale: 2 }).notNull(),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).notNull(),
  fixedCostShare: decimal("fixed_cost_share", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  marginPercent: decimal("margin_percent", { precision: 5, scale: 2 }).notNull(),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
