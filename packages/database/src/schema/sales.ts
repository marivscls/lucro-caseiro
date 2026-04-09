import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { products } from "./products";
import { users } from "./users";

export const saleStatusEnum = pgEnum("sale_status", ["pending", "paid", "cancelled"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "cash",
  "card",
  "credit",
  "transfer",
]);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    status: saleStatusEnum("status").notNull().default("paid"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_sales_user").on(table.userId),
    index("idx_sales_user_date").on(table.userId, table.soldAt),
    index("idx_sales_user_status").on(table.userId, table.status),
  ],
);

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});
