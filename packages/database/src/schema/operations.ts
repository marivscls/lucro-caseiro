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

import { materials } from "./materials";
import { products } from "./products";
import { recipes } from "./recipes";
import { users } from "./users";

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variationId: uuid("variation_id"),
    type: text("type").notNull(),
    delta: decimal("delta", { precision: 12, scale: 3 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 12, scale: 3 }),
    reason: text("reason"),
    sourceId: uuid("source_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_stock_movements_user_product").on(table.userId, table.productId),
    index("idx_stock_movements_user_date").on(table.userId, table.occurredAt),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    defaultPrice: decimal("default_price", { precision: 10, scale: 2 }),
    materialCost: decimal("material_cost", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    otherCost: decimal("other_cost", { precision: 10, scale: 2 }).notNull().default("0"),
    fixedCostShare: decimal("fixed_cost_share", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    markupPercent: decimal("markup_percent", { precision: 7, scale: 2 })
      .notNull()
      .default("0"),
    feesPercent: decimal("fees_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_services_user_active").on(table.userId, table.active),
    index("idx_services_user_name").on(table.userId, table.name),
  ],
);

export const productionRuns = pgTable(
  "production_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    recipeId: uuid("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 3 }).notNull(),
    producedQuantity: decimal("produced_quantity", { precision: 12, scale: 3 }).notNull(),
    plannedCost: decimal("planned_cost", { precision: 12, scale: 2 }).notNull(),
    actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).notNull(),
    wasteCost: decimal("waste_cost", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("closed"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_production_runs_user_created").on(table.userId, table.createdAt),
    index("idx_production_runs_user_product").on(table.userId, table.productId),
  ],
);

export const productionRunItems = pgTable(
  "production_run_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productionRunId: uuid("production_run_id")
      .notNull()
      .references(() => productionRuns.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 3 }).notNull(),
    actualQuantity: decimal("actual_quantity", { precision: 12, scale: 3 }).notNull(),
    wasteQuantity: decimal("waste_quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    unitCost: decimal("unit_cost", { precision: 12, scale: 4 }).notNull(),
  },
  (table) => [index("idx_production_run_items_run").on(table.productionRunId)],
);
