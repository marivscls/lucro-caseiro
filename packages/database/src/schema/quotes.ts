import {
  date,
  decimal,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { orders } from "./orders";
import { users } from "./users";

// Orçamentos: proposta antes da encomenda/venda. Itens livres em jsonb.
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name"),
    title: text("title").notNull(),
    items: jsonb("items").notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"),
    validUntil: date("valid_until"),
    notes: text("notes"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_quotes_user_status").on(table.userId, table.status),
    index("idx_quotes_user_created").on(table.userId, table.createdAt),
  ],
);
