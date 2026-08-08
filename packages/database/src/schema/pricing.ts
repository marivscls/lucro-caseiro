import { decimal, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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
  // Taxas percentuais (iFood, cartão...) sobre o preço de venda.
  feesPercent: decimal("fees_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  feesAmount: decimal("fees_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull().default("0"),
  allocationMode: varchar("allocation_mode", { length: 20 }).notNull().default("unit"),
  monthlyFixedCosts: decimal("monthly_fixed_costs", { precision: 12, scale: 2 }),
  revenueBasis: decimal("revenue_basis", { precision: 12, scale: 2 }),
  overheadPercent: decimal("overhead_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  channelName: varchar("channel_name", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pricingPreferences = pgTable("pricing_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  channelFees: jsonb("channel_fees")
    .$type<Array<{ id: string; name: string; percent: number }>>()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
