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
    title: text("title").notNull(),
    deliveryDate: date("delivery_date").notNull(),
    deliveryTime: text("delivery_time"),
    status: orderStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    photoUrl: text("photo_url"),
    notes: text("notes"),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_orders_user_date").on(table.userId, table.deliveryDate),
    index("idx_orders_user_status").on(table.userId, table.status),
  ],
);
