import {
  date,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    birthday: date("birthday"),
    notes: text("notes"),
    tags: text("tags").array().notNull().default([]),
    totalSpent: decimal("total_spent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_clients_user").on(table.userId),
    index("idx_clients_user_phone").on(table.userId, table.phone),
  ],
);
