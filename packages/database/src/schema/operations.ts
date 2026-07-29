import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { materials } from "./materials";
import { clients } from "./clients";
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
    locationMode: text("location_mode").notNull().default("flexible"),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    publicEnabled: boolean("public_enabled").notNull().default(false),
    bookingInstructions: text("booking_instructions"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_services_user_active").on(table.userId, table.active),
    index("idx_services_user_name").on(table.userId, table.name),
  ],
);

export const serviceVariations = pgTable(
  "service_variations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_service_variations_service").on(
      table.userId,
      table.serviceId,
      table.active,
    ),
  ],
);

export const serviceAddOns = pgTable(
  "service_add_ons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_service_add_ons_service").on(table.userId, table.serviceId, table.active),
  ],
);

export const servicePackages = pgTable(
  "service_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sessions: integer("sessions").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    validityDays: integer("validity_days").notNull(),
    recurrenceDays: integer("recurrence_days"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_service_packages_service").on(table.userId, table.serviceId, table.active),
  ],
);

export const servicePackagePurchases = pgTable(
  "service_package_purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageId: uuid("package_id")
      .notNull()
      .references(() => servicePackages.id),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    sessionsTotal: integer("sessions_total").notNull(),
    sessionsUsed: integer("sessions_used").notNull().default(0),
    pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: date("expires_at").notNull(),
    status: text("status").notNull().default("active"),
    // FK criada na migration; sem import de sales para evitar ciclo de schemas.
    saleId: uuid("sale_id"),
  },
  (table) => [
    index("idx_service_package_purchases_client").on(
      table.userId,
      table.clientId,
      table.serviceId,
      table.status,
    ),
  ],
);

export const servicePackageSessionUsages = pgTable(
  "service_package_session_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => servicePackagePurchases.id, { onDelete: "cascade" }),
    // FK para orders é criada na migration; sem import para evitar ciclo de schemas.
    orderId: uuid("order_id").notNull().unique(),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_service_package_session_usages_purchase").on(
      table.userId,
      table.purchaseId,
    ),
  ],
);

export const publicServiceBookingRequests = pgTable(
  "public_service_booking_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    serviceName: text("service_name").notNull(),
    clientName: text("client_name").notNull(),
    phone: text("phone").notNull(),
    desiredDate: date("desired_date").notNull(),
    desiredTime: text("desired_time"),
    locationMode: text("location_mode").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_public_service_booking_requests_owner").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
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
