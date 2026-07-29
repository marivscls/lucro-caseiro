import {
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { services } from "./operations";
import { servicePackagePurchases, serviceVariations } from "./operations";
import { sales } from "./sales";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "in_production",
  "ready",
  "done",
  "cancelled",
]);

// Encomendas / compromissos (agenda) — pipeline com data de entrega.
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    serviceVariationId: uuid("service_variation_id").references(
      () => serviceVariations.id,
      { onDelete: "set null" },
    ),
    serviceVariationName: text("service_variation_name"),
    serviceAddOnIds: uuid("service_add_on_ids").array().notNull().default([]),
    serviceAddOnNames: text("service_add_on_names").array().notNull().default([]),
    servicePackagePurchaseId: uuid("service_package_purchase_id").references(
      () => servicePackagePurchases.id,
      { onDelete: "set null" },
    ),
    durationMinutes: decimal("duration_minutes", { precision: 6, scale: 0 }),
    title: text("title").notNull(),
    deliveryDate: date("delivery_date").notNull(),
    deliveryTime: text("delivery_time"),
    status: orderStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    // Sinal/entrada ja recebido (parcial do amount).
    deposit: decimal("deposit", { precision: 10, scale: 2 }),
    // Personalizacao estruturada (papelaria/festas): tema, homenageado e cores.
    theme: text("theme"),
    honoree: text("honoree"),
    colors: text("colors"),
    photoUrl: text("photo_url"),
    notes: text("notes"),
    appointmentStatus: text("appointment_status"),
    locationMode: text("location_mode"),
    locationDetails: text("location_details"),
    actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_orders_user_date").on(table.userId, table.deliveryDate),
    index("idx_orders_user_status").on(table.userId, table.status),
  ],
);
